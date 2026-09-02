use axum::{
    routing::{get, post},
    Router,
};

use sqlx::PgPool;

use crate::handlers::{
    auth::{complete_registration, login},
    user::get_user_by_id,
};

pub fn create_routes(pool: PgPool) -> Router {
    Router::new()
        .route("/api/auth/register", post(complete_registration))
        .route("/api/auth/login", post(login)) // Add login rout
        .route(
            "/api/user/getuserbyid/:userid",
            get(get_user_by_id), // GET method
        )
        .with_state(pool)
}
