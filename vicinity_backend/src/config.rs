use argon2::password_hash::rand_core::OsRng;
use argon2::password_hash::{PasswordHasher, SaltString};
use argon2::Argon2;
use serde::{Deserialize, Serialize};
use std::env;

#[derive(Debug, Clone)]
pub struct AppConfig {
    pub database_url: String,
    pub redis_url: String,
    pub jwt_secret: String,
    pub jwt_expiration: i64,
    pub fcm_server_key: String,
    pub port: u16,
    pub env: String,
}

impl AppConfig {
    pub fn from_env() -> Self {
        //Get JWT secret from env or generate one
        let jwt_secret = env::var("JWT_SECRET").unwrap_or_else(|_| {
            //Generate a secure secret if not provided
            generate_jwt_secret()
        });

        Self {
            database_url: env::var("DATABASE_URL").expect("DATABASE_URL must be set"),
            redis_url: env::var("REDIS_URL").expect("REDIS_URL must be set"),
            jwt_secret,
            jwt_expiration: env::var("JWT_EXPIRATION")
                .unwrap_or_else(|_| "604800".to_string())
                .parse()
                .unwrap_or(604800),
            fcm_server_key: env::var("FCM_SERVER_KEY").unwrap_or_else(|_| "".to_string()),
            port: env::var("APP_PORT")
                .unwrap_or_else(|_| "8080".to_string())
                .parse()
                .unwrap_or(8080),
            env: env::var("APP_ENV").unwrap_or_else(|_| "development".to_string()),
        }
    }

    pub fn get_jwt_secret_bytes(&self) -> &[u8] {
        self.jwt_secret.as_bytes()
    }
}

///Generate a secure jwt secret
fn generate_jwt_secret() -> String {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();

    //generate a random string
    let secret = argon2
        .hash_password(
            format!("vicinity-secret-{}", chrono::Utc::now().timestamp()).as_bytes(),
            &salt,
        )
        .unwrap()
        .to_string();

    let parts: Vec<&str> = secret.split('$').collect();
    let hash = parts.last().unwrap_or(&"");

    println!("\n⚠️  JWT_SECRET not found in .env");
    println!("🔑 Generated new JWT_SECRET: {}", hash);
    println!("💡 Add this to your .env file:\n");
    println!("JWT_SECRET={}\n", hash);

    hash.to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JwtClaims {
    pub sub: String, // user_id
    pub exp: i64,    // expiration timestamp
    pub iat: i64,    // issued at timestamp
    pub aud: String, // audience
    pub iss: String, // issuer
}

impl JwtClaims {
    pub fn new(user_id: &str, expiration_seconds: i64) -> Self {
        let now = chrono::Utc::now().timestamp();
        Self {
            sub: user_id.to_string(),
            exp: now + expiration_seconds,
            iat: now,
            aud: "vicinity-app".to_string(),
            iss: "vicinity-backend".to_string(),
        }
    }
}
