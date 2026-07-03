use serde::Serialize;

//Login response
#[derive(Serialize)] // allows automatic conversion to Json
pub struct LoginResponse {
    //Jwt token
    pub token: String,
}
// Generic API response
//Usefull for simple success/failure reponses
#[derive(Serialize)]
pub struct BaseResponse {
    pub success: bool,
    pub message: String,
}

//Verify OTP response
#[derive(Serialize)]
pub struct VerifyOtpResponse {
    pub success: bool,
    pub resetToken: String,
}
