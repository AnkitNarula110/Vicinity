//! handlers/nudges.rs
//! ------------------
//! POST   /nudges
//! GET    /nudges?user_id=<uuid>
//! DELETE /nudges/:id

use axum::{
    extract::{Path, Query, State},
    Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::error::AppError;
use crate::state::AppState;

// ── POST /nudges ───────────────────────────────────────────────────────
#[derive(Debug, Deserialize)]
pub struct SendNudgeBody {
    pub from_user_id: Uuid,
    pub to_user_id: Uuid,
}

#[derive(Debug, Serialize)]
pub struct NudgeResponse {
    pub nudge: serde_json::Value,
}

pub async fn send_nudge(
    State(state): State<AppState>,
    Json(body): Json<SendNudgeBody>,
) -> Result<Json<NudgeResponse>, AppError> {
    if body.from_user_id == body.to_user_id {
        return Err(AppError::BadRequest("cannot nudge yourself".into()));
    }

    // Insert (or find existing) pending nudge.
    let nudge =
        crate::repos::nudges::create_or_get(&state.db, body.from_user_id, body.to_user_id).await?;

    // Check for reverse nudge → promote both to mutual.
    let mutual =
        crate::repos::nudges::promote_if_mutual(&state.db, body.from_user_id, body.to_user_id)
            .await?;

    // If mutual, send push to both. WS event is handled separately.
    if mutual {
        crate::handlers::fcm::send_nudge_mutual(&state.db, body.from_user_id, body.to_user_id)
            .await?;
    }

    // Re-fetch to get the updated row.
    let nudge = crate::repos::nudges::get_by_id(&state.db, nudge.id())
        .await?
        .ok_or(AppError::NotFound)?;

    Ok(Json(NudgeResponse { nudge }))
}

// ── GET /nudges ────────────────────────────────────────────────────────
#[derive(Debug, Deserialize)]
pub struct ListNudgesQuery {
    pub user_id: Uuid,
}

#[derive(Debug, Serialize)]
pub struct NudgesResponse {
    pub nudges: Vec<serde_json::Value>,
}

pub async fn list_nudges(
    State(state): State<AppState>,
    Query(q): Query<ListNudgesQuery>,
) -> Result<Json<NudgesResponse>, AppError> {
    let nudges = crate::repos::nudges::list_for_user(&state.db, q.user_id).await?;
    Ok(Json(NudgesResponse { nudges }))
}

// ── DELETE /nudges/:id ─────────────────────────────────────────────────
#[derive(Debug, Deserialize)]
pub struct CancelNudgeBody {
    pub user_id: Uuid,
}

pub async fn cancel_nudge(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(body): Json<CancelNudgeBody>,
) -> Result<Json<OkResponse>, AppError> {
    crate::repos::nudges::cancel(&state.db, id, body.user_id).await?;
    Ok(Json(OkResponse { success: true }))
}

#[derive(Debug, Serialize)]
pub struct OkResponse {
    pub success: bool,
}
