//! repos/users.rs
//! --------------
//! User queries. Returns serde_json::Value so handlers can shape the output.

use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

pub struct UserProfileRow {
    pub display_name: String,
    pub avatar_url: Option<String>,
}

pub async fn get_profile(pool: &PgPool, id: Uuid) -> sqlx::Result<Option<UserProfileRow>> {
    let row: Option<(Option<String>, Option<String>, Option<String>)> = sqlx::query_as(
        "SELECT COALESCE(display_name, username), avatar_url, bio FROM users WHERE userid = $1",
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;
    Ok(row.map(|(name, avatar, _bio)| UserProfileRow {
        display_name: name.unwrap_or_else(|| "Someone".into()),
        avatar_url: avatar,
    }))
}

pub async fn get_full_profile(
    pool: &PgPool,
    id: Uuid,
) -> anyhow::Result<Option<serde_json::Value>> {
    let user: Option<(
        Uuid,
        Option<String>,
        Option<String>,
        Option<String>,
        Option<String>,
    )> = sqlx::query_as(
        "SELECT userid, COALESCE(display_name, username), bio, avatar_url, username
             FROM users WHERE userid = $1",
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    let Some((uid, name, bio, avatar, _uname)) = user else {
        return Ok(None);
    };

    let interests: Vec<(String, f64)> =
        sqlx::query_as("SELECT tag, weight::float8 FROM interests WHERE user_id = $1")
            .bind(id)
            .fetch_all(pool)
            .await?;

    Ok(Some(json!({
        "id": uid,
        "display_name": name,
        "bio": bio,
        "avatar_url": avatar,
        "interests": interests.into_iter().map(|(t, w)| json!({"tag": t, "weight": w})).collect::<Vec<_>>(),
    })))
}

pub async fn get_public_profile(
    pool: &PgPool,
    id: Uuid,
) -> anyhow::Result<Option<serde_json::Value>> {
    get_full_profile(pool, id).await
}

pub async fn update_profile(
    pool: &PgPool,
    id: Uuid,
    bio: Option<&str>,
    display_name: Option<&str>,
) -> anyhow::Result<serde_json::Value> {
    sqlx::query(
        "UPDATE users SET
            bio = COALESCE($2, bio),
            display_name = COALESCE($3, display_name)
         WHERE userid = $1",
    )
    .bind(id)
    .bind(bio)
    .bind(display_name)
    .execute(pool)
    .await?;

    get_full_profile(pool, id)
        .await?
        .ok_or_else(|| anyhow::anyhow!("user not found"))
}

pub async fn replace_interests(
    pool: &PgPool,
    user_id: Uuid,
    interests: &[crate::handlers::user::InterestItem],
) -> sqlx::Result<()> {
    let mut tx = pool.begin().await?;
    sqlx::query("DELETE FROM interests WHERE user_id = $1")
        .bind(user_id)
        .execute(&mut *tx)
        .await?;
    for i in interests {
        sqlx::query("INSERT INTO interests (user_id, tag, weight) VALUES ($1, $2, $3)")
            .bind(user_id)
            .bind(&i.tag)
            .bind(i.weight)
            .execute(&mut *tx)
            .await?;
    }
    tx.commit().await?;
    Ok(())
}
