use crate::{models::base_response::BaseResponse, models::user::User};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
pub struct LoginRequest {
    pub login: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub base_response: BaseResponse,
    pub user_data: Option<User>,
}
