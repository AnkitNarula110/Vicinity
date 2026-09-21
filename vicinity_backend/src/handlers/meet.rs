//! handlers/meets.rs
//! -----------------
//! POST /meets
//! GET  /meets/:id
//! POST /meets/:id/safe-word

use axum::{
    extract::{Path, State},
    Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::error::AppError;
use crate::state::AppState;

// ── POST /meets ────────────────────────────────────────────────────────
#[derive(Debug, Deserialize)]
pub struct ConfirmMeetBody {
    pub user_id: Uuid,
    pub nudge_id: Uuid,
}

#[derive(Debug, Serialize)]
pub struct MeetResponse {
    pub meet: serde_json::Value,
}

pub async fn confirm_meet(
    State(state): State<AppState>,
    Json(body): Json<ConfirmMeetBody>,
) -> Result<Json<MeetResponse>, AppError> {
    // Verify the nudge is mutual before allowing confirmation.
    let nudge = crate::repos::nudges::get_by_id(&state.db, body.nudge_id)
        .await?
        .ok_or(AppError::NotFound)?;

    let status = nudge.get("status").and_then(|v| v.as_str()).unwrap_or("");

    if status != "mutual" {
        return Err(AppError::BadRequest("nudge is not mutual".into()));
    }

    // Upsert a meet row keyed by nudge_id.
    let meet = crate::repos::meets::confirm(&state.db, body.nudge_id, body.user_id).await?;

    // When BOTH sides confirm, write the 15-min location hash to Redis.
    if meet.is_fully_confirmed() {
        let expires_at =
            chrono::Utc::now() + chrono::Duration::seconds(state.config.meet_location_ttl);
        state
            .redis
            .set_meet_location(
                meet.id(),
                meet.user_a_id(),
                meet.user_b_id(),
                expires_at.timestamp(),
            )
            .await?;
    }

    let meet_json = crate::repos::meets::get_by_id(&state.db, meet.id())
        .await?
        .ok_or(AppError::NotFound)?;

    Ok(Json(MeetResponse { meet: meet_json }))
}

// ── GET /meets/:id ─────────────────────────────────────────────────────
pub async fn get_meet(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<MeetResponse>, AppError> {
    let meet = crate::repos::meets::get_with_location(&state.db, &state.redis, id)
        .await?
        .ok_or(AppError::NotFound)?;
    Ok(Json(MeetResponse { meet }))
}

// ── POST /meets/:id/safe-word ──────────────────────────────────────────
#[derive(Debug, Deserialize)]
pub struct SafeWordBody {
    pub user_id: Uuid,
    pub note: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct SafeWordResponse {
    pub success: bool,
    pub flag_id: Uuid,
}

pub async fn safe_word(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(body): Json<SafeWordBody>,
) -> Result<Json<SafeWordResponse>, AppError> {
    let flag_id =
        crate::repos::safe_word::create(&state.db, id, body.user_id, body.note.as_deref()).await?;
    // Fire alert (stub — real version pages the on-call safety team).
    crate::handlers::fcm::send_safe_word_alert(&state.db, id, body.user_id).await?;
    Ok(Json(SafeWordResponse {
        success: true,
        flag_id,
    }))
}
