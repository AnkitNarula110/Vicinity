//! Legacy Token Service
//!
//! This file provides backward compatibility with the original token.rs
//! All functions are re-exported from the new modular structure.

// Re-export everything from the token module
pub use crate::services::token::*;

// Additional backward compatibility aliases
pub use crate::services::token::generator::{
    generateAccessToken as generateJwt, generateResetToken as generateResetTokenLegacy,
};

pub use crate::services::token::verifier::verifyTokenGetUserId as extractUserIdFromResetToken;
/// Generate reset token (backward compatible with original code)
///
/// This function maintains the same signature as the original

#[deprecated(since = "0.3.0", note = "Use token::generateResetToken instead")]
pub fn generateResetTokenOld(user_id: Uuid) -> String {
    generateResetToken(user_id)
}

/// Extract user ID from reset token (backward compatible)
#[deprecated(since = "0.3.0", note = "Use token::verifyTokenGetUserId instead")]
pub fn extractUserIdFromResetTokenOld(token: &str) -> Result<Uuid, String> {
    verifyTokenGetUserId(token, TokenType::Reset)
}
