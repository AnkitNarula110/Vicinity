use axum::{
    extract::Request,
    http::{HeaderMap, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
};
use jsonwebtoken::{decode, DecodingKey, Validation};
use serde_json::json;
use uuid::Uuid;

use crate::config::{AppConfig, JwtClaims};
use crate::errors::AppError;
