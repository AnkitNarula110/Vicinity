use axum::{Router, routing::post};

use sqlx::PgPool;

use crate::handlers::auth::{complete_registration, login};

pub fn create_routes(pool: PgPool) -> Router {
    Router::new()
        .route("/api/auth/register", post(complete_registration))
        .route("/api/auth/login", post(login)) // Add login rout
        .with_state(pool)
}
