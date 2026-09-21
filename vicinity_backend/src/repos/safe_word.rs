//! repos/safe_word.rs
//! ------------------
use sqlx::PgPool;
use uuid::Uuid;

pub async fn create(
    pool: &PgPool,
    meet_id: Uuid,
    user_id: Uuid,
    note: Option<&str>,
) -> sqlx::Result<Uuid> {
    let (id,): (Uuid,) = sqlx::query_as(
        "INSERT INTO safe_word_flags (meet_id, triggered_by, note)
         VALUES ($1, $2, $3) RETURNING id",
    )
    .bind(meet_id)
    .bind(user_id)
    .bind(note)
    .fetch_one(pool)
    .await?;
    Ok(id)
}
