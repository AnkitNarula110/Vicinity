//! -------------------
//! The match scoring subsystem. Equivalent to the Bull/BullMQ worker
//! in the Node spec, but implemented with a tokio mpsc channel:
//!   - `queue::spawn_worker` owns the Receiver and loops forever.
//!   - HTTP handlers hold the Sender and `send(MatchJob).await`.
//!   - Jobs are processed in order, one at a time (matching Bull's
//!     default concurrency of 1). Bump with `for_each_concurrent` if needed.

pub mod gates;
pub mod queue;
pub mod scoring;
pub mod vector;
pub mod worker;
