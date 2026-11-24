CREATE TABLE IF NOT EXISTS tutorial_comments (
  id TEXT PRIMARY KEY NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  delete_key_hash TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS tutorial_comments_by_date ON tutorial_comments (created_at DESC, id DESC);
