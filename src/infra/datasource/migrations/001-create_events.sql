CREATE TABLE events (
  id TEXT PRIMARY KEY,

  aggregate_id TEXT NOT NULL,
  version INTEGER NOT NULL,

  command_id TEXT NOT NULL,

  type TEXT NOT NULL,

  payload BLOB NOT NULL,

  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);