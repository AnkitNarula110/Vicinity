use crate::error::AppError;
use crate::models::{
    base_response::BaseResponse,
    user::{GetUserByIdRes, User},
};
use crate::state::AppState;
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct UserIdQuery {
    pub user_id: Uuid,
}

#[derive(Debug, Serialize)]
pub struct MeResponse {
    pub user: serde_json::Value,
}

pub async fn get_user_by_id(
    // Get the PostgreSQL connection pool from the application state.
    State(pool): State<PgPool>,
    // Get the user ID from the URL path.
    Path(userid): Path<Uuid>,
) -> Result<Json<GetUserByIdRes>, StatusCode> {
    let row = sqlx::query!(
        r#"
        SELECT 
            userid,
            username,
            email,
            dob,
            password,
            aadharnumber,
            address,
            isactive,
            createddate,
            phone,
            onboarding_data,
            completed_onboarding
        FROM users 
        WHERE userid = $1 and isactive = true
        "#,
        userid
    )
    .fetch_optional(&pool)
    .await
    .map_err(|e| {
        eprintln!("Database error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    // If user not found, return error response with success: false
    let row = match row {
        Some(r) => r,
        None => {
            return Ok(Json(GetUserByIdRes {
                base_response: BaseResponse {
                    success: false,
                    message: "User not found".to_string(),
                },
                user_data: None, // User data is None when not found
            }));
        }
    };

    // Construct the User object
    let user = User {
        userid: row.userid,
        username: row.username.unwrap_or_default(),
        email: row.email.unwrap_or_default(),
        dob: row.dob,
        password: row.password.unwrap_or_default(),
        aadharnumber: row.aadharnumber,
        address: row.address,
        isactive: row.isactive.unwrap_or_default(),
        createddate: row.createddate.unwrap_or_default(),
        phone: row.phone.unwrap_or_default(),
        onboarding_data: row.onboarding_data.unwrap_or_default(),
        completed_onboarding: row.completed_onboarding.unwrap_or_default(),
    };

    // Return success response with user data
    Ok(Json(GetUserByIdRes {
        base_response: BaseResponse {
            success: true,
            message: "User found successfully".to_string(),
        },
        user_data: Some(user),
    }))
}

pub async fn get_me(
    State(state): State<AppState>,
    Query(query): Query<UserIdQuery>,
) -> Result<Json<MeResponse>, AppError> {
    let user = crate::repos::users::get_full_profile(&state.db, query.user_id)
        .await?
        .ok_or(AppError::NotFound)?;
    Ok(Json(MeResponse { user }))
}

// ── PATCH /users/me

#[derive(Debug, Deserialize)]
pub struct PatchMeBody {
    pub user_id: Uuid,
    pub bio: Option<String>,
    pub display_name: Option<String>,
}

pub async fn patch_me(
    State(state): State<AppState>,
    Json(body): Json<PatchMeBody>,
) -> Result<Json<MeResponse>, AppError> {
    let user = crate::repos::users::update_profile(
        &state.db,
        body.user_id,
        body.bio.as_deref(),
        body.display_name.as_deref(),
    )
    .await?;
    // Rebuild Redis vector on next read (delete cache to force refresh).
    state.redis.invalidate_vector(body.user_id).await?;

    Ok(Json(MeResponse { user }))
}

// ── POST /users/me/interests ───────────────────────────────────────────
#[derive(Debug, Deserialize)]
pub struct InterestItem {
    pub tag: String,
    pub weight: f64,
}

#[derive(Debug, Deserialize)]
pub struct PutInterestsBody {
    pub user_id: Uuid,
    pub interests: Vec<InterestItem>,
}

#[derive(Debug, Serialize)]
pub struct OkResponse {
    pub success: bool,
}

pub async fn put_interests(
    State(state): State<AppState>,
    Json(body): Json<PutInterestsBody>,
) -> Result<Json<OkResponse>, AppError> {
    crate::repos::users::replace_interests(&state.db, body.user_id, &body.interests).await?;
    state.redis.invalidate_vector(body.user_id).await?;
    Ok(Json(OkResponse { success: true }))
}

// ── GET /users/:id/profile ─────────────────────────────────────────────
#[derive(Debug, Serialize)]
pub struct PublicProfileResponse {
    pub user: serde_json::Value,
}

pub async fn get_public_profile(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<PublicProfileResponse>, AppError> {
    // Only expose public fields — never email, never location.
    let user = crate::repos::users::get_public_profile(&state.db, id)
        .await?
        .ok_or(AppError::NotFound)?;
    Ok(Json(PublicProfileResponse { user }))
}

// ── GET /users/:id/photos ──────────────────────────────────────────────
#[derive(Debug, Serialize)]
pub struct PhotosResponse {
    pub photos: Vec<serde_json::Value>,
}

pub async fn get_photos(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Query(q): Query<UserIdQuery>,
) -> Result<Json<PhotosResponse>, AppError> {
    // Position 0 always visible; 1–5 only if a meet exists between users.
    let has_meet = crate::repos::meets::has_meet_between(&state.db, q.user_id, id).await?;
    let photos = crate::repos::photos::list_for_user(&state.db, id, has_meet).await?;
    Ok(Json(PhotosResponse { photos }))
}
