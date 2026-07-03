// Export OTP service
pub mod otp;

// Export token service (as a module)
pub mod token;

// Re-export token functions for backward compatibility
pub use token::{
    // Types
    Claims,
    TokenConfig,
    TokenType,
    extractTokenTypeUnverified,
    // Utility functions
    extractUserIdUnverified,
    // Generator functions
    generateAccessToken,
    generateAccessTokenWithRole,

    generateEmailVerificationToken,
    generateRefreshToken,
    generateResetToken,
    getExpiresAt,
    getExpiryDescription,
    getIssuedAt,
    getRoleFromClaims,
    getTokenInfo,

    getTokenTypeDescription,
    getTokenTypeFromClaims,
    // Helper functions
    getUserIdFromClaims,
    hasRole,
    isTokenExpired,
    isTokenExpiringSoon,

    isTokenValid,
    refreshToken,
    timeUntilExpiry,
    validateTokenFormat,
    // Verifier functions
    verifyToken,
    verifyTokenAnyType,
    verifyTokenGetRole,
    verifyTokenGetUserId,
    verifyTokenHasRole,
    verifyTokens,
};
