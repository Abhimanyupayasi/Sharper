import type { SQLiteDatabase } from "expo-sqlite";

export type PointNoteItem = {
  id: string;
  point_note_id: string;
  content: string;
  position: number;
  created_at: string;
  updated_at: string;
};

const createId = () =>
  `point-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export async function getPointNoteItems(
  db: SQLiteDatabase,
  pointNoteId: string
): Promise<PointNoteItem[]> {
  return db.getAllAsync<PointNoteItem>(
    `SELECT * FROM point_note_items
     WHERE point_note_id = ?
     ORDER BY position ASC, created_at ASC`,
    pointNoteId
  );
}

export async function replacePointNoteItems(
  db: SQLiteDatabase,
  pointNoteId: string,
  values: string[]
): Promise<void> {
  const items = values.map((value) => value.trim()).filter(Boolean);
  const now = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `DELETE FROM point_note_items WHERE point_note_id = ?`,
      pointNoteId
    );

    for (let index = 0; index < items.length; index++) {
      await db.runAsync(
        `INSERT INTO point_note_items
          (id, point_note_id, content, position, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        createId(),
        pointNoteId,
        items[index],
        index,
        now,
        now
      );
    }

    // Keep legacy content synchronized for older code paths.
    await db.runAsync(
      `UPDATE point_notes
       SET content = ?, updated_at = ?
       WHERE id = ?`,
      items.join("\n"),
      now,
      pointNoteId
    );
  });
}

export async function deletePointNoteItems(
  db: SQLiteDatabase,
  pointNoteId: string
): Promise<void> {
  await db.runAsync(
    `DELETE FROM point_note_items WHERE point_note_id = ?`,
    pointNoteId
  );
}