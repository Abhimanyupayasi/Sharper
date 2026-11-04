
import type { SQLiteDatabase } from "expo-sqlite";

export type Task = {
  id: string;
  title: string;
  description: string;
  completed: number;
  priority: "High" | "Medium" | "Low";
  date: string;
  reminder_at: string | null;
  notification_id: string | null;
  created_at: string;
};

export async function initializeTodoTable(db: SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS todo_tasks (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      completed INTEGER NOT NULL DEFAULT 0,
      priority TEXT NOT NULL DEFAULT 'Medium',
      date TEXT NOT NULL,
      reminder_at TEXT,
      notification_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_todo_tasks_date
    ON todo_tasks(date);
  `);
}

export async function getTasks(db: SQLiteDatabase) {
  return db.getAllAsync<Task>(
    "SELECT * FROM todo_tasks ORDER BY date ASC, created_at DESC"
  );
}

export async function createTask(
  db: SQLiteDatabase,
  task: Task
) {
  await db.runAsync(
    `INSERT INTO todo_tasks
    (id, title, description, completed, priority, date,
     reminder_at, notification_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    task.id,
    task.title,
    task.description,
    task.completed,
    task.priority,
    task.date,
    task.reminder_at,
    task.notification_id,
    task.created_at
  );
}

export async function updateTask(
  db: SQLiteDatabase,
  id: string,
  values: Partial<Task>
) {
  const fields = Object.keys(values) as (keyof Task)[];

  if (!fields.length) return;

  const assignments = fields.map((field) => `${field} = ?`).join(", ");
  const params = fields.map((field) => values[field]);

  await db.runAsync(
    `UPDATE todo_tasks SET ${assignments} WHERE id = ?`,
    ...params,
    id
  );
}

export async function removeTask(db: SQLiteDatabase, id: string) {
  await db.runAsync("DELETE FROM todo_tasks WHERE id = ?", id);
}
