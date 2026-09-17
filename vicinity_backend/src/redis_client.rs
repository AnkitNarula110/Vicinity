//! Redis connection + every key pattern from step 2 of the spec
//! Behaviour:
//!        -'Connection manager' reconnects automatically.
//!          - All key builders are pure functions - easy to unit test.
//!          - All async fns return `redis::RedisResult<...>`.

use redis::aio::ConnectionManager; // auto-reconnecting async client
use redis::AsyncCommands; // brings `.get`, `.set_ex`, `.zadd`, etc. into scope
use uuid::Uuid;

//Newtype wrapper so we can 'impl' on it
#[derive(Clone)]
pub struct Redis(pub ConnectionManager);

impl Redis {
    // connect to Redis using redis_url
    pub async fn connect(redis_url: &str) -> redis::RedisResult<Self> {
        // `Client::open` parses the URL; `get_connection_manager` returns
        // a manager that transparently reconnects after failures.
        let client = redis::Client::open(redis_url)?;
        let mgr = client.get_connection_manager().await?;
        Ok(Self(mgr))
    }

    // ----------Key builders------------

    /// `ble:token:{token}` -> user_id. TTL 17 min.
    pub fn key_ble_token(token: &str) -> String {
        format!("ble:token:{token}")
    }

    /// `user:vector:{user_id}` -> hash {tag: weight}. TTL 24 h.
    pub fn key_user_vector(user_id: Uuid) -> String {
        format!("user:vector:{user_id}")
    }

    /// `venue:{venue_id}:users` -> sorted set {user_id: last_seen_ts}.
    pub fn key_venue_users(venue_id: &str) -> String {
        format!("venue:{venue_id}:users")
    }

    /// `pair:cooldown:{user_a}:{user_b}` -> "1". TTL 24 h.
    /// Order is normalised (lexicographically smaller UUID first)
    /// so A→B and B→A hit the same key.
    pub fn key_pair_cooldown(a: Uuid, b: Uuid) -> String {
        let (lo, hi) = if a < b { (a, b) } else { (b, a) };
        format!("pair:cooldown:{lo}:{hi}")
    }

    /// `user:daily:{user_id}:{date}` -> integer counter. TTL 24 h.
    pub fn key_user_daily(user_id: Uuid, date: &str) -> String {
        format!("user:daily:{user_id}:{date}")
    }

    /// `meet:location:{meet_id}` -> hash of lat/lng/landmark. TTL 15 min.
    pub fn key_meet_location(meet_id: Uuid) -> String {
        format!("meet:location:{meet_id}")
    }

    ///-----------------Ble token ops--------------------

    /// Stores `ble:token:{token} = user_id` with a TTL.
    /// `EX` takes seconds, matching the spec (`EX 1020`).
    pub async fn set_ble_token(
        &self,
        token: &str,
        user_id: Uuid,
        ttl_secs: i64,
    ) -> redis::RedisResult<()> {
        let mut conn = self.0.clone();
        // `set_ex` = SET key value EX seconds. Returns "OK".
        conn.set_ex(
            Self::key_ble_token(token),
            user_id.to_string(),
            ttl_secs as u64,
        )
        .await
    }

    /// Looks up a BLE token. Returns `None` if expired / unknown.
    pub async fn get_ble_token(&self, token: &str) -> redis::RedisResult<Option<Uuid>> {
        let mut conn = self.0.clone();
        // `get` returns Option<String>; `None` means key missing.
        let raw: Option<String> = conn.get(Self::key_ble_token(token)).await?;
        Ok(raw.and_then(|s| Uuid::parse_str(&s).ok()))
    }

    // ---------- Venue presence ----------

    /// Upserts a user into the venue sorted set with `score = now_ts`.
    /// `ZADD` overwrites an existing member's score.
    pub async fn zadd_venue_user(
        &self,
        venue_id: &str,
        user_id: Uuid,
        ts: i64,
    ) -> redis::RedisResult<()> {
        let mut conn = self.0.clone();
        conn.zadd(Self::key_venue_users(venue_id), user_id.to_string(), ts)
            .await
    }

    /// Returns (user_id, last_seen_ts) for everyone in `venue_id`
    /// whose score is >= `min_score`. Used by `/nearby`.
    pub async fn zrangebyscore_venue_users(
        &self,
        venue_id: &str,
        min_score: i64,
    ) -> redis::RedisResult<Vec<(String, i64)>> {
        let mut conn = self.0.clone();
        // `zrangebyscore_withscores` returns Vec<(member, score)>.
        conn.zrangebyscore_withscores(
            Self::key_venue_users(venue_id),
            min_score, // inclusive lower bound
            "+inf",    // inclusive upper bound (no cap)
        )
        .await
    }

    /// Removes stale members (score < cutoff). Called on each read
    /// per spec: "Remove members with score older than 5 minutes on each read."
    pub async fn zremrangebyscore_venue_users(
        &self,
        venue_id: &str,
        cutoff: i64,
    ) -> redis::RedisResult<()> {
        let mut conn = self.0.clone();
        // Removes all members with score in (-inf, cutoff).
        conn.zrembyscore(Self::key_venue_users(venue_id), "-inf", cutoff)
            .await
    }

    // ---------- Cooldown ----------

    pub async fn set_pair_cooldown(
        &self,
        a: Uuid,
        b: Uuid,
        ttl_secs: i64,
    ) -> redis::RedisResult<()> {
        let mut conn = self.0.clone();
        conn.set_ex(Self::key_pair_cooldown(a, b), "1", ttl_secs as u64)
            .await
    }

    pub async fn get_pair_cooldown(&self, a: Uuid, b: Uuid) -> redis::RedisResult<bool> {
        let mut conn = self.0.clone();
        // `exists` returns the number of keys that exist (0 or 1).
        let n: i64 = conn.exists(Self::key_pair_cooldown(a, b)).await?;
        Ok(n > 0)
    }

    // ---------- Daily cap ----------

    /// Increments `user:daily:{uid}:{date}` and returns the new value.
    /// Sets the TTL only on the first increment (when the key is new).
    pub async fn incr_user_daily(
        &self,
        user_id: Uuid,
        date: &str,
        ttl_secs: i64,
    ) -> redis::RedisResult<i64> {
        let mut conn = self.0.clone();
        let key = Self::key_user_daily(user_id, date);
        // `incr` returns the value *after* incrementing.
        let val: i64 = conn.incr(&key, 1).await?;
        // If we just created the key, val == 1 → set expiry once.
        if val == 1 {
            // `expire` returns true if the timeout was set.
            let _: bool = conn.expire(&key, ttl_secs).await?;
        }
        Ok(val)
    }

    pub async fn get_user_daily(&self, user_id: Uuid, date: &str) -> redis::RedisResult<i64> {
        let mut conn = self.0.clone();
        // `get` returns Option<String>; parse to i64, default 0.
        let raw: Option<String> = conn.get(Self::key_user_daily(user_id, date)).await?;
        Ok(raw.and_then(|s| s.parse().ok()).unwrap_or(0))
    }
}
