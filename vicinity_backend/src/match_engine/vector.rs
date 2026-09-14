//! match_engine/vector.rs
//! ----------------------
//! Interest-vector fetch + rebuild.
//! Behaviour (spec Step 5, steps 1–2):
//!   - `get_or_rebuild` first tries Redis HGETALL on `user:vector:{id}`.
//!   - On a cache miss, it reads the `interests` table from Postgres
//!     and writes the hash back into Redis with a 24 h TTL.
//!   - Returns a `HashMap<String, f64>` (tag → weight).

use redis::AsyncCommands;
use sqlx::PgPool;
use std::collections::HashMap;
use uuid::Uuid;

use crate::redis_client::Redis;

/// Returns the interest vector for `user_id`, building it if necessary.
pub async fn get_or_rebuild(
    db: &PgPool,
    redis: &Redis,
    user_id: Uuid,
) -> anyhow::Result<HashMap<String, f64>> {
    let key = Redis::key_user_vector(user_id);

    // 1. Try Redis first. `hgetall` returns a HashMap<String, String>.
    {
        let mut conn = redis.0.clone();
        let cached: HashMap<String, String> = conn.hgetall(&key).await?;
        if !cached.is_empty() {
            // Convert stored strings back to f64 weights.
            return Ok(cached
                .into_iter()
                .filter_map(|(k, v)| v.parse::<f64>().ok().map(|w| (k, w)))
                .collect());
        }
    }

    // 2. Cache miss — read from Postgres.
    //    `query_as` maps each row to (tag, weight).
    let rows: Vec<(String, f64)> =
        sqlx::query_as("SELECT tag, weight FROM interests WHERE user_id = $1")
            .bind(user_id)
            .fetch_all(db)
            .await?;

    // Nothing to cache if the user has no interests.
    if rows.is_empty() {
        return Ok(HashMap::new());
    }

    // 3. Write the hash to Redis and set a 24 h TTL.
    {
        let mut conn = redis.0.clone();
        // Build an HSET command with all (field, value) pairs at once.
        let mut cmd = redis::cmd("HSET");
        cmd.arg(&key);
        for (tag, weight) in &rows {
            cmd.arg(tag).arg(weight.to_string());
        }
        // `query_async` sends the command and ignores the integer reply.
        let _: () = cmd.query_async(&mut conn).await?;
        // 24 h TTL — refreshed on every rebuild.
        let _: bool = conn.expire(&key, 24 * 3600).await?;
    }

    Ok(rows.into_iter().collect())
}
