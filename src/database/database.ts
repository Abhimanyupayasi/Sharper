
import type { SQLiteDatabase } from "expo-sqlite";
import { CREATE_DAILY_NOTES_TABLE } from "./schema";

export async function initializeDatabase(
  db: SQLiteDatabase
) {
  await db.execAsync("PRAGMA foreign_keys = ON;");

  await db.execAsync(CREATE_DAILY_NOTES_TABLE);

  console.log("Database initialized successfully");
}
