//! JWT Claims and Token Types
//! used throughout the application for authentication and authorization.

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    /// Subject (user ID) - identifies the user
    pub subject: String,

    //Issued at timestamp - when token was created
    pub iat: i64,

    /// Expiration timestamp - when token expires
    pub exp: i64,

    pub tokenType: TokenType,
}

// ---------------- TOKEN TYPES ----------------
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum TokenType {
    /// Access token - for API authentication
    Access,
    /// Refresh token - for obtaining new access tokens
    Refresh,
    /// Password reset token - for resetting passwords
    Reset,
    /// Email verification token - for verifying email addresses
    EmailVerification,
}

// ---------------- TOKEN CONFIGURATION ----------------
/// Token configuration for different token types
#[derive(Debug, Clone)]
pub struct TokenConfig {
    /// Secret key for signing tokens
    pub secret: String,

    /// Expiry duration for access tokens
    pub accessExpiryMinutes: i64,

    /// Expiry duration for refresh tokens
    pub refreshExpiryDays: i64,

    /// Expiry duration for reset tokens
    pub resetExpiryMinutes: i64,

    /// Expiry duration for email verification tokens
    pub emailExpiryDays: i64,
}
