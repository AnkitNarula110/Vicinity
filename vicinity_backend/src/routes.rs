//! routes.rs — one router, one state type (AppState).

use axum::{
    routing::{delete, get, post},
    Router,
};

use crate::state::AppState;
use crate::{
    ble::{detection, heartbeat, token},
    handlers::{
        auth::{complete_registration, login},
        meet::{confirm_meet, get_meet, safe_word},
        nearby::get_nearby,
        nudges::{cancel_nudge, list_nudges, send_nudge},
        user::{get_me, get_photos, get_public_profile, get_user_by_id, patch_me, put_interests},
    },
};

/// Auth + user sub-router. Handlers now extract `State<AppState>`
/// (they can still use `state.db` for the pool).
pub fn auth_and_user_router() -> Router<AppState> {
    Router::new()
        .route("/api/auth/register", post(complete_registration))
        .route("/api/auth/login", post(login))
        .route("/api/user/getuserbyid/:userid", get(get_user_by_id))
}

/// BLE + feature sub-router.
pub fn ble_router() -> Router<AppState> {
    Router::new()
        .route("/api/ble/token", post(token::issue_token))
        .route("/api/ble/detections", post(detection::report_detections))
        .route("/api/ble/heartbeat", post(heartbeat::heartbeat))
        .route("/api/users/me", get(get_me).patch(patch_me))
        .route("/api/users/me/interests", post(put_interests))
        .route("/api/users/:id/profile", get(get_public_profile))
        .route("/api/users/:id/photos", get(get_photos))
        .route("/api/nearby", get(get_nearby))
        .route("/api/matches", get(list_nudges))
        .route("/api/nudges", post(send_nudge).get(list_nudges))
        .route("/api/nudges/:id", delete(cancel_nudge))
        .route("/api/meets", post(confirm_meet))
        .route("/api/meets/:id", get(get_meet))
        .route("/api/meets/:id/safe-word", post(safe_word))
}

/// Build the outer router. Both sub-routers are `Router<AppState>`,
/// so `merge` works without any conversion.
pub fn create_routes(state: AppState) -> Router {
    auth_and_user_router()
        .merge(ble_router())
        .route("/health", get(|| async { "ok" }))
        .with_state(state)
}
