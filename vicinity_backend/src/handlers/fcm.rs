//! ---------------
//! Thin wrapper around Firebase Cloud Messaging HTTP v1.
//! In this stub we just log; swap the body for a real reqwest call.
//!

use sqlx::PgPool;
use uuid::Uuid;

pub async fn send_match(db: &PgPool, user_id: Uuid, body: &str) -> anyhow::Result<()> {
    let token: Option<(String,)> =
        sqlx::query_as("SELECT fcm_token FROM users WHERE id = $1 AND fcm_token IS NOT NULL")
            .bind(user_id)
            .fetch_optional(db)
            .await?;

    // No token → user hasn't granted push perms or hasn't logged in on this device.
    let Some((_t,)) = token else {
        tracing::debug!(%user_id, "no fcm token, skipping push");
        return Ok(());
    };

    // TODO: POST to https://fcm.googleapis.com/v1/projects/{project}/messages:send
    // with an OAuth2 bearer token, payload { "message": { "token": ..., "notification": {...} } }.
    tracing::info!(%user_id, body, "FCM push (stub)");
    Ok(())
}

pub async fn send_safe_word_alert(
    db: &PgPool,
    meet_id: Uuid,
    triggered_by: Uuid,
) -> anyhow::Result<()> {
    // Look up the meet participants so the log line is useful.
    let participants: Option<(Uuid, Uuid)> =
        sqlx::query_as("SELECT user_a_id, user_b_id FROM meets WHERE id = $1")
            .bind(meet_id)
            .fetch_optional(db)
            .await?;

    tracing::warn!(
        %meet_id,
        %triggered_by,
        ?participants,
        "SAFE WORD TRIGGERED — manual follow-up required"
    );

    // TODO: page on-call / insert into an ops queue / send Slack webhook.
    Ok(())
}

pub async fn send_nudge_mutual(db: &PgPool, user_a: Uuid, user_b: Uuid) -> anyhow::Result<()> {
    tracing::info!(%user_a, %user_b, "nudge is mutual — push both users");
    let _ = db; // real version reads devices.fcm_token
    Ok(())
}
