use argon2::{
    Argon2, PasswordVerifier,
    password_hash::{PasswordHash, PasswordHasher, SaltString},
};
use axum::{Json, extract::State, http::StatusCode};
use chrono::Utc;
use rand::rngs::OsRng;
use sqlx::PgPool;

use crate::{
    models::base_response::BaseResponse,
    models::login::{LoginRequest, LoginResponse},
    models::onboarding::{CompleteRegistrationRequest, CompleteRegistrationResponse},
    models::user::User,
};

pub async fn complete_registration(
    State(pool): State<PgPool>,
    Json(payload): Json<CompleteRegistrationRequest>,
) -> Result<Json<CompleteRegistrationResponse>, (StatusCode, String)> {
    // Check if phone already exists
    let phone_exists = sqlx::query!("SELECT phone FROM users WHERE phone = $1", payload.phone)
        .fetch_optional(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if phone_exists.is_some() {
        return Err((
            StatusCode::BAD_REQUEST,
            "Phone already registered".to_string(),
        ));
    }

    // Check if email already exists
    let email_exists = sqlx::query!("SELECT email FROM users WHERE email = $1", payload.email)
        .fetch_optional(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if email_exists.is_some() {
        return Err((
            StatusCode::BAD_REQUEST,
            "Email already registered".to_string(),
        ));
    }

    // Password hashing
    let salt = SaltString::generate(&mut OsRng);
    let password_hash = Argon2::default()
        .hash_password(payload.password.as_bytes(), &salt)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .to_string();

    let mut transaction = pool
        .begin()
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Convert onboarding data to JSON
    let onboarding_json = serde_json::to_value(&payload.onboarding_data)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Insert user with onboarding data as JSON
    let user = sqlx::query!(
        r#"
        INSERT INTO users
        (
            username,
            email,
            dob,
            password,
            aadharnumber,
            address,
            isactive,
            createddate,
            phone,
            completed_onboarding,
            onboarding_data
        )
        VALUES
        (
            $1, $2, $3, $4, $5, $6, true, $7, $8,
            true, $9
        )
        RETURNING userid
        "#,
        payload.username,
        payload.email,
        payload.dob,
        password_hash,
        payload.aadharnumber,
        payload.address,
        Utc::now().naive_utc(),
        payload.phone,
        onboarding_json,
    )
    .fetch_one(&mut *transaction)
    .await
    .map_err(|e| {
        eprintln!("Database error: {:?}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
    })?;

    // If there's a profile picture, store it separately
    if let Some(image_base64) = &payload.onboarding_data.profile_picture {
        // Decode base64 to bytes
        use base64::{Engine as _, engine::general_purpose::STANDARD};

        let image_bytes = STANDARD.decode(image_base64).map_err(|e| {
            eprintln!("Base64 decode error: {:?}", e);
            (StatusCode::BAD_REQUEST, "Invalid image data".to_string())
        })?;

        sqlx::query!(
            r#"
        INSERT INTO profilepictures
        (
            userid,
            profilepicture,
            content
        )
        VALUES
        ($1, $2, $3)
        "#,
            user.userid,
            &image_bytes, // Now it's &[u8]
            "profile_image"
        )
        .execute(&mut *transaction)
        .await
        .map_err(|e| {
            eprintln!("Profile picture insert error: {:?}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
        })?;
    }
    transaction.commit().await.map_err(|e| {
        eprintln!("Transaction commit error: {:?}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
    })?;

    Ok(Json(CompleteRegistrationResponse {
        userid: user.userid,
        message: "User registered successfully with onboarding complete".to_string(),
        onboarding_complete: true,
    }))
}

pub async fn login(
    State(pool): State<PgPool>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, (StatusCode, String)> {
    // 1. Validate input
    if payload.login.trim().is_empty() || payload.password.trim().is_empty() {
        return Ok(Json(LoginResponse {
            base_response: BaseResponse {
                success: false,
                message: "Login and password are required".to_string(),
            },
            user_data: None,
        }));
    }

    // 2. Query user with explicit type annotations for all fields
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
    WHERE username = $1 OR email = $1 OR phone = $1
    "#,
        payload.login
    )
    .fetch_optional(&pool)
    .await
    .map_err(|e| {
        eprintln!("Database error: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Database error: {}", e),
        )
    })?;

    let user = row.map(|r| User {
        userid: r.userid,
        username: r.username.unwrap_or_default(),
        email: r.email.unwrap_or_default(),
        dob: r.dob,
        password: r.password.unwrap_or_default(),
        aadharnumber: r.aadharnumber,
        address: r.address,
        isactive: r.isactive.unwrap_or_default(),
        createddate: r.createddate.unwrap_or_default(),
        phone: r.phone.unwrap_or_default(),
        onboarding_data: r.onboarding_data.unwrap_or_default(),
        completed_onboarding: r.completed_onboarding.unwrap_or_default(),
    });
    // 3. Check if user exists and is active
    let user = match user {
        Some(user) => {
            if !user.isactive {
                return Ok(Json(LoginResponse {
                    base_response: BaseResponse {
                        success: false,
                        message: "Account is deactivated. Please contact support.".to_string(),
                    },
                    user_data: None,
                }));
            }
            user
        }
        None => {
            return Ok(Json(LoginResponse {
                base_response: BaseResponse {
                    success: false,
                    message: "Invalid credentials".to_string(),
                },
                user_data: None,
            }));
        }
    };

    // 4. Verify password
    let password_verified = verify_password(&payload.password, &user.password).await?;

    if !password_verified {
        return Ok(Json(LoginResponse {
            base_response: BaseResponse {
                success: false,
                message: "Invalid credentials".to_string(),
            },
            user_data: None,
        }));
    }

    // 5. Return success
    Ok(Json(LoginResponse {
        base_response: BaseResponse {
            success: true,
            message: "Login successful".to_string(),
        },
        user_data: Some(user),
    }))
}

async fn verify_password(
    password: &str,
    hashed_password: &str,
) -> Result<bool, (StatusCode, String)> {
    let parsed_hash = PasswordHash::new(hashed_password).map_err(|e| {
        eprintln!("Failed to parse password hash: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "Invalid password hash format".to_string(),
        )
    })?;

    match Argon2::default().verify_password(password.as_bytes(), &parsed_hash) {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
    }
}
