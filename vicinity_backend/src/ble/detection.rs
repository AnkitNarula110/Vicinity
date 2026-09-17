//! `POST /ble/detections`
//! Behaviour (spec Step 4.2):
//!   1. For each detection, skip if rssi < -80 dBm.
//!   2. Resolve token → user_id via Redis. Skip unknown tokens.
//!   3. Skip self-detections (scanner == detected).
//!   4. Derive `venue_id` from lat/lng via geohash(6).
//!   5. ZADD both users into `venue:{venue_id}:users`.
//!   6. Push a match-scoring job onto the queue.
//!   7. Return 200 immediately — scoring is async.

use axum::{extract::State, http::StatusCode, Json};

use crate::auth::Claims;
use crate::ble::model::DetectionReport;
use crate::error::AppError;
use crate::match_engine::queue::MatchJob;
use crate::state::AppState;

/// Geohash precision 6 ≈ 1.2 km × 0.6 km cell.
/// Used as a stand-in venue id until a real venue DB exists.
/// Swap for a proper geohash crate (`geohash`) in production;
/// the inline version here avoids an extra dependency for clarity.
pub fn geohash6(lat: f64, lng: f64) -> String {
    // Base32 alphabet used by the geohash spec.
    const B32: &[u8] = b"0123456789bcdefghjkmnpqrstuvwxyz";
    let (mut lat_lo, mut lat_hi) = (-90.0_f64, 90.0_f64);
    let (mut lng_lo, mut lng_hi) = (-180.0_f64, 180.0_f64);
    let mut out = String::with_capacity(6);
    let mut bits = 0u8; //5 bits per output
    let mut bit_count = 0u8;
    let mut even = true; // true = lng bit, false = lat bit (geohash alternates)

    while out.len() < 6 {
        if even {
            let mid = (lng_lo + lng_hi) / 2.0;
            if lng >= mid {
                bits = (bits << 1) | 1;
                lng_lo = mid;
            } else {
                {
                    bits <<= 1;
                    lng_hi = mid;
                }
            }
        } else {
            let mid = (lat_lo + lat_hi) / 2.0;
            if lat >= mid {
                bits = (bits << 1) | 1;
                lat_lo = mid;
            } else {
                bits <<= 1;
                lat_hi = mid;
            }
        }

        even = !even;
        bit_count += 1;
        if bit_count == 5 {
            out.push(B32[bits as usize] as char);
            bits = 0;
            bit_count = 0;
        }
    }
    out
}

pub async fn report_detections(
    State(state): State<AppState>,
    claims: Claims,
    Json(body): Json<DetectionReport>,
) -> Result<StatusCode, AppError> {
    // The spec passes `scanner_user_id` in the body, but we trust the JWT
    // instead — a client must not be able to impersonate another scanner.
    let scanner = claims.sub;
    if scanner != body.scanner_user_id {
        return Err(AppError::Forbidden("scanner_user_id does not match JWT"));
    }

    // Derive the venue id once per batch.
    let venue_id = geohash6(body.venue_hint.lat, body.venue_hint.lng);
    let now = chrono::Utc::now().timestamp();
    // Track the scanner's own presence so /nearby can see them.
    state.redis.zadd_venue_user(&venue_id, scanner, now).await?;

    for det in body.detections {
        // GATE 1 — signal strength. Weak packets are too far to count.
        if det.rssi < state.config.rssi_min_dbm {
            continue;
        }

        let Some(detected) = state.redis.get_ble_token(&det.token).await? else {
            continue;
        };

        if detected == scanner {
            continue;
        }

        state
            .redis
            .zadd_venue_user(&venue_id, detected, det.timestamp)
            .await?;

        // GATE 4 — enqueue an async scoring job. Fire-and-forget:
        // the HTTP response does not wait for the worker.
        let _ = state
            .match_tx
            .send(MatchJob {
                user_a: scanner,
                user_b: detected,
                venue_id: venue_id.clone(),
            })
            .await;
    }

    Ok(StatusCode::OK)
}
