-- Keep atomic rolling-window attempt reservations efficient under concurrent authentication traffic.
CREATE INDEX IF NOT EXISTS idx_auth_attempts_pair_window ON auth_attempts(username, ip_hash, attempted_at);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_ip_window ON auth_attempts(ip_hash, attempted_at);
