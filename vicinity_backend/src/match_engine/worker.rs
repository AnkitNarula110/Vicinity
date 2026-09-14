//! match_engine/worker.rs
//! ----------------------
//! The 9-gate scoring pipeline (spec Step 5).
//! Behaviour, in order:
//!   1. Fetch A's vector (Redis → Postgres fallback).
//!   2. Fetch B's vector.
//!   3. Compute dot-product score (0–100).
//!   4. Drop if score < 70.
//!   5. Drop if pair cooldown exists.
//!   6. Drop if either user is at the daily cap.
//!   7. Send FCM push to both users.
//!   8. Set 24 h pair cooldown.
//!   9. Increment both daily counters.
//!  10. Insert a "notified" row into `nudges` for auditability.

use sqlx::PgPool;
use std::sync::Arc;
use uuid::Uuid;

use crate::config::Config;
use crate::match_engine::queue::MatchJob;
use crate::match_engine::{gates, scoring, vector};
use crate::redis_client::Redis;
use crate::services::fcm; // your FCM wrapper; shown as a stub below

pub async fn process_job(
    cfg: &Arc<Config>,
    db: &PgPool,
    redis: &Redis,
    job: &MatchJob,
) -> anyhow::Result<()> {
    let (a, b) = (job.user_a, job.user_b);

    // 1 & 2. Fetch both interest vectors.
    let va = vector::get_or_rebuild(db, redis, a).await?;
    let vb = vector::get_or_rebuild(db, redis, b).await?;

    // 3. Score.
    let score = scoring::dot_product_score(&va, &vb);

    // 4. Gate: minimum score.
    if !gates::score_passes(score, cfg) {
        tracing::debug!(%a, %b, score, "drop: below score threshold");
        return Ok(());
    }

    // 5. Gate: 24 h pair cooldown.
    if !gates::cooldown_clear(redis, a, b).await? {
        tracing::debug!(%a, %b, "drop: pair cooldown");
        return Ok(());
    }

    // 6. Gate: daily notification cap (checked for both users).
    let today = chrono::Utc::now().format("%Y-%m-%d").to_string();
    if !gates::daily_cap_ok(redis, cfg, a, b, &today).await? {
        tracing::debug!(%a, %b, "drop: daily cap");
        return Ok(());
    }

    // 7. All gates passed — send FCM push to both users.
    //    `fcm::send_match` is a stub in this example; wire it to the
    //    Firebase HTTP v1 API using each user's `fcm_token`.
    let body = format!("Someone nearby shares your world ({:.0}%)", score);
    fcm::send_match(db, a, &body).await?;
    fcm::send_match(db, b, &body).await?;

    // 8. Set pair cooldown so we never re-notify within 24 h.
    redis
        .set_pair_cooldown(a, b, cfg.pair_cooldown_secs)
        .await?;

    // 9. Increment daily counters (sets TTL on first increment).
    redis.incr_user_daily(a, &today, 86_400).await?;
    redis.incr_user_daily(b, &today, 86_400).await?;

    // 10. Audit row. Spec says `{from_user_id: null, to_user_id: null, status: "notified"}`.
    //     In Rust we bind Option::<Uuid>::None to nullable UUID columns.
    let id = Uuid::new_v4();
    sqlx::query(
        r#"
        INSERT INTO nudges (id, from_user_id, to_user_id, status, created_at, updated_at)
        VALUES ($1, NULL, NULL, 'notified', now(), now())
        "#,
    )
    .bind(id)
    .execute(db)
    .await?;

    tracing::info!(%a, %b, score, "match notified");
    Ok(())
}
