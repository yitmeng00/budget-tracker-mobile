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

export async function deleteCategory(id: number): Promise<void> {
  const db = getDb();
  db.runSync('DELETE FROM categories WHERE id = ?', [id]);
}
