CREATE TABLE IF NOT EXISTS site_content (id INTEGER PRIMARY KEY CHECK(id=1),content TEXT NOT NULL,updated_at TEXT NOT NULL DEFAULT(datetime('now')));
