import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDb } from '../db/client';
import { buildCSV, parseCSV } from '../lib/csv';

export interface ImportResult {
  imported: number;
  skipped: { rowIndex: number; reason: string }[];
}

// ─── Full JSON Backup ─────────────────────────────────────────────────────────

const BACKUP_VERSION = 1;

export async function exportBackupJSON(): Promise<void> {
  const db = getDb();

  const backup = {
    version: BACKUP_VERSION,
    exported_at: new Date().toISOString(),
    settings: db.getFirstSync('SELECT * FROM settings WHERE id = 1'),
    account_groups: db.getAllSync('SELECT * FROM account_groups ORDER BY sort_order'),
    accounts: db.getAllSync('SELECT * FROM accounts'),
    categories: db.getAllSync('SELECT * FROM categories'),
    transactions: db.getAllSync('SELECT * FROM transactions ORDER BY date, time'),
    budget_limits: db.getAllSync('SELECT * FROM budget_limits'),
    budget_overrides: db.getAllSync('SELECT * FROM budget_overrides'),
    recurring_rules: db.getAllSync('SELECT * FROM recurring_rules'),
  };

  const dateStr = new Date().toISOString().slice(0, 10);
  const file = new File(Paths.cache, `ledgr-backup-${dateStr}.json`);
  file.write(JSON.stringify(backup));
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Export Backup',
  });
}

export async function importBackupJSON(): Promise<boolean> {
  const picked = await DocumentPicker.getDocumentAsync({
    type: ['application/json', '*/*'],
    copyToCacheDirectory: true,
  });

  if (picked.canceled || picked.assets.length === 0) return false;

  const content = await new File(picked.assets[0].uri).text();
  const backup = JSON.parse(content);

  if (!backup.version || !backup.settings || !Array.isArray(backup.categories)) {
    throw new Error('Invalid backup file. Please select a valid Ledgr backup.');
  }

  const db = getDb();
  const s = backup.settings as Record<string, string>;

  db.withTransactionSync(() => {
    db.execSync(`
      DELETE FROM transactions;
      DELETE FROM budget_overrides;
      DELETE FROM budget_limits;
      DELETE FROM recurring_rules;
      DELETE FROM accounts;
      DELETE FROM account_groups;
      DELETE FROM categories;
    `);

    db.runSync(
      `INSERT OR REPLACE INTO settings
         (id, week_start, currency_country, currency_code, currency_symbol, unit_position, theme, language)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?)`,
      [
        s.week_start,
        s.currency_country,
        s.currency_code,
        s.currency_symbol,
        s.unit_position,
        s.theme ?? 'system',
        s.language ?? 'en',
      ],
    );

    for (const g of backup.account_groups ?? []) {
      db.runSync('INSERT INTO account_groups (id, name, sort_order) VALUES (?, ?, ?)', [
        g.id,
        g.name,
        g.sort_order,
      ]);
    }

    for (const c of backup.categories ?? []) {
      db.runSync('INSERT INTO categories (id, name, color, icon, type) VALUES (?, ?, ?, ?, ?)', [
        c.id,
        c.name,
        c.color,
        c.icon,
        c.type,
      ]);
    }

    for (const a of backup.accounts ?? []) {
      db.runSync(
        'INSERT INTO accounts (id, name, type, icon, color, balance, group_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [a.id, a.name, a.type, a.icon, a.color, a.balance, a.group_id ?? null],
      );
    }

    for (const t of backup.transactions ?? []) {
      db.runSync(
        `INSERT INTO transactions
           (id, account_id, category_id, amount, note, description, date, time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          t.id,
          t.account_id,
          t.category_id,
          t.amount,
          t.note,
          t.description ?? '',
          t.date,
          t.time ?? '00:00:00',
        ],
      );
    }

    for (const b of backup.budget_limits ?? []) {
      db.runSync(
        'INSERT INTO budget_limits (category_id, default_amount, effective_from_year, effective_from_month) VALUES (?, ?, ?, ?)',
        [
          b.category_id,
          b.default_amount,
          b.effective_from_year ?? null,
          b.effective_from_month ?? null,
        ],
      );
    }

    for (const o of backup.budget_overrides ?? []) {
      db.runSync(
        'INSERT INTO budget_overrides (category_id, amount, year, month) VALUES (?, ?, ?, ?)',
        [o.category_id, o.amount, o.year, o.month],
      );
    }

    for (const r of backup.recurring_rules ?? []) {
      db.runSync(
        `INSERT INTO recurring_rules
           (id, category_id, account_id, amount, note, description, frequency, start_date, last_created_date, active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          r.id,
          r.category_id,
          r.account_id,
          r.amount,
          r.note,
          r.description ?? '',
          r.frequency ?? 'monthly',
          r.start_date,
          r.last_created_date ?? null,
          r.active ?? 1,
        ],
      );
    }
  });

  return true;
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
