import { getDb } from '../db/client';
import type { UserSettings } from '../types';

export async function getSettings(): Promise<UserSettings> {
  const db = getDb();
  const row = db.getFirstSync<UserSettings>('SELECT * FROM settings WHERE id = 1');
  if (!row) throw new Error('Settings not initialized');
  return row;
}

export async function updateSettings(patch: Partial<UserSettings>): Promise<void> {
  const db = getDb();
  const keys = Object.keys(patch) as (keyof UserSettings)[];
  if (keys.length === 0) return;
  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  const values = keys.map((k) => patch[k]);
  db.runSync(`UPDATE settings SET ${setClause} WHERE id = 1`, values as SQLiteBindValue[]);
}

type SQLiteBindValue = string | number | null | boolean;
