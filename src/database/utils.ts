
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}
