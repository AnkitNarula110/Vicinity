use crate::models::{
    base_response::BaseResponse,
    user::{GetUserByIdRes, User},
};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use sqlx::PgPool;
use uuid::Uuid;

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
