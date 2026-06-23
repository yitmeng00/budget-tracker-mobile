import { getDb } from '../db/client';
import type { Category, CategoryType } from '../types';

export async function getCategories(): Promise<Category[]> {
  const db = getDb();
  return db.getAllSync<Category>('SELECT * FROM categories ORDER BY type, name');
}

export async function getCategoriesByType(type: CategoryType): Promise<Category[]> {
  const db = getDb();
  return db.getAllSync<Category>('SELECT * FROM categories WHERE type = ? ORDER BY name', [type]);
}

export async function createCategory(data: Omit<Category, 'id'>): Promise<number> {
  const db = getDb();
  const result = db.runSync(
    'INSERT INTO categories (name, color, icon, type) VALUES (?, ?, ?, ?)',
    [data.name, data.color, data.icon, data.type],
  );
  return result.lastInsertRowId;
}

export async function updateCategory(
  id: number,
  data: Partial<Omit<Category, 'id'>>,
): Promise<void> {
  const db = getDb();
  const keys = Object.keys(data);
  if (keys.length === 0) return;
  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  const values = [...Object.values(data), id];
  db.runSync(`UPDATE categories SET ${setClause} WHERE id = ?`, values);
}

export async function getCategoryTransactionCount(id: number): Promise<number> {
  const db = getDb();
  const row = db.getFirstSync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM transactions WHERE category_id = ?',
    [id],
  );
  return row?.n ?? 0;
}

export async function reassignAndDeleteCategory(fromId: number, toId: number): Promise<void> {
  const db = getDb();
  db.withTransactionSync(() => {
    db.runSync('UPDATE transactions SET category_id = ? WHERE category_id = ?', [toId, fromId]);
    db.runSync('DELETE FROM categories WHERE id = ?', [fromId]);
  });
}

export async function deleteCategory(id: number): Promise<void> {
  const db = getDb();
  db.runSync('DELETE FROM categories WHERE id = ?', [id]);
}
