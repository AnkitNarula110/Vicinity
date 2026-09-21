//! repos/photos.rs
//! ---------------
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

pub async fn list_for_user(
    pool: &PgPool,
    user_id: Uuid,
    include_locked: bool,
) -> anyhow::Result<Vec<serde_json::Value>> {
    let rows: Vec<(Uuid, String, i32)> = if include_locked {
        sqlx::query_as("SELECT id, url, position FROM photos WHERE user_id = $1 ORDER BY position")
            .bind(user_id)
            .fetch_all(pool)
            .await?
    } else {
        sqlx::query_as("SELECT id, url, position FROM photos WHERE user_id = $1 AND position = 0")
            .bind(user_id)
            .fetch_all(pool)
            .await?
    };

    Ok(rows
        .into_iter()
        .map(|(id, url, pos)| json!({"id": id, "url": url, "position": pos}))
        .collect())
}
