//! match_engine/gates.rs
//! ---------------------
//! Pre-notification gates (spec Step 5, steps 4–6).
//! Each gate returns `false` when the match should be *dropped*.
//! Behaviour:
//!   - `score_passes`   : score must be >= MIN_SCORE (70).
//!   - `cooldown_clear` : no pair cooldown key for (A,B).
//!   - `daily_cap_ok`   : A and B each have < MAX_PER_DAY notifications.

use crate::config::Config;
use crate::redis_client::Redis;
use uuid::Uuid;

/// Gate 4 — score threshold.
pub fn score_passes(score: f64, cfg: &Config) -> bool {
    score >= cfg.match_min_score
}

/// Gate 5 — 24 h pair cooldown.
pub async fn cooldown_clear(redis: &Redis, a: Uuid, b: Uuid) -> redis::RedisResult<bool> {
    // `get_pair_cooldown` returns true if a cooldown key exists.
    Ok(!redis.get_pair_cooldown(a, b).await?)
}

/// Gate 6 — daily cap. Returns `true` only if BOTH users are under the cap.
pub async fn daily_cap_ok(
    redis: &Redis,
    cfg: &Config,
    a: Uuid,
    b: Uuid,
    today: &str,
) -> redis::RedisResult<bool> {
    let a_count = redis.get_user_daily(a, today).await?;
    let b_count = redis.get_user_daily(b, today).await?;
    Ok(a_count < cfg.match_max_per_day && b_count < cfg.match_max_per_day)
}
