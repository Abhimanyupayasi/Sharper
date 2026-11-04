
import type { SQLiteDatabase } from "expo-sqlite";
import { generateId, getCurrentTimestamp } from "../utils";

export type ChapterNote = {
  id: string;
  category_id: string;
  chapter_number: number;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export type ChapterBlockType =
  | "heading"
  | "paragraph"
  | "bullet"
  | "numbered";

export type ChapterBlock = {
  id: string;
  chapter_id: string;
  block_type: ChapterBlockType;
  content: string;
  position: number;
  created_at: string;
  updated_at: string;
};

export async function createChapter(
  db: SQLiteDatabase,
  categoryId: string,
  chapterNumber: number,
  title: string,
  description = ""
): Promise<void> {
  if (!Number.isInteger(chapterNumber) || chapterNumber < 1) {
    throw new Error("Chapter number must be a positive integer.");
  }

  if (!title.trim()) {
    throw new Error("Chapter title is required.");
  }

  const now = getCurrentTimestamp();

  await db.runAsync(
    `INSERT INTO chapter_notes
      (id, category_id, chapter_number, title, description, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    generateId(),
    categoryId,
    chapterNumber,
    title.trim(),
    description.trim(),
    now,
    now
  );
}

export async function getChapters(
  db: SQLiteDatabase,
  categoryId: string
): Promise<ChapterNote[]> {
  return db.getAllAsync<ChapterNote>(
    `SELECT * FROM chapter_notes
     WHERE category_id = ?
     ORDER BY chapter_number ASC`,
    categoryId
  );
}

export async function getChapterById(
  db: SQLiteDatabase,
  id: string
): Promise<ChapterNote | null> {
  return db.getFirstAsync<ChapterNote>(
    `SELECT * FROM chapter_notes WHERE id = ?`,
    id
  );
}

export async function updateChapter(
  db: SQLiteDatabase,
  id: string,
  chapterNumber: number,
  title: string,
  description = ""
): Promise<void> {
  if (!Number.isInteger(chapterNumber) || chapterNumber < 1) {
    throw new Error("Chapter number must be a positive integer.");
  }

  if (!title.trim()) {
    throw new Error("Chapter title is required.");
  }

  await db.runAsync(
    `UPDATE chapter_notes
     SET chapter_number = ?,
         title = ?,
         description = ?,
         updated_at = ?
     WHERE id = ?`,
    chapterNumber,
    title.trim(),
    description.trim(),
    getCurrentTimestamp(),
    id
  );
}

export async function deleteChapter(
  db: SQLiteDatabase,
  id: string
): Promise<void> {
  await db.runAsync(
    `DELETE FROM chapter_notes WHERE id = ?`,
    id
  );
}

export async function searchChapters(
  db: SQLiteDatabase,
  search: string,
  categoryId?: string
): Promise<ChapterNote[]> {
  const term = `%${search.trim()}%`;

  if (categoryId) {
    return db.getAllAsync<ChapterNote>(
      `SELECT * FROM chapter_notes
       WHERE category_id = ?
       AND (title LIKE ? OR description LIKE ?
         OR CAST(chapter_number AS TEXT) LIKE ?)
       ORDER BY chapter_number ASC`,
      categoryId,
      term,
      term,
      term
    );
  }

  return db.getAllAsync<ChapterNote>(
    `SELECT * FROM chapter_notes
     WHERE title LIKE ? OR description LIKE ?
       OR CAST(chapter_number AS TEXT) LIKE ?
     ORDER BY chapter_number ASC`,
    term,
    term,
    term
  );
}

// CHAPTER CONTENT BLOCKS

export async function createChapterBlock(
  db: SQLiteDatabase,
  chapterId: string,
  blockType: ChapterBlockType,
  content: string,
  position: number
): Promise<void> {
  if (!content.trim()) {
    throw new Error("Block content is required.");
  }

  const now = getCurrentTimestamp();

  await db.runAsync(
    `INSERT INTO chapter_blocks
      (id, chapter_id, block_type, content, position, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    generateId(),
    chapterId,
    blockType,
    content.trim(),
    position,
    now,
    now
  );

  await db.runAsync(
    `UPDATE chapter_notes SET updated_at = ? WHERE id = ?`,
    now,
    chapterId
  );
}

export async function getChapterBlocks(
  db: SQLiteDatabase,
  chapterId: string
): Promise<ChapterBlock[]> {
  return db.getAllAsync<ChapterBlock>(
    `SELECT * FROM chapter_blocks
     WHERE chapter_id = ?
     ORDER BY position ASC`,
    chapterId
  );
}

export async function updateChapterBlock(
  db: SQLiteDatabase,
  id: string,
  content: string
): Promise<void> {
  if (!content.trim()) {
    throw new Error("Block content is required.");
  }

  await db.runAsync(
    `UPDATE chapter_blocks
     SET content = ?, updated_at = ?
     WHERE id = ?`,
    content.trim(),
    getCurrentTimestamp(),
    id
  );
}

export async function deleteChapterBlock(
  db: SQLiteDatabase,
  id: string
): Promise<void> {
  await db.runAsync(
    `DELETE FROM chapter_blocks WHERE id = ?`,
    id
  );
}

export async function reorderChapterBlocks(
  db: SQLiteDatabase,
  chapterId: string,
  orderedIds: string[]
): Promise<void> {
  await db.withTransactionAsync(async () => {
    const now = getCurrentTimestamp();

    for (const [index, id] of orderedIds.entries()) {
      await db.runAsync(
        `UPDATE chapter_blocks
         SET position = ?, updated_at = ?
         WHERE id = ? AND chapter_id = ?`,
        index,
        now,
        id,
        chapterId
      );
    }

    await db.runAsync(
      `UPDATE chapter_notes SET updated_at = ? WHERE id = ?`,
      now,
      chapterId
    );
  });
}
