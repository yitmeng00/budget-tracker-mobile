import * as SQLite from 'expo-sqlite';

export function seedIfNeeded(db: SQLite.SQLiteDatabase): void {
  const existing = db.getFirstSync('SELECT id FROM settings WHERE id = 1');
  if (existing) return;

  db.execSync(`
    INSERT INTO settings (id, week_start, currency_country, currency_code, currency_symbol, unit_position)
    VALUES (1, 'Sunday', 'Malaysia', 'MYR', 'RM', 'prefix');

    INSERT INTO account_groups (name, sort_order) VALUES ('Cash', 1);
    INSERT INTO account_groups (name, sort_order) VALUES ('Bank', 2);
    INSERT INTO account_groups (name, sort_order) VALUES ('Card', 3);
    INSERT INTO account_groups (name, sort_order) VALUES ('E-wallet', 4);

    INSERT INTO categories (name, color, icon, type) VALUES ('Food & Drinks', '#f97316', 'utensils', 'expense');
    INSERT INTO categories (name, color, icon, type) VALUES ('Shopping', '#ec4899', 'shopping-cart', 'expense');
    INSERT INTO categories (name, color, icon, type) VALUES ('Transport', '#06b6d4', 'car', 'expense');
    INSERT INTO categories (name, color, icon, type) VALUES ('Entertainment', '#7b5cf0', 'gamepad2', 'expense');
    INSERT INTO categories (name, color, icon, type) VALUES ('Health', '#ef4444', 'heart', 'expense');
    INSERT INTO categories (name, color, icon, type) VALUES ('Bills & Utilities', '#f59e0b', 'zap', 'expense');
    INSERT INTO categories (name, color, icon, type) VALUES ('Education', '#2563eb', 'graduation-cap', 'expense');
    INSERT INTO categories (name, color, icon, type) VALUES ('Travel', '#16a34a', 'plane', 'expense');
    INSERT INTO categories (name, color, icon, type) VALUES ('Others', '#8a96b8', 'more-horizontal', 'expense');

    INSERT INTO categories (name, color, icon, type) VALUES ('Salary', '#16a34a', 'briefcase', 'income');
    INSERT INTO categories (name, color, icon, type) VALUES ('Freelance', '#2563eb', 'dollar-sign', 'income');
    INSERT INTO categories (name, color, icon, type) VALUES ('Investment', '#7b5cf0', 'trending-up', 'income');
    INSERT INTO categories (name, color, icon, type) VALUES ('Gift', '#f97316', 'gift', 'income');
    INSERT INTO categories (name, color, icon, type) VALUES ('Others', '#8a96b8', 'more-horizontal', 'income');

    INSERT INTO accounts (name, type, icon, color, balance, group_id)
    VALUES ('Cash', 'Cash', 'wallet', '#16a34a', 0, 1);
  `);
}

export function seedSampleData(db: SQLite.SQLiteDatabase): void {
  const hasTransactions = db.getFirstSync<{ n: number }>('SELECT COUNT(*) AS n FROM transactions');
  if (hasTransactions && hasTransactions.n > 0) return;

  const account = db.getFirstSync<{ id: number }>('SELECT id FROM accounts LIMIT 1');
  if (!account) return;

  const catId = (name: string): number => {
    const row = db.getFirstSync<{ id: number }>('SELECT id FROM categories WHERE name = ?', [name]);
    return row?.id ?? 1;
  };

  const rows: [number, number, number, string, string, string][] = [
    [account.id, catId('Salary'), 5000, 'June salary', '2026-06-01', '09:00:00'],
    [account.id, catId('Food & Drinks'), -12.5, 'Lunch at mamak', '2026-06-02', '13:10:00'],
    [account.id, catId('Transport'), -50, 'Touch n Go reload', '2026-06-03', '08:30:00'],
    [account.id, catId('Shopping'), -89.9, 'Weekly groceries', '2026-06-05', '11:20:00'],
    [account.id, catId('Entertainment'), -45, 'Netflix subscription', '2026-06-07', '20:00:00'],
    [account.id, catId('Health'), -120, 'Gym membership', '2026-06-10', '07:00:00'],
    [account.id, catId('Bills & Utilities'), -185.5, 'Electricity bill', '2026-06-12', '10:00:00'],
    [account.id, catId('Food & Drinks'), -78.6, 'Dinner with family', '2026-06-15', '19:30:00'],
    [account.id, catId('Transport'), -15.8, 'Grab ride to work', '2026-06-17', '08:15:00'],
    [account.id, catId('Freelance'), 800, 'Side project payment', '2026-06-20', '14:00:00'],
    [account.id, catId('Food & Drinks'), -22, 'Starbucks', '2026-06-21', '09:45:00'],
    [account.id, catId('Shopping'), -129, 'Uniqlo', '2026-06-22', '15:00:00'],
  ];

  let balance = 0;
  db.withTransactionSync(() => {
    for (const [acct, cat, amount, note, date, time] of rows) {
      db.runSync(
        'INSERT INTO transactions (account_id, category_id, amount, note, description, date, time) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [acct, cat, amount, note, '', date, time],
      );
      balance += amount;
    }
    db.runSync('UPDATE accounts SET balance = ? WHERE id = ?', [balance, account.id]);
  });
}
