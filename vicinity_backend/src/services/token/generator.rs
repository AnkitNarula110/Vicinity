//! Token Generator
//! This module provides functions for generating various types of JWT tokens.
//! Each function creates a token with appropriate claims and expiry.

use crate::models::{Claims, TokenType};
use chrono::{Duration, Utc};
use jsonwebtoken::{Algorithm, EncodingKey, Header, encode};
use uuid::Uuid;

use super::utils::getSecret;

//get expiry duration for a specific token type
pub(crate) fn getExpiry(token_type: &TokenType) -> Duration {
    use super::utils::CONFIG;
    match token_type {
        TokenType::Access => Duration::minutes(CONFIG.access_expiry_minutes),
        TokenType::Refresh => Duration::days(CONFIG.refresh_expiry_days),
        TokenType::Reset => Duration::minutes(CONFIG.reset_expiry_minutes),
        TokenType::EmailVerification => Duration::days(CONFIG.email_expiry_days),
    }
}

/// Create new claims with current timestamp
fn createClaims(user_id: Uuid, token_type: TokenType, role: Option<String>) -> Claims {
    let expiry = getExpiry(&token_type);
    let now = Utc::now();

    Claims {
        sub: user_id.to_string(),
        iat: now.timestamp(),
        exp: (now + expiry).timestamp(),
        token_type,
        role,
    }
}

//Encode JWT token
fn encodeToken(claims: Claims) -> String {
    let header = Header::new(Algorithm::HS256);
    let encodingKey = EncodingKey::from_secret(getSecret().as_bytes());

    encode(&header, &claims, &encodingKey).unwrap()
}

/// Generate access token for authenticated users
///
/// # Arguments
/// * `user_id` - The user's UUID
/// * `role` - Optional user role for authorization
///
/// # Returns
/// * `String` - The JWT token string
pub fn generateAccessToken(user_id: Uuid, role: Option<String>) -> String {
    let claims = createClaims(user_id, TokenType::Access, role);
    encodeToken(claims)
}
/// Generate password reset token (short-lived)
///
/// # Arguments
/// * `user_id` - The user's UUID
///
/// # Returns
/// * `String` - The JWT token string
pub fn generateResetToken(user_id: Uuid) -> String {
    let claims = createClaims(user_id, TokenType::Reset, None);
    encodeToken(claims)
}

/// Generate refresh token (long-lived)
///
/// # Arguments
/// * `user_id` - The user's UUID
///
/// # Returns
/// * `String` - The JWT token string
pub fn generateRefreshToken(user_id: Uuid) -> String {
    let claims = createClaims(user_id, TokenType::Refresh, None);
    encodeToken(claims)
}

/// Generate email verification token
///
/// # Arguments
/// * `user_id` - The user's UUID
///
/// # Returns
/// * `String` - The JWT token string
pub fn generateEmailVerificationToken(user_id: Uuid) -> String {
    let claims = createClaims(user_id, TokenType::EmailVerification, None);
    encodeToken(claims)
}

/// Generate access token with custom role
///
/// # Arguments
/// * `user_id` - The user's UUID
/// * `role` - User role as string slice
///
/// # Returns
/// * `String` - The JWT token string
pub fn generateAccessToken(user_id: Uuid, role: &str) -> String {
    generate_access_token(user_id, Some(role.to_string()))
}
