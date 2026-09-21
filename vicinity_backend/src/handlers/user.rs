use crate::models::{
    base_response::BaseResponse,
    user::{GetUserByIdRes, User},
};
use axum::{
    extract::{Path, State, Query},
    http::StatusCode,
    Json,
};
use sqlx::{PgPool};
use uuid::Uuid;
use serde::{Deserialize, Serialize};
use crate::error::AppError;
use crate::state::AppState;

#[derive(Debug, Deserialize)]
pub struct UserIdQuery {
    pub user_id: Uuid,
}

#[derive(Debug, Serialize)]
pub struct MeResponse{
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

pub async fn get_me(State(state): State<AppState>, Query(query): Query<UserIdQuery>)->
Result<Json<MeResponse>, AppError>{
    let user = crate::repos::users:: get_full_profile(&state.db, query.user_id)
    .await?
    .ok_or(AppError::NotFound)?;
    Ok(Json(MeResponse{user}))
}