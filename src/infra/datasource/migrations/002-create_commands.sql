CREATE TABLE IF NOT EXISTS commands (
    id UUID PRIMARY KEY,
    aggregate_id UUID,
    type TEXT,
    status TEXT,
    updated_at TEXT,
    created_at TEXT,
    retry_count INTEGER,
    data BLOB
);

CREATE INDEX idx_command_pending ON commands(status, created_at)

