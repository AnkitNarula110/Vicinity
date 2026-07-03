//Import the postgre sql connectiob pool type.
use sqlx::PgPool;

//App state that can be shared across all req handlers
// the clone trait allows to create multiple copies of the state
#[derive(Clone)]
pub struct AppState {
    // db connection pool - stores active db connections
    pub db: PgPool,
}
