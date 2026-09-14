//! ----------------
//! `POST /ble/heartbeat`
//! Behaviour (spec Step 10):
//!   - Refresh the authenticated user's score in their venue sorted set.
//!   - Called every 30 s by the app while foregrounded.

use crate::auth::Claims;
use crate::ble::detection::geohash6;
use crate::ble::models::HeartbeatBody;
use crate::error::AppError;
use crate::state::AppState;
use axum::{extract::State, http::StatusCode, Json};

pub async fn heartbeat(
    State(state): State<AppState>,
    claims: Claims,
    Json(body): Json<HeartbeatBody>,
) -> Result<StatusCode, AppError> {
    let venue_id = geohash6(body.venue_hint.lat, body.venue_hint.lng);
    let now = chrono::Utc::now().timestamp();
    // ZADD overwrites the score → acts as a TTL-style presence refresh.
    state
        .redis
        .zadd_venue_user(&venue_id, claims.sub, now)
        .await?;
    Ok(StatusCode::OK)
}
