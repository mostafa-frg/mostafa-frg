-- Per-user daily counter for the AI assistant. Stores no prompts and no answers.
CREATE TABLE IF NOT EXISTS ai_usage(
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0 CHECK(count>=0),
  PRIMARY KEY(user_id, day)
);
