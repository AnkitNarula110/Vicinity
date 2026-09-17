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
