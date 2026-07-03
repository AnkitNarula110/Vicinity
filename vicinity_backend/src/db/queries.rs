//Database queries
use anyhow::Result;
use chrono::{Duration, Utc}; //Time handling
use sqlx::PgPool;
use uuid::Uuid; //Flexible error type

///Find a user by any login identifier
///
/// #Args
/// * `db` - Database connection pool reference
/// * `login` - Username, email, or phone number
///
/// # Returns
/// * `Option<(Uuid, String)>` - Some(user_id, password_hash) or None
///
/// # Errors
/// * Returns any database-related error

pub async fn findUserByLogin(db: PgPool, login: &str) -> Result<Option<(Uuid, String)>> {
    pub async fn find_user_by_login(db: &PgPool, login: &str) -> Result<Option<(Uuid, String)>> {
        // SQL query with parameterized placeholders ($1)
        // The query! macro checks SQL syntax at compile time
        let user = sqlx::query!(
            r#"
        SELECT userid, password
        FROM users
        WHERE username = $1    -- Check if login matches username
           OR email = $1       -- OR if login matches email
           OR phone = $1       -- OR if login matches phone
        "#,
            login // This replaces $1 in all three conditions
        )
        .fetch_optional(db) // Returns at most one record (Some or None)
        .await?; // Wait for async operation, propagate errors with ?

        // Map the result to a tuple of (user_id, password)
        // If Some, extract the fields; if None, returns None
        Ok(user.map(|u| (u.userid, u.password)))
    }
}

/// Find a user by phone number
///
/// # Arguments
/// * `db` - Database connection pool
/// * `phone` - Phone number to search for
///
/// # Returns
/// * `Option<(Uuid, String)>` - Some(user_id, phone) or None

pub async fn find_user_by_phone(db: &PgPool, phone: &str) -> Result<Option<(Uuid, String)>> {
    // Query to find user by phone number
    let user = sqlx::query!(r#"SELECT userid, phone FROM users WHERE phone = $1"#, phone)
        .fetch_optional(db)
        .await?;

    // Return user ID and phone number if found
    Ok(user.map(|u| (u.userid, u.phone)))
}

/// Update a user's password
///
/// # Arguments
/// * `db` - Database connection pool
/// * `user_id` - UUID of the user whose password to update
/// * `new_password` - New password (should be hashed)
///
/// # Returns
/// * `Result<()>` - Success or database error
pub async fn update_user_password(db: &PgPool, user_id: Uuid, new_password: &str) -> Result<()> {
    // Update password for specific user
    sqlx::query!(
        r#"
        UPDATE users
        SET password = $1     -- Set new password
        WHERE userid = $2     -- For the specified user
        "#,
        new_password,
        user_id
    )
    .execute(db) // Execute the update operation
    .await?; // Wait for completion

    Ok(())
}

/// Insert a new OTP record for password reset
///
/// # Arguments
/// * `db` - Database connection pool
/// * `user_id` - User requesting password reset
/// * `phone` - Phone number where OTP was sent
/// * `otp_hash` - Hashed OTP for secure storage
///
/// # Returns
/// * `Result<()>` - Success or database error
pub async fn insert_otp(db: &PgPool, user_id: Uuid, phone: &str, otp_hash: &str) -> Result<()> {
    // Insert new OTP record with 5-minute expiration
    sqlx::query!(
        r#"
        INSERT INTO passwordresetotp
        (id, userid, phone, otp_hash, expires_at)
        VALUES ($1, $2, $3, $4, $5)
        "#,
        Uuid::new_v4(),                                // $1 - Generate new unique ID
        user_id,                                       // $2 - User ID
        phone,                                         // $3 - Phone number
        otp_hash,                                      // $4 - Hashed OTP
        Utc::now().naive_utc() + Duration::minutes(5)  // $5 - Expiry time (5 minutes from now)
    )
    .execute(db) // Execute the insert
    .await?; // Wait for completion

    Ok(())
}

/// Get the latest OTP record for a phone number
///
/// # Arguments
/// * `db` - Database connection pool
/// * `phone` - Phone number to search for
///
/// # Returns
/// * `Option<(Uuid, String, NaiveDateTime)>` - (otp_id, hash, expires_at) or None
pub async fn get_latest_otp(
    db: &PgPool,
    phone: &str,
) -> Result<Option<(Uuid, String, chrono::NaiveDateTime)>> {
    // Query to get most recent OTP for the phone number
    let record = sqlx::query!(
        r#"
        SELECT id, otp_hash, expires_at FROM passwordresetotp
        WHERE phone = $1
        ORDER BY createddate DESC  -- Get the most recent OTP first
        LIMIT 1                    -- Only need the latest one
        "#,
        phone
    )
    .fetch_optional(db) // Get at most one record
    .await?; // Wait for completion

    // Return tuple of (id, hash, expiry) if found
    Ok(record.map(|r| (r.id, r.otp_hash, r.expires_at)))
}

/// Mark an OTP record as verified
///
/// # Arguments
/// * `db` - Database connection pool
/// * `otp_id` - ID of the OTP record to mark
///
/// # Returns
/// * `Result<()>` - Success or database error
pub async fn mark_otp_verified(db: &PgPool, otp_id: Uuid) -> Result<()> {
    // Update the OTP record to mark it as verified
    sqlx::query!(
        "UPDATE passwordresetotp SET is_verified = true WHERE id = $1",
        otp_id
    )
    .execute(db)
    .await?;

    Ok(())
}

//To Do: delete the old records from db
