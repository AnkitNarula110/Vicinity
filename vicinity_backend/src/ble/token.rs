//! `POST /ble/token`
//! Behaviour (spec Step 4.1):
//!   1. Generate a fresh UUID v4 token.
//!   2. Store it in Redis as `ble:token:{token} = user_id` with a 17-min TTL.
//!   3. Return `{token, expires_in: 900}` to the client.
//!   4. The client calls this every 13 minutes; the 2-minute overlap window
//!      (17 min TTL vs 15 min active) keeps in-flight detections valid.

use axum::{extract::State, Json};
use uuid::Uuid;

use crate::auth::Claims; // JWT claims extracted by the auth middleware
use crate::ble::model::TokenResponse;
use crate::error::AppError;
use crate::state::AppState;

/// Axum handler for `POST /ble/token`.
pub async fn issue_token(
    State(state): State<AppState>,
    claims: Claims,
) -> Result<Json<TokenResponse>, AppError> {
    let token = Uuid::new_v4().to_string();

    state
        .redis
        .set_ble_token(&token, claims.sub, state.config.ble_token_ttl_secs)
        .await?;

    Ok(Json(TokenResponse {
        token,
        expires_in: state.config.ble_returned_ttl,
    }))
}
