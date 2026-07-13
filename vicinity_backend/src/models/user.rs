use chrono::{NaiveDate, NaiveDateTime};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Deserialize, Serialize, Clone, FromRow)]
pub struct User {
    pub userid: Uuid,
    pub username: String,
    pub email: String,
    pub dob: Option<NaiveDate>,
    pub password: String,
    pub aadharnumber: Option<String>, // If NULL is allowed
    pub address: Option<String>,      // If NULL is allowed
    pub isactive: bool,               // Keep as bool if NOT NULL
    pub createddate: NaiveDateTime,   // Keep as datetime if NOT NULL
    pub phone: String,
    pub onboarding_data: serde_json::Value,
    pub completed_onboarding: bool, // Keep as bool if NOT NULL
}
// For querying from database
#[derive(Debug, Deserialize, Serialize, FromRow)]
pub struct UserDb {
    pub userid: Uuid,
    pub username: String,
    pub email: String,
    pub dob: Option<NaiveDate>,
    pub password: String,
    pub aadharnumber: Option<String>,
    pub address: Option<String>,
    pub isactive: bool,
    pub createddate: NaiveDateTime,
    pub phone: String,
    pub onboarding_data: serde_json::Value,
    pub completed_onboarding: bool,
}
