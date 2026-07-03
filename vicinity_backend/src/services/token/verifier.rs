//! Token Verifier
//!
//! This module provides functions for verifying and validating JWT tokens.
//! Includes signature verification, expiration checking, and type validation.

use crate::models::{Claims, TokenType};
use jsonwebtoken::{Algorithm, DecodingKey, Validation, decode};
use uuid::Uuid;

use super::helpers::getUserIdFromClaims;
use super::utils::getSecret;

/// Verify and decode JWT token
///
/// # Arguments
/// * `token` - The JWT token string to verify
/// * `expected_type` - The expected token type
///
/// # Returns
/// * `Result<Claims, String>` - Decoded claims or error message
///
/// # Errors
/// * Returns error if token is invalid, expired, or wrong type
///
pub fn verifyToken(token: &str, expected_type: TokenType) -> Result<Claims, String> {
    let decoding_key = DecodingKey::from_secret(get_secret().as_bytes());

    let mut validation = Validation::new(Algorithm::HS256);
    validation.validate_exp = true;
    validation.validate_iat = true;

    let token_data =
        decode::<Claims>(token, &decoding_key, &validation).map_err(|e| match e.kind() {
            jsonwebtoken::errors::ErrorKind::ExpiredSignature => "Token has expired".to_string(),
            _ => format!("Invalid token: {}", e),
        })?;

    let claims = token_data.claims;

    // Verify token type matches expected
    if claims.token_type != expected_type {
        return Err(format!(
            "Wrong token type - expected {:?}, got {:?}",
            expected_type, claims.token_type
        ));
    }

    Ok(claims)
}
/// Verify token and return user ID directly
///
/// # Arguments
/// * `token` - The JWT token string
/// * `expected_type` - The expected token type
///
/// # Returns
/// * `Result<Uuid, String>` - User ID or error
///
pub fn verifyTokenGetUserId(token: &str, expected_type: TokenType) -> Result<Uuid, String> {
    let claims = verifyToken(token, expected_type)?;
    getUserIdFromClaims(&claims).ok_or_else(|| "Invalid user ID in token".to_string())
}

/// Verify token and get role (if present)
///
/// # Arguments
/// * `token` - The JWT token string
/// * `expected_type` - The expected token type
///
/// # Returns
/// * `Result<Option<String>, String>` - Role or error
///

pub fn verifyTokenGetRole(token: &str, expected_type: TokenType) -> Result<Option<String>, String> {
    let claims = verifyToken(token, expected_type)?;
    Ok(claims.role)
}

/// Verify token and check if user has a specific role
///
/// # Arguments
/// * `token` - The JWT token string
/// * `expected_type` - The expected token type
/// * `role` - The role to check for
///
/// # Returns
/// * `Result<bool, String>` - True if user has role, or error
///

pub fn verifyTokenHasRole(
    token: &str,
    expected_type: TokenType,
    role: &str,
) -> Result<bool, String> {
    let claims = verifyToken(token, expected_type)?;
    Ok(claims.role.as_deref() == Some(role))
}

/// Verify token without type checking
/// (Useful for generic token validation)
///
/// # Arguments
/// * `token` - The JWT token string
///
/// # Returns
/// * `Result<Claims, String>` - Decoded claims or error
///

pub fn verifyTokenAnyType(token: &str) -> Result<Claims, String> {
    let decoding_key = DecodingKey::from_secret(getSecret().as_bytes());

    let mut validation = Validation::new(Algorithm::HS256);
    validation.validate_exp = true;
    validation.validate_iat = true;

    let token_data =
        decode::<Claims>(token, &decoding_key, &validation).map_err(|e| match e.kind() {
            jsonwebtoken::errors::ErrorKind::ExpiredSignature => "Token has expired".to_string(),
            _ => format!("Invalid token: {}", e),
        })?;

    Ok(token_data.claims)
}

/// Verify multiple tokens (batch verification)
///
/// # Arguments
/// * `tokens` - Slice of token strings
/// * `expected_type` - The expected token type
///
/// # Returns
/// * `Vec<Result<Claims, String>>` - Results for each token
pub fn verifyTokens(tokens: &[&str], expected_type: TokenType) -> Vec<Result<Claims, String>> {
    tokens
        .iter()
        .map(|token| verifyToken(token, expected_type.clone()))
        .collect()
}
