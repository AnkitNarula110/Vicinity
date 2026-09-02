pub mod auth;

use axum::{extract::Request, middleware::Next, response::Response};

pub async fn logger_middleware(req: Request, next: Next) -> Response {
    tracing::info!("{} {}", req.method(), req.uri().path());
    next.run(req).await
}
