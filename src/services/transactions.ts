import { getDb } from '../db/client';
import type { Transaction } from '../types';

const SELECT_TRANSACTIONS = `
  SELECT
    t.id, t.account_id, t.category_id, t.amount, t.note, t.description, t.date, t.time,
    c.name  AS category_name,
    c.color AS category_color,
    c.icon  AS category_icon,
    c.type  AS category_type,
    a.name  AS account_name,
    a.color AS account_color,
    a.icon  AS account_icon
  FROM transactions t
  JOIN categories c ON c.id = t.category_id
  JOIN accounts   a ON a.id = t.account_id
`;

type RawTransaction = Transaction & {
  category_name: string;
  category_color: string;
  category_icon: string;
  category_type: string;
  account_name: string;
  account_color: string;
  account_icon: string;
};

function mapTransaction(row: RawTransaction): Transaction {
  return {
    id: row.id,
    account_id: row.account_id,
    category_id: row.category_id,
    amount: row.amount,
    note: row.note,
    description: row.description,
    date: row.date,
    time: row.time,
    category: {
      id: row.category_id,
      name: row.category_name,
      color: row.category_color,
      icon: row.category_icon,
      type: row.category_type as 'income' | 'expense',
    },
    account: {
      id: row.account_id,
      name: row.account_name,
      color: row.account_color,
      icon: row.account_icon,
      type: '',
      balance: 0,
      group_id: null,
    },
  };
}

export async function getTransactions(year: number, month: number): Promise<Transaction[]> {
  const db = getDb();
  const y = String(year);
  const m = String(month).padStart(2, '0');
  const rows = db.getAllSync<RawTransaction>(
    `${SELECT_TRANSACTIONS}
     WHERE strftime('%Y', t.date) = ? AND strftime('%m', t.date) = ?
     ORDER BY t.date DESC, t.time DESC`,
    [y, m],
  );
  return rows.map(mapTransaction);
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const db = getDb();
  const rows = db.getAllSync<RawTransaction>(
    `${SELECT_TRANSACTIONS} ORDER BY t.date DESC, t.time DESC`,
  );
  return rows.map(mapTransaction);
}

export async function createTransaction(
  data: Omit<Transaction, 'id' | 'category' | 'account'>,
): Promise<number> {
  const db = getDb();
  let newId = 0;
  db.withTransactionSync(() => {
    const result = db.runSync(
      'INSERT INTO transactions (account_id, category_id, amount, note, description, date, time) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        data.account_id,
        data.category_id,
        data.amount,
        data.note,
        data.description,
        data.date,
        data.time,
      ],
    );
    newId = result.lastInsertRowId;
    db.runSync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [
      data.amount,
      data.account_id,
    ]);
  });
  return newId;
}

export async function updateTransaction(
  id: number,
  data: Omit<Transaction, 'id' | 'category' | 'account'>,
): Promise<void> {
  const db = getDb();
  const old = db.getFirstSync<{ account_id: number; amount: number }>(
    'SELECT account_id, amount FROM transactions WHERE id = ?',
    [id],
  );
  if (!old) return;

  db.withTransactionSync(() => {
    // Reverse old amount from old account
    db.runSync('UPDATE accounts SET balance = balance - ? WHERE id = ?', [
      old.amount,
      old.account_id,
    ]);
    // Apply new amount to new account
    db.runSync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [
      data.amount,
      data.account_id,
    ]);
    db.runSync(
      'UPDATE transactions SET account_id=?, category_id=?, amount=?, note=?, description=?, date=?, time=? WHERE id=?',
      [
        data.account_id,
        data.category_id,
        data.amount,
        data.note,
        data.description,
        data.date,
        data.time,
        id,
      ],
    );
  });
}

export async function deleteTransaction(id: number): Promise<void> {
  const db = getDb();
  const row = db.getFirstSync<{ account_id: number; amount: number }>(
    'SELECT account_id, amount FROM transactions WHERE id = ?',
    [id],
  );
  if (!row) return;

  db.withTransactionSync(() => {
    db.runSync('UPDATE accounts SET balance = balance - ? WHERE id = ?', [
      row.amount,
      row.account_id,
    ]);
    db.runSync('DELETE FROM transactions WHERE id = ?', [id]);
  });
}
