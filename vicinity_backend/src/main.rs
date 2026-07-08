mod db;
mod handlers;
mod models;
mod routes;

use dotenv::dotenv;
use std::env;

use axum::http::HeaderValue;
use tower_http::cors::CorsLayer;
use tracing_subscriber;

#[tokio::main]
async fn main() {
    dotenv().ok();

    tracing_subscriber::fmt().init();

    let pool = db::create_pool().await;

    let cors = CorsLayer::new()
        .allow_origin("http://localhost:8081".parse::<HeaderValue>().unwrap())
        .allow_methods([axum::http::Method::GET, axum::http::Method::POST])
        .allow_headers([axum::http::header::CONTENT_TYPE]);

    let app = routes::create_routes(pool).layer(cors);

    let port = env::var("PORT").unwrap_or("3000".to_string());

    let address = format!("0.0.0.0:{}", port);

    println!("Server running on {}", address);

    let listener = tokio::net::TcpListener::bind(address).await.unwrap();

    axum::serve(listener, app).await.unwrap();
}
