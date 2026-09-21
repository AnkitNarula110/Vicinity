//! repos/blocks.rs
//! ---------------
use sqlx::PgPool;
use uuid::Uuid;

pub async fn is_blocked(pool: &PgPool, a: Uuid, b: Uuid) -> sqlx::Result<bool> {
    let row: Option<(i64,)> = sqlx::query_as(
        "SELECT 1 FROM blocks
         WHERE (blocker_id = $1 AND blocked_id = $2)
            OR (blocker_id = $2 AND blocked_id = $1)
         LIMIT 1",
    )
    .bind(a)
    .bind(b)
    .fetch_optional(pool)
    .await?;
    Ok(row.is_some())
}
