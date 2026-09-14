//Import the postgre sql connectiob pool type.
use crate::config::Config;
use crate::db;
use crate::match_engine::queue::MatchJobSender;
use crate::redis_client::Redis;
use sqlx::PgPool;
use std::sync::Arc;

//App state that can be shared across all req handlers
// the clone trait allows to create multiple copies of the state
#[derive(Clone)]
pub struct AppState {
    pub config: Arc<Config>,
    pub db: sqlx::PgPool,
    pub redis: Redis,
    pub match_tx: MatchJobSender, // mpsc Sender<MatchJob>
}

impl AppState {
    pub async fn bootstrap() -> anyhow::Result<Self> {
        let config = Config::from_env();
        let db = db::connect(&config.database_url).await?;
        db::run_migrations(&db).await?;
        let redis = Redis::connect(&config.redis_url).await?;
        // Spawn the match worker; we get back only the Sender side.
        let match_tx =
            crate::match_engine::queue::spawn_worker(config.clone(), db.clone(), redis.clone());
        Ok(Self {
            config,
            db,
            redis,
            match_tx,
        })
    }
}
