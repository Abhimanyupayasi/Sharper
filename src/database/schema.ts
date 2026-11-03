
export const CREATE_DAILY_NOTES_TABLE = `
  CREATE TABLE IF NOT EXISTS daily_notes (
    id TEXT PRIMARY KEY NOT NULL,
    note_date TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_daily_notes_date
  ON daily_notes(note_date);
`;
