//! ------------------
//! GET /nearby
//!
//! Behaviour:
//!   1. Read the current user's venue from Redis (last heartbeat).
//!   2. Fetch all user_ids in that venue with score > now - 300s.
//!   3. Load each user's profile + interests from Postgres.
//!   4. Score against the current user's interest vector.
//!   5. Sort by score desc, exclude blocked + cooldown pairs.
//!   6. Return { users: [...] }.
//!

use axum::{
    extract::{Query, State},
    Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    error::AppError,
    match_engine::{scoring, vector},
    state::AppState,
};
#[derive(Debug, Deserialize)]
pub struct NearbyQuery {
    pub user_id: Uuid,
}

#[derive(Debug, Serialize)]
pub struct NearbyUser {
    pub id: Uuid,
    pub display_name: String,
    pub avatar_url: Option<String>,
    pub interest_tags: Vec<String>,
    pub distance_label: String,
    pub match_score: f64,
}

#[derive(Serialize)]
pub struct NearbyResponse {
    pub users: Vec<NearbyUser>,
}

pub async fn get_nearby(
    State(state): State<AppState>,
    Query(query): Query<NearbyQuery>,
) -> Result<Json<NearbyResponse>, AppError> {
    let me = query.user_id;

    // 1. Find which venue I'm currently in.
    // We use the most recent venue set the user appears in.
    // For simplicity, we scan the currently-tracked venues.
    let venue_id = state.redis.find_user_venue(me).await?;
    let Some(venue_id) = venue_id else {
        return Ok(Json(NearbyResponse { users: vec![] }));
    };

    // 2. Fetch active members (score > now - VENUE_PRESENCE_TTL).
    let now = chrono::Utc::now().timestamp();
    let cutoff = now - state.config.venue_presence_ttl;
    let members = state
        .redis
        .zrangebyscore_venue_users(&venue_id, cutoff)
        .await?;
    let my_vector = vector::get_or_rebuild(&state.db, &state.redis, me).await?;
    let mut out: Vec<NearbyUser> = Vec::new();
    for (member_id_str, last_seen) in members {
        let Ok(other_id) = Uuid::parse_str(&member_id_str) else {
            continue;
        };
        if other_id == me {
            continue;
        }

        if state.redis.get_pair_cooldown(me, other_id).await? {
            continue;
        }
        if crate::repos::blocks::is_blocked(&state.db, me, other_id).await? {
            continue;
        }

        let Some(profile) = crate::repos::users::get_profile(&state.db, other_id).await? else {
            continue;
        };
        // Compute score.
        let other_vector = vector::get_or_rebuild(&state.db, &state.redis, other_id).await?;
        let score = scoring::dot_product_score(&my_vector, &other_vector);

        // Derive a distance label from "last seen seconds ago".
        let age = now - last_seen;
        let distance_label = if age <= 10 {
            "here"
        } else if age <= 60 {
            "close"
        } else {
            "near"
        };

        let interest_tags: Vec<String> = other_vector.keys().cloned().collect();

        out.push(NearbyUser {
            id: other_id,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            interest_tags,
            distance_label: distance_label.to_string(),
            match_score: score,
        });
    }
    // 4. Sort by match score descending.
    out.sort_by(|a, b| {
        b.match_score
            .partial_cmp(&a.match_score)
            .unwrap_or(std::cmp::Ordering::Equal)
    });

    Ok(Json(NearbyResponse { users: out }))
}
