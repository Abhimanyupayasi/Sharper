
import type { SQLiteDatabase } from "expo-sqlite";
import { generateId, getCurrentTimestamp } from "../utils";

export type Category = {
  id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
  point_note_count?: number;
  chapter_count?: number;
};

export async function createCategory(
  db: SQLiteDatabase,
  name: string,
  color = "#635BFF"
): Promise<void> {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("Category name is required.");
  }

  const now = getCurrentTimestamp();

  await db.runAsync(
    `INSERT INTO categories
      (id, name, color, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    generateId(),
    trimmedName,
    color,
    now,
    now
  );
}

export async function getCategories(
  db: SQLiteDatabase
): Promise<Category[]> {
  return db.getAllAsync<Category>(
    `SELECT
      c.*,
      (SELECT COUNT(*) FROM point_notes p
       WHERE p.category_id = c.id) AS point_note_count,
      (SELECT COUNT(*) FROM chapter_notes ch
       WHERE ch.category_id = c.id) AS chapter_count
     FROM categories c
     ORDER BY c.name COLLATE NOCASE ASC`
  );
}

export async function getCategoryById(
  db: SQLiteDatabase,
  id: string
): Promise<Category | null> {
  return db.getFirstAsync<Category>(
    `SELECT * FROM categories WHERE id = ?`,
    id
  );
}

export async function updateCategory(
  db: SQLiteDatabase,
  id: string,
  name: string,
  color: string
): Promise<void> {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("Category name is required.");
  }

  await db.runAsync(
    `UPDATE categories
     SET name = ?, color = ?, updated_at = ?
     WHERE id = ?`,
    trimmedName,
    color,
    getCurrentTimestamp(),
    id
  );
}

export async function deleteCategory(
  db: SQLiteDatabase,
  id: string
): Promise<void> {
  await db.runAsync(
    `DELETE FROM categories WHERE id = ?`,
    id
  );
}

export async function searchCategories(
  db: SQLiteDatabase,
  search: string
): Promise<Category[]> {
  return db.getAllAsync<Category>(
    `SELECT
      c.*,
      (SELECT COUNT(*) FROM point_notes p
       WHERE p.category_id = c.id) AS point_note_count,
      (SELECT COUNT(*) FROM chapter_notes ch
       WHERE ch.category_id = c.id) AS chapter_count
     FROM categories c
     WHERE c.name LIKE ?
     ORDER BY c.name COLLATE NOCASE ASC`,
    `%${search.trim()}%`
  );
}
