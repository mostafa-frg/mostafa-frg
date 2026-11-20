-- Scope tool permissions to individual accounts; legacy global grants are no longer consulted.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS user_tool_access(
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tool_id TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)),
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(user_id, tool_id)
);
CREATE INDEX IF NOT EXISTS idx_user_tool_access_tool ON user_tool_access(tool_id, enabled);
