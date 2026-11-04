import type { SQLiteDatabase } from "expo-sqlite";
import { DATABASE_SCHEMA } from "./schema";
import { initializeTodoTable } from "./repositories/todo.repository";

export async function initializeDatabase(db: SQLiteDatabase) {
  await db.execAsync(DATABASE_SCHEMA);
  await initializeTodoTable(db);

  // Migrate existing Point Notes into individual bullet items.
  const legacyNotes = await db.getAllAsync<{
    id: string;
    content: string;
    created_at: string;
    updated_at: string;
  }>(`
    SELECT p.id, p.content, p.created_at, p.updated_at
    FROM point_notes p
    WHERE NOT EXISTS (
      SELECT 1
      FROM point_note_items i
      WHERE i.point_note_id = p.id
    )
    AND TRIM(COALESCE(p.content, '')) != ''
  `);

  for (const note of legacyNotes) {
    const lines = note.content
      .split(/\r?\n/)
      .map((line) => line.replace(/^[-•]\s*/, "").trim())
      .filter(Boolean);

    for (let index = 0; index < lines.length; index++) {
      await db.runAsync(
        `INSERT INTO point_note_items
          (id, point_note_id, content, position, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        `${note.id}-legacy-${index}`,
        note.id,
        lines[index],
        index,
        note.created_at,
        note.updated_at
      );
    }
  }

  console.log("Sharper Notes database initialized successfully");
}