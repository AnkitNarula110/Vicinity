use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Body for `POST /ble/detections`.
#[derive(Debug, Deserialize)]
pub struct DetectionReport {
    pub scanner_user_id: Uuid,
    pub detections: Vec<Detection>,
    pub venue_hint: VenueHint,
}

/// A single BLE packet observation from the scanner.
#[derive(Debug, Deserialize)]
pub struct Detection {
    pub token: String,  // the rotating UUID broadcast by the peer
    pub rssi: i32,      // signal strength in dBm
    pub timestamp: i64, // unix seconds when the packet was seen
}

/// Coarse location hint — only used to derive a geohash venue id.
#[derive(Debug, Deserialize)]
pub struct VenueHint {
    pub lat: f64,
    pub lng: f64,
}

/// Response for Post 'ble/token'
#[derive(Debug, Serialize)]
pub struct TokenResponse {
    pub token: String,
    pub expires_in: i64, // seconds
}

/// Body for `POST /ble/heartbeat`.
#[derive(Debug, Deserialize)]
pub struct HeartbeatBody {
    pub venue_hint: VenueHint,
}
