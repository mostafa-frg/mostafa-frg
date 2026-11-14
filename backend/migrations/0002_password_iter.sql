-- Record the PBKDF2 iteration count per user so it can be raised later without invalidating existing hashes.
ALTER TABLE users ADD COLUMN password_iter INTEGER NOT NULL DEFAULT 100000;
