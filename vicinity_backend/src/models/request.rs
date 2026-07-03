// Deserialize: convert JSON data into Rust structs
use serde::Deserialize;

// Login request
/// This represents the JSON body expected by the login endpoint
#[derive(Deserialize)] // Allows automatic JSON parsing into this struct
pub struct LoginRequest {
    // User login identifier - can be username, email, or phone number
    pub login: String,
    pub password: String,
}

//Forgot password request
#[derive(Deserialize)]
pub struct ForgotPasswordRequest {
    pub phone: String,
}

//Verify OTP request
#[derive(Deserialize)]
pub struct VerifyOtpRequest {
    pub phone: String,
    pub otp: String,
}

//Reset password request
#[derive(Deserialize)]
pub struct ResetPasswordRequest {
    pub resetToken: String,
    pub newPassword: String,
}

//To Do: Sign in with google and Sign in with apple
