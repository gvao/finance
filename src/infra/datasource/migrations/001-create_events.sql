CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY NOT NULL,
    command_id UUID,
    aggregate_id UUID,
    type TEXT,
    data BLOB
)