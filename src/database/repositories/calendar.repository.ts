import type { SQLiteDatabase } from "expo-sqlite";

export type DailyNote = {
  id: string;
  note_date: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export async function getDailyNote(
  db: SQLiteDatabase,
  date: string
): Promise<DailyNote | null> {
  return db.getFirstAsync<DailyNote>(
    `SELECT * FROM daily_notes WHERE note_date = ?`,
    date
  );
}

export async function getAllDailyNotes(
  db: SQLiteDatabase
): Promise<DailyNote[]> {
  return db.getAllAsync<DailyNote>(
    `SELECT * FROM daily_notes ORDER BY note_date ASC`
  );
}

export async function saveDailyNote(
  db: SQLiteDatabase,
  date: string,
  content: string
): Promise<void> {
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO daily_notes (id, note_date, content, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(note_date)
     DO UPDATE SET
       content = excluded.content,
       updated_at = excluded.updated_at`,
    `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    date,
    content,
    now,
    now
  );
}

export async function deleteDailyNote(
  db: SQLiteDatabase,
  date: string
): Promise<void> {
  await db.runAsync(
    `DELETE FROM daily_notes WHERE note_date = ?`,
    date
  );
}