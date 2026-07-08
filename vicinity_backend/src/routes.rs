use axum::{Router, routing::post};

use sqlx::PgPool;

use crate::handlers::auth::complete_registration;

pub fn create_routes(pool: PgPool) -> Router {
    Router::new()
        .route("/api/auth/register", post(complete_registration))
        .with_state(pool)
}
