CREATE TABLE IF NOT EXISTS gallery_images (
 id TEXT PRIMARY KEY,
 object_key TEXT NOT NULL UNIQUE,
 title TEXT NOT NULL DEFAULT '',
 alt_text TEXT NOT NULL DEFAULT '',
 display_order INTEGER NOT NULL DEFAULT 0,
 active INTEGER NOT NULL DEFAULT 1,
 content_type TEXT NOT NULL,
 size_bytes INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL DEFAULT(datetime('now')),
 updated_at TEXT NOT NULL DEFAULT(datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_gallery_display ON gallery_images(active,display_order,created_at);
