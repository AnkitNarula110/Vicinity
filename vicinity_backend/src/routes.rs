//! routes.rs — two routers, two state types, one HTTP server.
//!
//! Behaviour:
//!   - `auth_and_user_router` is `Router<PgPool>` — your existing handlers
//!     that extract `State<PgPool>` compile unchanged.
//!   - `ble_router` is `Router<AppState>` — the BLE handlers that need
//!     config + Redis + the match queue.
//!   - `create_routes` merges both. `Router::merge` requires both sides to
//!     have the SAME state type, so we convert the PgPool router into an
//!     AppState router first (see below).

use axum::{
    routing::{get, post},
    Router,
};

use crate::ble::{detection, heartbeat, token};
use crate::handlers::{
    auth::{complete_registration, login},
    user::get_user_by_id,
};
use crate::state::AppState;

/// Sub-router for endpoints that only need the database.
/// Extracting `State<PgPool>` in these handlers keeps them decoupled
/// from Redis/config/match-queue.
pub fn auth_and_user_router(pool: sqlx::PgPool) -> Router {
    Router::new()
        .route("/api/auth/register", post(complete_registration))
        .route("/api/auth/login", post(login))
        .route("/api/user/getuserbyid/:userid", get(get_user_by_id))
        .with_state(pool) // state = PgPool
}

/// Sub-router for BLE endpoints that need the full AppState.
pub fn ble_router() -> Router<AppState> {
    Router::new()
        .route("/ble/token", post(token::issue_token))
        .route("/ble/detections", post(detection::report_detections))
        .route("/ble/heartbeat", post(heartbeat::heartbeat))
}

/// Build the outer router. Both sides end up as `Router<()>` and merge.
pub fn create_routes(state: AppState) -> Router {
    // 1. PgPool sub-router — already resolved to Router<()>.
    //    Use `state.db.clone()` (or add a `pool()` method — see below).
    let pool_only: Router = auth_and_user_router(state.db.clone());

    // 2. AppState sub-router — resolve it now by passing the concrete state.
    let ble: Router = ble_router().with_state(state);

    // 3. Both are Router<()>. Merge is valid.
    pool_only
        .merge(ble)
        .route("/health", get(|| async { "ok" }))
}
