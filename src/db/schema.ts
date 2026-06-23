import * as SQLite from 'expo-sqlite';

export function initSchema(db: SQLite.SQLiteDatabase): void {
  db.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      week_start TEXT NOT NULL DEFAULT 'Sunday',
      currency_country TEXT NOT NULL DEFAULT 'Malaysia',
      currency_code TEXT NOT NULL DEFAULT 'MYR',
      currency_symbol TEXT NOT NULL DEFAULT 'RM',
      unit_position TEXT NOT NULL DEFAULT 'prefix'
    );

    CREATE TABLE IF NOT EXISTS account_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT 'wallet',
      color TEXT NOT NULL DEFAULT '#2563eb',
      balance REAL NOT NULL DEFAULT 0,
      group_id INTEGER REFERENCES account_groups(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      icon TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL REFERENCES accounts(id),
      category_id INTEGER NOT NULL REFERENCES categories(id),
      amount REAL NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      date TEXT NOT NULL,
      time TEXT NOT NULL DEFAULT '00:00:00'
    );

    CREATE TABLE IF NOT EXISTS budget_limits (
      category_id INTEGER PRIMARY KEY REFERENCES categories(id) ON DELETE CASCADE,
      default_amount REAL
    );

    CREATE TABLE IF NOT EXISTS budget_overrides (
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      PRIMARY KEY (category_id, year, month)
    );
  `);

  // Migration: add description column if it doesn't exist yet
  try {
    db.execSync(`ALTER TABLE transactions ADD COLUMN description TEXT NOT NULL DEFAULT ''`);
  } catch {
    // column already exists — safe to ignore
  }
}
