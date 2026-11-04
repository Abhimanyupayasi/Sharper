
import type { SQLiteDatabase } from "expo-sqlite";
import { generateId, getCurrentTimestamp } from "../utils";

export type PointNote = {
  id: string;
  category_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export async function createPointNote(
  db: SQLiteDatabase,
  categoryId: string,
  title: string,
  content: string
): Promise<void> {
  const cleanTitle = title.trim();
  const cleanContent = content.trim();

  if (!cleanTitle || !cleanContent) {
    throw new Error("Title and content are required.");
  }

  const now = getCurrentTimestamp();

  await db.runAsync(
    `INSERT INTO point_notes
      (id, category_id, title, content, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    generateId(),
    categoryId,
    cleanTitle,
    cleanContent,
    now,
    now
  );
}

export async function getPointNotes(
  db: SQLiteDatabase,
  categoryId: string
): Promise<PointNote[]> {
  return db.getAllAsync<PointNote>(
    `SELECT * FROM point_notes
     WHERE category_id = ?
     ORDER BY created_at DESC`,
    categoryId
  );
}

export async function getPointNoteById(
  db: SQLiteDatabase,
  id: string
): Promise<PointNote | null> {
  return db.getFirstAsync<PointNote>(
    `SELECT * FROM point_notes WHERE id = ?`,
    id
  );
}

export async function updatePointNote(
  db: SQLiteDatabase,
  id: string,
  title: string,
  content: string
): Promise<void> {
  const cleanTitle = title.trim();
  const cleanContent = content.trim();

  if (!cleanTitle || !cleanContent) {
    throw new Error("Title and content are required.");
  }

  await db.runAsync(
    `UPDATE point_notes
     SET title = ?, content = ?, updated_at = ?
     WHERE id = ?`,
    cleanTitle,
    cleanContent,
    getCurrentTimestamp(),
    id
  );
}

export async function deletePointNote(
  db: SQLiteDatabase,
  id: string
): Promise<void> {
  await db.runAsync(
    `DELETE FROM point_notes WHERE id = ?`,
    id
  );
}

export async function searchPointNotes(
  db: SQLiteDatabase,
  search: string,
  categoryId?: string
): Promise<PointNote[]> {
  const term = `%${search.trim()}%`;

  if (categoryId) {
    return db.getAllAsync<PointNote>(
      `SELECT * FROM point_notes
       WHERE category_id = ?
       AND (title LIKE ? OR content LIKE ?)
       ORDER BY updated_at DESC`,
      categoryId,
      term,
      term
    );
  }

  return db.getAllAsync<PointNote>(
    `SELECT * FROM point_notes
     WHERE title LIKE ? OR content LIKE ?
     ORDER BY updated_at DESC`,
    term,
    term
  );
}
