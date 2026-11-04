export const DATABASE_SCHEMA = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS daily_notes (
    id TEXT PRIMARY KEY NOT NULL,
    note_date TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_daily_notes_date
  ON daily_notes(note_date);

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#635BFF',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_name
  ON categories(LOWER(name));

  CREATE TABLE IF NOT EXISTS point_notes (
    id TEXT PRIMARY KEY NOT NULL,
    category_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_point_notes_category
  ON point_notes(category_id);

  -- EACH POINT IS STORED AS AN INDIVIDUAL ROW
  CREATE TABLE IF NOT EXISTS point_note_items (
    id TEXT PRIMARY KEY NOT NULL,
    point_note_id TEXT NOT NULL,
    content TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (point_note_id) REFERENCES point_notes(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_point_note_items_parent
  ON point_note_items(point_note_id, position);

  CREATE TABLE IF NOT EXISTS chapter_notes (
    id TEXT PRIMARY KEY NOT NULL,
    category_id TEXT NOT NULL,
    chapter_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE(category_id, chapter_number)
  );

  CREATE INDEX IF NOT EXISTS idx_chapter_notes_category
  ON chapter_notes(category_id);

  CREATE TABLE IF NOT EXISTS chapter_blocks (
    id TEXT PRIMARY KEY NOT NULL,
    chapter_id TEXT NOT NULL,
    block_type TEXT NOT NULL CHECK (
      block_type IN ('heading', 'paragraph', 'bullet', 'numbered')
    ),
    content TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (chapter_id) REFERENCES chapter_notes(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_chapter_blocks_chapter
  ON chapter_blocks(chapter_id, position);
`;