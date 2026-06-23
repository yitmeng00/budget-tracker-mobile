import { getDb } from '../db/client';
import type { Account, AccountGroup } from '../types';

export async function getNetWorth(): Promise<number> {
  const db = getDb();
  const row = db.getFirstSync<{ total: number }>(
    'SELECT COALESCE(SUM(balance), 0) AS total FROM accounts',
  );
  return row?.total ?? 0;
}

export async function getAccountGroups(): Promise<AccountGroup[]> {
  const db = getDb();
  return db.getAllSync<AccountGroup>('SELECT * FROM account_groups ORDER BY sort_order');
}

export async function createAccountGroup(name: string): Promise<number> {
  const db = getDb();
  const row = db.getFirstSync<{ n: number }>(
    'SELECT COALESCE(MAX(sort_order), 0) AS n FROM account_groups',
  );
  const result = db.runSync('INSERT INTO account_groups (name, sort_order) VALUES (?, ?)', [
    name,
    (row?.n ?? 0) + 1,
  ]);
  return result.lastInsertRowId;
}

export async function updateAccountGroup(id: number, name: string): Promise<void> {
  const db = getDb();
  db.runSync('UPDATE account_groups SET name = ? WHERE id = ?', [name, id]);
}

export async function deleteAccountGroup(id: number): Promise<void> {
  const db = getDb();
  const row = db.getFirstSync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM accounts WHERE group_id = ?',
    [id],
  );
  if (row && row.n > 0)
    throw new Error(
      'This group has accounts. Remove all accounts first before deleting the group.',
    );
  db.runSync('DELETE FROM account_groups WHERE id = ?', [id]);
}

export async function getAccounts(): Promise<Account[]> {
  const db = getDb();
  return db.getAllSync<Account>('SELECT * FROM accounts ORDER BY group_id, name');
}

export async function createAccount(data: Omit<Account, 'id'>): Promise<number> {
  const db = getDb();
  const result = db.runSync(
    'INSERT INTO accounts (name, type, icon, color, balance, group_id) VALUES (?, ?, ?, ?, ?, ?)',
    [data.name, data.type, data.icon, data.color, data.balance, data.group_id],
  );
  return result.lastInsertRowId;
}

export async function updateAccount(id: number, data: Partial<Omit<Account, 'id'>>): Promise<void> {
  const db = getDb();
  const keys = Object.keys(data);
  if (keys.length === 0) return;
  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  const values = [...Object.values(data), id];
  db.runSync(`UPDATE accounts SET ${setClause} WHERE id = ?`, values);
}

export async function deleteAccount(id: number): Promise<void> {
  const db = getDb();
  const row = db.getFirstSync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM transactions WHERE account_id = ?',
    [id],
  );
  if (row && row.n > 0) throw new Error('This account has transactions and cannot be deleted.');
  db.runSync('DELETE FROM accounts WHERE id = ?', [id]);
}
