//Utility Functions
//! This module provides utility functions for token operations including
//! extraction, refreshing, and information retrieval.

use crate::models::{Claims, TokenConfig, TokenType};
use chrono::Duration;
use jsonwebtoken::{Algorithm, DecodingKey, Validation, decode};
use lazy_static::lazy_static;
use uuid::Uuid;

//super refers to the parent module of the current module.
//Import some_function from the parent module
use super::{
    generator::{
        generateAccessToken, generateEmailVerificationToken, generateRefreshToken,
        generateResetToken,
    },
    helpers::getUserIdFromClaims,
};

/// Lazy-initialized token configuration
/// Reads from environment variables once at startup
lazy_static! {
    pub(crate) static ref CONFIG: TokenConfig = {
        use ::env;

        let secret = env::var("JWT_SECRET").expect("JWT_SECRET must be set");
        TokenConfig {
            secret,
            accessExpiryMinutes: env::var("JWT_ACCESS_EXPIRY")
                .unwrap_or_else(|_| "60".to_string())
                .parse::<i64>()
                .unwrap_or(60),
            refreshExpiryDays: env::var("JWT_REFRESH_EXPIRY")
                .unwrap_or_else(|_| "7".to_string())
                .parse::<i64>()
                .unwrap_or(7),
            resetExpiryMinutes: env::var("JWT_RESET_EXPIRY")
                .unwrap_or_else(|_| "15".to_string())
                .parse::<i64>()
                .unwrap_or(15),
            emailExpiryDays: env::var("JWT_EMAIL_EXPIRY")
                .unwrap_or_else(|_| "7".to_string())
                .parse::<i64>()
                .unwrap_or(7),
        }
    };
}

/// Get the secret key from configuration
pub(crate) fn getSecret() -> String {
    CONFIG.secret.clone()
}

/// Extract user ID without full verification (for debugging)
///
/// # Arguments
/// * `token` - The JWT token string
///
/// # Returns
/// * `Option<Uuid>` - The user ID if extraction succeeds
///
/// # Note
/// This does NOT verify the token signature or expiration.
/// Use only for debugging or logging purposes.
///
pub fn extractUserIdUnverified(token: &str) -> Option<Uuid> {
    //To do: verify the token signature or expiration
    let decoding_key = DecodingKey::from_secret(getSecret().as_bytes());

    let mut validation = Validation::new(Algorithm::HS256);
    validation.validate_exp = false;
    validation.validate_iat = false;

    if let Ok(token_data) = decode::<Claims>(token, &decoding_key, &validation) {
        Uuid::parse_str(&token_data.claims.sub).ok()
    } else {
        None
    }
}

/// Extract token type without full verification
///
/// # Arguments
/// * `token` - The JWT token string
///
/// # Returns
/// * `Option<TokenType>` - The token type if extraction succeeds
///
/// # Note
/// This does NOT verify the token signature or expiration.
/// Use only for debugging or logging purposes.
pub fn extractTokenTypeUnverified(token: &str) -> Option<TokenType> {
    //To do: verify the token signature or expiration
    let decoding_key = DecodingKey::from_secret(get_secret().as_bytes());

    let mut validation = Validation::new(Algorithm::HS256);
    validation.validate_exp = false;
    validation.validate_iat = false;

    if let Ok(token_data) = decode::<Claims>(token, &decoding_key, &validation) {
        Some(token_data.claims.token_type)
    } else {
        None
    }
}

/// Refresh an expired token (if valid signature)
///
/// # Arguments
/// * `old_token` - The expired token to refresh
///
/// # Returns
/// * `Result<String, String>` - New token or error
///
/// # Errors
/// * Returns error if token is invalid or not yet expired
pub fn refreshToken(old_token: &str) -> Result<String, String> {
    // Verify the token without checking expiration
    let decoding_key = DecodingKey::from_secret(getSecret().as_bytes());

    let mut validation = Validation::new(Algorithm::HS256);
    validation.validate_exp = false;
    validation.validate_iat = true;

    let token_data = decode::<Claims>(old_token, &decoding_key, &validation)
        .map_err(|e| format!("Invalid token: {}", e))?;

    let claims = token_data.claims;
    // Check if token is actually expired
    let now = chrono::Utc::now().timestamp();
    if claims.exp > now {
        return Err("Token is not yet expired".to_string());
    }

    // Get user ID from claims
    let user_id = Uuid::parse_str(&claims.sub).map_err(|_| "Invalid user ID".to_string())?;

    //Generate new token with extended expiry
    let new_token = match claims.token_type {
        TokenType::Access => generateAccessToken(user_id, claims.role),
        TokenType::Reset => generateResetToken(user_id),
        TokenType::Refresh => generateRefreshToken(user_id),
        TokenType::EmailVerification => generateEmailVerificationToken(user_id),
    };

    Ok(new_token)
}

/// Get default expiry description for a token type
///
/// # Arguments
/// * `token_type` - The token type
///
/// # Returns
/// * `&'static str` - Description string
pub fn getTokenTypeDescription(token_type: &TokenType) -> &'static str {
    match token_type {
        TokenType::Access => "Authentication access token",
        TokenType::Refresh => "Refresh token for session renewal",
        TokenType::Reset => "Password reset token",
        TokenType::EmailVerification => "Email verification token",
    }
}

/// Get expiry duration as human-readable string
///
/// # Arguments
/// * `token_type` - The token type
///
/// # Returns
/// * `String` - Human-readable expiry description

pub fn getExpiryDescription(token_type: &TokenType) -> String {
    use super::generator::getExpiry;
    let duration = getExpiry(token_type);
    let minutes = duration.num_minutes();
    let hours = duration.num_hours();
    let days = duration.num_days();

    if days > 0 {
        format!("{} days", days)
    } else if hours > 0 {
        format!("{} hours", hours)
    } else {
        format!("{} minutes", minutes)
    }
}

/// Validate token strength (basic checks)
///
/// # Arguments
/// * `token` - The JWT token string
///
/// # Returns
/// * `bool` - True if token passes basic validation
pub fn validateTokenFormat(token: &str) -> bool {
    // Check if token has at least 3 parts (header.payload.signature)
    let parts: Vec<&str> = token.split('.').collect();
    parts.len() == 3 && parts.iter().all(|p| !p.is_empty())
}

/// Get token information as a string (for logging)
///
/// # Arguments
/// * `token` - The JWT token string
///
/// # Returns
/// * `String` - Human-readable token information
pub fn getTokenInfo(token: &str) -> String {
    let mut info = String::new();

    //check format
    if !validateTokenFormat(token) {
        return "Invalid token format".to_string();
    }

    //try to extract user ID
    if let Some(user_id) = extractUserIdUnverified(token) {
        info.push_str(&format!("User: {}, ", user_id));
    }

    //try to extract token type
    if let Some(token_type) = extractTokenTypeUnverified(token) {
        info.push_str(&format!("Type: {:?}", token_type));
    }

    if info.is_empty() {
        "Unable to extract token information".to_string()
    } else {
        info
    }
}
