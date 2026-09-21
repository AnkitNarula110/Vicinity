mod auth;
mod ble;
mod config;
mod db;
mod error;
mod handlers;
mod match_engine;
mod models;
mod redis_client;
mod repos;
mod routes;
mod state;

use dotenv::dotenv;
use std::env;

use axum::http::HeaderValue;
use tower_http::cors::CorsLayer;
use tracing_subscriber;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenv().ok();

    tracing_subscriber::fmt().init();

    let pool = db::create_pool().await;
    let state = state::AppState::bootstrap().await?;

    let cors = CorsLayer::new()
        .allow_origin("http://localhost:8081".parse::<HeaderValue>().unwrap())
        .allow_methods([axum::http::Method::GET, axum::http::Method::POST])
        .allow_headers([axum::http::header::CONTENT_TYPE]);

    let app = routes::create_routes(state).layer(cors);

    let port = env::var("PORT").unwrap_or("3000".to_string());

    let address = format!("0.0.0.0:{}", port);

    println!("Server running on {}", address);

    let listener = tokio::net::TcpListener::bind(address).await.unwrap();

    axum::serve(listener, app).await.unwrap();

    Ok(())
}
