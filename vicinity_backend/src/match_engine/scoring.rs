//! match_engine/scoring.rs
//! -----------------------
//! Dot-product similarity with 0–100 normalisation.
//! Behaviour (spec Step 5, step 3):
//!   - For each tag in A's vector, if B has it, multiply weights.
//!   - Sum the products → raw score.
//!   - Normalise to 0–100 using the maximum possible product
//!     (i.e. both users weight every shared tag at 1.0).
//!
//! Why this normalisation: it keeps the score comparable across users
//! with different numbers of tags, and it's cheap (no extra passes).

use std::collections::HashMap;

pub fn dot_product_score(a: &HashMap<String, f64>, b: &HashMap<String, f64>) -> f64 {
    // Raw dot product across shared tags.
    let mut raw = 0.0_f64;
    for (tag, wa) in a {
        if let Some(wb) = b.get(tag) {
            raw += wa * wb;
        }
    }

    // Upper bound: sum of min(len(a), len(b)) products of 1.0 * 1.0.
    // i.e. the maximum raw score if every shared tag were weighted 1.0.
    let max_possible = a.len().min(b.len()) as f64;
    if max_possible == 0.0 {
        return 0.0; // no shared vocabulary → no match
    }

    // Scale to 0–100 and clamp to guard against float drift.
    ((raw / max_possible) * 100.0).clamp(0.0, 100.0)
}
