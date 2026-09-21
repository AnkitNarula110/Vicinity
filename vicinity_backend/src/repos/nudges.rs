//! repos/nudges.rs
//! ---------------
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

pub struct NudgeRow {
    pub id: Uuid,
    pub status: String,
}

impl NudgeRow {
    pub fn id(&self) -> Uuid {
        self.id
    }
    pub fn status(&self) -> &str {
        &self.status
    }
}

pub async fn create_or_get(pool: &PgPool, from: Uuid, to: Uuid) -> sqlx::Result<NudgeRow> {
    // Upsert: if a nudge already exists, keep it.
    let row: (Uuid, String) = sqlx::query_as(
        r#"
        INSERT INTO nudges (from_user_id, to_user_id, status)
        VALUES ($1, $2, 'pending')
        ON CONFLICT (from_user_id, to_user_id) WHERE from_user_id IS NOT NULL AND to_user_id IS NOT NULL
        DO UPDATE SET updated_at = now()
        RETURNING id, status::text
        "#,
    )
    .bind(from)
    .bind(to)
    .fetch_one(pool)
    .await?;
    Ok(NudgeRow {
        id: row.0,
        status: row.1,
    })
}

pub async fn promote_if_mutual(pool: &PgPool, a: Uuid, b: Uuid) -> sqlx::Result<bool> {
    // Look for the reverse nudge in 'pending'.
    let reverse: Option<(Uuid,)> = sqlx::query_as(
        "SELECT id FROM nudges WHERE from_user_id = $1 AND to_user_id = $2 AND status = 'pending'",
    )
    .bind(b)
    .bind(a)
    .fetch_optional(pool)
    .await?;

    if reverse.is_none() {
        return Ok(false);
    }

    // Promote both to mutual.
    sqlx::query(
        "UPDATE nudges SET status = 'mutual', updated_at = now()
         WHERE (from_user_id = $1 AND to_user_id = $2) OR (from_user_id = $2 AND to_user_id = $1)",
    )
    .bind(a)
    .bind(b)
    .execute(pool)
    .await?;

    Ok(true)
}

pub async fn get_by_id(pool: &PgPool, id: Uuid) -> anyhow::Result<Option<serde_json::Value>> {
    let row: Option<(Uuid, Option<Uuid>, Option<Uuid>, String, chrono::DateTime<chrono::Utc>, chrono::DateTime<chrono::Utc>)> =
        sqlx::query_as("SELECT id, from_user_id, to_user_id, status::text, created_at, updated_at FROM nudges WHERE id = $1")
            .bind(id)
            .fetch_optional(pool)
            .await?;

    Ok(row.map(|(id, from, to, status, created_at, updated_at)| {
        json!({
            "id": id,
            "from_user_id": from,
            "to_user_id": to,
            "status": status,
            "created_at": created_at,
            "updated_at": updated_at,
        })
    }))
}

pub async fn list_for_user(pool: &PgPool, user_id: Uuid) -> anyhow::Result<Vec<serde_json::Value>> {
    let rows: Vec<(
        Uuid,
        Option<Uuid>,
        Option<Uuid>,
        String,
        chrono::DateTime<chrono::Utc>,
        chrono::DateTime<chrono::Utc>,
    )> = sqlx::query_as(
        "SELECT id, from_user_id, to_user_id, status::text, created_at, updated_at
             FROM nudges
             WHERE from_user_id = $1 OR to_user_id = $1
             ORDER BY updated_at DESC",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    Ok(rows
        .into_iter()
        .map(|(id, from, to, status, c, u)| {
            json!({
                "id": id, "from_user_id": from, "to_user_id": to,
                "status": status, "created_at": c, "updated_at": u,
            })
        })
        .collect())
}

pub async fn cancel(pool: &PgPool, id: Uuid, user_id: Uuid) -> sqlx::Result<()> {
    sqlx::query(
        "UPDATE nudges SET status = 'declined', updated_at = now()
         WHERE id = $1 AND from_user_id = $2 AND status = 'pending'",
    )
    .bind(id)
    .bind(user_id)
    .execute(pool)
    .await?;
    Ok(())
}
