//! config.rs
//! ---------
//! Loads environment variables into a typed `Config` struct.
//! Behaviour:
//!   - Reads from `.env` (via dotenvy) and the process environment.
//!   - Fails fast at startup if a required variable is missing.
//!   - `config()` returns a cheap clone (Arc inside) so handlers can own it.

use std::sync::Arc;

/// All runtime configuration. Wrapped in `Arc` so cloning is cheap.
#[derive(Clone)]
pub struct Config {
    pub database_url: String,    // postgres://user:pass@host/db
    pub redis_url: String,       // redis://host:port
    pub jwt_secret: String,      // HMAC secret for signing JWTs
    pub ble_token_ttl_secs: i64, // 1020 = 17 min (spec: 15 min active + 2 min overlap)
    pub ble_returned_ttl: i64,   // 900 = 15 min returned to the client
    pub rssi_min_dbm: i32,       // -80: anything weaker is skipped
    pub match_min_score: f64,    // 70.0: below this, do not notify
    pub match_max_per_day: i64,  // 5: daily notification cap
    pub pair_cooldown_secs: i64, // 86400 = 24 h
    pub venue_presence_ttl: i64, // 300 s (5 min) used when reading venue sets
    pub meet_location_ttl: i64,  // 900 s = 15 min location reveal window
}

impl Config {
    /// Reads env vars and returns a boxed `Arc<Config>`.
    /// Panics on missing required vars — fail fast is intentional.
    pub fn from_env() -> Arc<Self> {
        // `dotenvy::dotenv().ok()` silently ignores a missing .env file,
        // because production environments usually inject real env vars.
        dotenvy::dotenv().ok();

        // `env_or` returns a default when a var is unset — used for tunables.
        fn env_or(key: &str, default: &str) -> String {
            std::env::var(key).unwrap_or_else(|_| default.to_string())
        }
        // `env_required` panics if the var is missing — used for secrets/URLs.
        fn env_required(key: &str) -> String {
            std::env::var(key).unwrap_or_else(|_| panic!("missing env var {key}"))
        }

        Arc::new(Self {
            database_url: env_required("DATABASE_URL"),
            redis_url: env_required("REDIS_URL"),
            jwt_secret: env_required("JWT_SECRET"),
            ble_token_ttl_secs: env_or("BLE_TOKEN_TTL", "1020").parse().unwrap(),
            ble_returned_ttl: env_or("BLE_RETURNED_TTL", "900").parse().unwrap(),
            rssi_min_dbm: env_or("RSSI_MIN_DBM", "-80").parse().unwrap(),
            match_min_score: env_or("MATCH_MIN_SCORE", "70").parse().unwrap(),
            match_max_per_day: env_or("MATCH_MAX_PER_DAY", "5").parse().unwrap(),
            pair_cooldown_secs: env_or("PAIR_COOLDOWN_SECS", "86400").parse().unwrap(),
            venue_presence_ttl: env_or("VENUE_PRESENCE_TTL", "300").parse().unwrap(),
            meet_location_ttl: env_or("MEET_LOCATION_TTL", "900").parse().unwrap(),
        })
    }
}
