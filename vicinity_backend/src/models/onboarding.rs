use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct OnboardingData {
    pub full_name: String,
    pub college: String,
    pub intent: String,
    pub intent_index: i32,
    pub color_index: i32,
    pub vibe_tags: Vec<String>,
    pub playlist: String,
    pub artist: String,
    pub movie: String,
    pub spots: String,
    pub is_smoker: bool,
    pub is_drinker: bool,
    pub mood: String,
    pub mood_index: i32,
    pub prompt_raw: String,
    pub prompt_index: i32,
    pub prompt: String,
    pub profile_picture: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CompleteRegistrationRequest {
    // Basic user info
    pub username: String,
    pub email: String,
    pub password: String,
    pub phone: String,
    pub dob: Option<NaiveDate>,
    pub aadharnumber: Option<String>,
    pub address: Option<String>,

    // Onboarding data as JSON
    pub onboarding_data: OnboardingData,
}

#[derive(Debug, Serialize)]
pub struct CompleteRegistrationResponse {
    pub userid: Uuid,
    pub message: String,
    pub onboarding_complete: bool,
}
