CREATE TABLE IF NOT EXISTS users (
 id TEXT PRIMARY KEY,
 email TEXT NOT NULL UNIQUE COLLATE NOCASE,
 name TEXT NOT NULL,
 role TEXT NOT NULL CHECK(role IN ('admin','editor')),
 password_hash TEXT NOT NULL,
 password_salt TEXT NOT NULL,
 password_iterations INTEGER NOT NULL,
 active INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL DEFAULT(datetime('now')),
 updated_at TEXT NOT NULL DEFAULT(datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions (
 id TEXT PRIMARY KEY,
 user_id TEXT NOT NULL,
 token_hash TEXT NOT NULL UNIQUE,
 csrf_token TEXT NOT NULL,
 expires_at TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT(datetime('now')),
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE TABLE IF NOT EXISTS login_attempts (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 email TEXT NOT NULL,
 ip TEXT NOT NULL,
 success INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL DEFAULT(datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_login_attempts ON login_attempts(email,ip,created_at);
