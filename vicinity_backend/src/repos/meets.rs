//! repos/meets.rs
//! --------------
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

pub struct MeetRow {
    pub id: Uuid,
    pub user_a_id: Uuid,
    pub user_b_id: Uuid,
    pub confirmed_by_a: bool,
    pub confirmed_by_b: bool,
}

impl MeetRow {
    pub fn id(&self) -> Uuid {
        self.id
    }
    pub fn user_a_id(&self) -> Uuid {
        self.user_a_id
    }
    pub fn user_b_id(&self) -> Uuid {
        self.user_b_id
    }
    pub fn is_fully_confirmed(&self) -> bool {
        self.confirmed_by_a && self.confirmed_by_b
    }
}

pub async fn confirm(pool: &PgPool, nudge_id: Uuid, user_id: Uuid) -> sqlx::Result<MeetRow> {
    // We need the two users involved. Get from nudges.
    let pair: (Uuid, Uuid) =
        sqlx::query_as("SELECT from_user_id, to_user_id FROM nudges WHERE id = $1")
            .bind(nudge_id)
            .fetch_one(pool)
            .await?;

    let (mut a, mut b) = pair;
    if a > b {
        std::mem::swap(&mut a, &mut b);
    }

    let confirmed_a = a == user_id;
    let confirmed_b = b == user_id;

    // Upsert. Second confirmation fills the other flag.
    let row: (Uuid, Uuid, Uuid, bool, bool) = sqlx::query_as(
        r#"
        INSERT INTO meets (user_a_id, user_b_id, nudge_id, confirmed_at,
                           location_expires_at, confirmed_by_a, confirmed_by_b)
        VALUES ($1, $2, $3, now(), now() + interval '15 minutes', $4, $5)
        ON CONFLICT (nudge_id) DO UPDATE SET
            confirmed_by_a = meets.confirmed_by_a OR EXCLUDED.confirmed_by_a,
            confirmed_by_b = meets.confirmed_by_b OR EXCLUDED.confirmed_by_b,
            confirmed_at   = COALESCE(meets.confirmed_at, now()),
            location_expires_at = CASE
                WHEN meets.confirmed_by_a OR EXCLUDED.confirmed_by_a THEN
                    CASE WHEN meets.confirmed_by_b OR EXCLUDED.confirmed_by_b
                         THEN now() + interval '15 minutes'
                         ELSE meets.location_expires_at END
                ELSE meets.location_expires_at END
        RETURNING id, user_a_id, user_b_id, confirmed_by_a, confirmed_by_b
        "#,
    )
    .bind(a)
    .bind(b)
    .bind(nudge_id)
    .bind(confirmed_a)
    .bind(confirmed_b)
    .fetch_one(pool)
    .await?;

    Ok(MeetRow {
        id: row.0,
        user_a_id: row.1,
        user_b_id: row.2,
        confirmed_by_a: row.3,
        confirmed_by_b: row.4,
    })
}

pub async fn get_by_id(pool: &PgPool, id: Uuid) -> anyhow::Result<Option<serde_json::Value>> {
    let row: Option<(
        Uuid,
        Uuid,
        Uuid,
        Uuid,
        Option<chrono::DateTime<chrono::Utc>>,
        Option<chrono::DateTime<chrono::Utc>>,
    )> = sqlx::query_as(
        "SELECT id, user_a_id, user_b_id, nudge_id, confirmed_at, location_expires_at
             FROM meets WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(|(id, a, b, n, c, e)| {
        json!({
            "id": id, "user_a_id": a, "user_b_id": b,
            "nudge_id": n, "confirmed_at": c, "location_expires_at": e,
        })
    }))
}

pub async fn get_with_location(
    pool: &PgPool,
    redis: &crate::redis_client::Redis,
    id: Uuid,
) -> anyhow::Result<Option<serde_json::Value>> {
    let base = get_by_id(pool, id).await?;
    let Some(mut meet) = base else {
        return Ok(None);
    };

    // Attach location only if the Redis hash still exists.
    if let Some(loc) = redis.get_meet_location(id).await? {
        meet["location"] = loc;
    }
    Ok(Some(meet))
}

pub async fn has_meet_between(pool: &PgPool, a: Uuid, b: Uuid) -> sqlx::Result<bool> {
    let (lo, hi) = if a < b { (a, b) } else { (b, a) };
    let row: Option<(i64,)> =
        sqlx::query_as("SELECT 1 FROM meets WHERE user_a_id = $1 AND user_b_id = $2 LIMIT 1")
            .bind(lo)
            .bind(hi)
            .fetch_optional(pool)
            .await?;
    Ok(row.is_some())
}
