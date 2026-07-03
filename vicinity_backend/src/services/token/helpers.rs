//! Claims Helper Functions
//! This module provides helper functions for working with JWT claims.
//! These functions are used to extract information from claims and check
//! claim properties.

use crate::models::Claims;
use chrono::{Duration, Utc};
use uuid::Uuid;

/// Extract user ID from claims
///
/// # Arguments
/// * `claims` - The claims to extract from
///
/// # Returns
/// * `Option<Uuid>` - The user ID if valid, None otherwise

pub fn getUserIdFromClaims(claims: &Claims) -> Option<Uuid> {
    Uuid::parse_str(&claims.sub).ok()
}

/// Check if token is expired
///
/// # Arguments
/// * `claims` - The claims to check
///
/// # Returns
/// * `bool` - True if token is expired, false otherwise
pub fn isTokenExpired(claims: &Claims) -> bool {
    let now = Utc::now().timestamp();
    claims.exp < now
}

/// Check if token is valid (not expired)
///
/// # Arguments
/// * `claims` - The claims to check
///
/// # Returns
/// * `bool` - True if token is valid, false otherwise
pub fn isTokenValid(claims: &Claims) -> bool {
    !isTokenExpired(claims)
}

/// Get remaining time until expiration
///
/// # Arguments
/// * `claims` - The claims to check
///
/// # Returns
/// * `Duration` - Time remaining or zero if expired
pub fn timeUntilExpiry(claims: &Claims) -> Duration {
    let now = Utc::now().timestamp();
    let remaining = claims.exp - now;
    if remaining < 0 {
        Duration::zero()
    } else {
        Duration::seconds(remaining)
    }
}

/// Get token type from claims
///
/// # Arguments
/// * `claims` - The claims to extract from
///
/// # Returns
/// * `TokenType` - The token type`
pub fn getTokenTypeFromClaims(claims: &Claims) -> crate::models::TokenType {
    claims.token_type.clone()
}

/// Get role from claims
///
/// # Arguments
/// * `claims` - The claims to extract from
///
/// # Returns
/// * `Option<&String>` - The role if present
pub fn getRoleFromClaims(claims: &Claims) -> Option<&String> {
    claims.role.as_ref()
}

/// Check if claims have a specific role
///
/// # Arguments
/// * `claims` - The claims to check
/// * `role` - The role to check for
///
/// # Returns
/// * `bool` - True if the user has the specified role
pub fn hasRole(claims: &Claims, role: &str) -> bool {
    claims.role.as_deref() == Some(role)
}

/// Get the issue time of the token
///
/// # Arguments
/// * `claims` - The claims to extract from
///
/// # Returns
/// * `DateTime<Utc>` - The issue time
pub fn getIssuedAt(claims: &Claims) -> chrono::DateTime<chrono::Utc> {
    chrono::DateTime::from_timestamp(claims.iat, 0).unwrap_or_else(chrono::Utc::now)
}

/// Get the expiration time of the token
///
/// # Arguments
/// * `claims` - The claims to extract from
///
/// # Returns
/// * `DateTime<Utc>` - The expiration time
pub fn getExpiresAt(claims: &Claims) -> chrono::DateTime<chrono::Utc> {
    chrono::DateTime::from_timestamp(claims.exp, 0).unwrap_or_else(chrono::Utc::now)
}

/// Check if token is about to expire (within specified duration)
///
/// # Arguments
/// * `claims` - The claims to check
/// * `duration` - The threshold duration
///
/// # Returns
/// * `bool` - True if token will expire within the specified duration
pub fn isTokenExpiringSoon(claims: &Claims, duration: Duration) -> bool {
    let remaining = timeUntilExpiry(claims);
    remaining <= duration && remaining > Duration::zero()
}
