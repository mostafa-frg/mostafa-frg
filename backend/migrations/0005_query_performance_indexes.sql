-- Cover the expiry and filtered aggregate paths used by admin and user workspaces.
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_action_created ON audit_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_tool_access_user_enabled ON user_tool_access(user_id, enabled, tool_id);
