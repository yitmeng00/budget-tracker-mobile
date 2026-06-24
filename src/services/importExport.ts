import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDb } from '../db/client';
import { buildCSV, parseCSV } from '../lib/csv';

export interface ImportResult {
  imported: number;
  skipped: { rowIndex: number; reason: string }[];
}

// ─── Export ──────────────────────────────────────────────────────────────────

export type ExportScope =
  | { type: 'all' }
  | { type: 'year'; year: number }
  | { type: 'month'; year: number; month: number };

export async function exportTransactionsCSV(scope: ExportScope = { type: 'all' }): Promise<void> {
  const db = getDb();

  let where = '';
  const params: string[] = [];
  if (scope.type === 'year') {
    where = `WHERE strftime('%Y', t.date) = ?`;
    params.push(String(scope.year));
  } else if (scope.type === 'month') {
    where = `WHERE strftime('%Y', t.date) = ? AND strftime('%m', t.date) = ?`;
    params.push(String(scope.year), String(scope.month).padStart(2, '0'));
  }

  const rows = db.getAllSync<{
    date: string;
    amount: number;
    category_name: string;
    account_name: string;
    note: string;
  }>(
    `SELECT t.date, t.amount, t.note,
            c.name AS category_name,
            a.name AS account_name
     FROM transactions t
     JOIN categories c ON c.id = t.category_id
     JOIN accounts   a ON a.id = t.account_id
     ${where}
     ORDER BY t.date DESC, t.time DESC`,
    params,
  );

  const csv = buildCSV(
    rows.map((r) => ({
      date: r.date,
      type: r.amount >= 0 ? 'income' : 'expense',
      category: r.category_name,
      account: r.account_name,
      amount: r.amount,
      note: r.note,
    })),
  );

  const suffix =
    scope.type === 'month'
      ? `${scope.year}-${String(scope.month).padStart(2, '0')}`
      : scope.type === 'year'
        ? String(scope.year)
        : 'all';
  const fileName = `ledgr-${suffix}.csv`;
  const file = new File(Paths.cache, fileName);
  file.write(csv);
  await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: 'Export Transactions' });
}

// ─── Import ──────────────────────────────────────────────────────────────────

export async function importTransactionsCSV(): Promise<ImportResult | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['text/csv', 'text/comma-separated-values', 'public.comma-separated-values-text', '*/*'],
    copyToCacheDirectory: true,
  });

  if (result.canceled || result.assets.length === 0) return null;

  const asset = result.assets[0];
  const content = await new File(asset.uri).text();

  const { rows, errors } = parseCSV(content);
  const skipped: ImportResult['skipped'] = [...errors];

  if (rows.length === 0) {
    return { imported: 0, skipped };
  }

  const db = getDb();

  // Load existing categories and accounts into maps for fast lookup
  const categories = db.getAllSync<{ id: number; name: string; type: string }>(
    'SELECT id, name, type FROM categories',
  );
  const accounts = db.getAllSync<{ id: number; name: string }>('SELECT id, name FROM accounts');

  const catMap = new Map(categories.map((c) => [c.name.toLowerCase(), c]));
  const acctMap = new Map(accounts.map((a) => [a.name.toLowerCase(), a]));

  let imported = 0;

  for (const row of rows) {
    const cat = catMap.get(row.category.toLowerCase());
    if (!cat) {
      skipped.push({ rowIndex: row.rowIndex, reason: `Category "${row.category}" not found` });
      continue;
    }

    const acct = acctMap.get(row.account.toLowerCase());
    if (!acct) {
      skipped.push({ rowIndex: row.rowIndex, reason: `Account "${row.account}" not found` });
      continue;
    }

    // Type must match the category type
    if (cat.type !== row.type) {
      skipped.push({
        rowIndex: row.rowIndex,
        reason: `Category "${row.category}" is ${cat.type} but row type is ${row.type}`,
      });
      continue;
    }

    const dbAmount = row.type === 'expense' ? -row.amount : row.amount;

    // Duplicate check: same date + category + account + amount + note
    const existing = db.getFirstSync(
      `SELECT id FROM transactions
       WHERE date = ? AND category_id = ? AND account_id = ? AND amount = ? AND note = ?`,
      [row.date, cat.id, acct.id, dbAmount, row.note],
    );
    if (existing) {
      skipped.push({ rowIndex: row.rowIndex, reason: `Duplicate — already exists` });
      continue;
    }

    db.withTransactionSync(() => {
      db.runSync(
        `INSERT INTO transactions (account_id, category_id, amount, note, description, date, time)
         VALUES (?, ?, ?, ?, '', ?, '00:00:00')`,
        [acct.id, cat.id, dbAmount, row.note, row.date],
      );
      db.runSync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [dbAmount, acct.id]);
    });

    imported++;
  }

  return { imported, skipped };
}
