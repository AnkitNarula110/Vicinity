//! ---------------------
//! The in-process job queue. Replaces BullMQ.
//! Behaviour:
//!   - Bounded mpsc channel (capacity 1024) provides backpressure.
//!   - `spawn_worker` returns the Sender; the Receiver is moved into a
//!     background tokio task.
//!   - `send().await` awaits only when the channel is full.
//!

use std::sync::Arc;
use tokio::sync::mpsc;
use uuid::Uuid;

use crate::config::Config;
use crate::match_engine::worker;
use crate::redis_client::Redis;

/// One unit of scoring work. `venue_id` is carried for logging/future use.
#[derive(Debug, Clone)]
pub struct MatchJob {
    pub user_a: Uuid,
    pub user_b: Uuid,
    pub venue_id: String,
}

/// Cloneable sender handle stored in `AppState`.
pub type MatchJobSender = mpsc::Sender<MatchJob>;

pub fn spawn_worker(config: Arc<Config>, db: PgPool, redis: Redis) -> MatchJobSender {
    // Bounded channel: 1024 buffered jobs. When full, `send().await` blocks,
    // which is exactly the backpressure we want.
    let (tx, mut rx) = mpsc::channel::<MatchJob>(1024);

    // Move the Receiver into a long-lived tokio task.
    tokio::spawn(async move {
        // `recv()` yields `Some(job)` until all Senders are dropped.
        while let Some(job) = rx.recv().await {
            // Each job is processed by `worker::process_job`. We log and
            // swallow errors so one bad job doesn't kill the loop.
            if let Err(e) = worker::process_job(&config, &db, &redis, &job).await {
                tracing::error!(?job, error = ?e, "match job failed");
            }
        }
        tracing::info!("match worker shutting down");
    });

    tx
}
