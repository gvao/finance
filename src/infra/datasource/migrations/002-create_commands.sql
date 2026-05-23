CREATE TABLE IF NOT EXISTS commands (
    id UUID PRIMARY KEY,
    type TEXT,
    data BLOB
)