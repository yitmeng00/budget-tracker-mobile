import * as SQLite from 'expo-sqlite';
import { initSchema } from './schema';
import { seedIfNeeded, seedSampleData } from './seed';

let _db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!_db) {
    _db = SQLite.openDatabaseSync('budget.db');
    initSchema(_db);
    seedIfNeeded(_db);
    seedSampleData(_db);
  }
  return _db;
}
