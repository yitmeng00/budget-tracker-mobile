import * as SQLite from 'expo-sqlite';

export function seedIfNeeded(db: SQLite.SQLiteDatabase): void {
  const existing = db.getFirstSync('SELECT id FROM settings WHERE id = 1');
  if (existing) return;

  db.execSync(`
    INSERT INTO settings (id, week_start, currency_country, currency_code, currency_symbol, unit_position, theme)
    VALUES (1, 'Sunday', 'Malaysia', 'MYR', 'RM', 'prefix', 'light');

    INSERT INTO account_groups (name, sort_order) VALUES ('Cash', 1);
    INSERT INTO account_groups (name, sort_order) VALUES ('Bank', 2);
    INSERT INTO account_groups (name, sort_order) VALUES ('Card', 3);
    INSERT INTO account_groups (name, sort_order) VALUES ('E-wallet', 4);

    INSERT INTO accounts (name, type, icon, color, balance, group_id) VALUES ('Cash', 'Cash', 'wallet', '#16a34a', 0, 1);
    INSERT INTO accounts (name, type, icon, color, balance, group_id) VALUES ('Bank Account', 'Bank', 'landmark', '#2563eb', 0, 2);
    INSERT INTO accounts (name, type, icon, color, balance, group_id) VALUES ('Card', 'Card', 'credit-card', '#ef4444', 0, 3);
    INSERT INTO accounts (name, type, icon, color, balance, group_id) VALUES ('Touch n Go', 'E-wallet', 'smartphone', '#06b6d4', 0, 4);

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
    INSERT INTO categories (name, color, icon, type) VALUES ('Bonus', '#f59e0b', 'star', 'income');
    INSERT INTO categories (name, color, icon, type) VALUES ('Others', '#8a96b8', 'more-horizontal', 'income');
  `);
}

export function seedSampleData(db: SQLite.SQLiteDatabase): void {
  // Seed default budget limits if none exist
  const budgetCount = db.getFirstSync<{ n: number }>('SELECT COUNT(*) AS n FROM budget_limits');
  if (budgetCount && budgetCount.n === 0) {
    const catId = (name: string): number | null =>
      db.getFirstSync<{ id: number }>('SELECT id FROM categories WHERE name = ?', [name])?.id ??
      null;

    const defaults: [string, number][] = [
      ['Food & Drinks', 600],
      ['Transport', 200],
      ['Shopping', 400],
      ['Entertainment', 150],
      ['Health', 200],
      ['Bills & Utilities', 500],
    ];

    for (const [name, amount] of defaults) {
      const id = catId(name);
      if (id) {
        db.runSync(
          'INSERT OR IGNORE INTO budget_limits (category_id, default_amount) VALUES (?, ?)',
          [id, amount],
        );
      }
    }
  }

  const hasTransactions = db.getFirstSync<{ n: number }>('SELECT COUNT(*) AS n FROM transactions');
  if (hasTransactions && hasTransactions.n > 0) return;

  const account = db.getFirstSync<{ id: number }>('SELECT id FROM accounts LIMIT 1');
  if (!account) return;

  const catId = (name: string): number => {
    const row = db.getFirstSync<{ id: number }>('SELECT id FROM categories WHERE name = ?', [name]);
    return row?.id ?? 1;
  };

  const rows: [number, number, number, string, string, string][] = [
    // ── May ────────────────────────────────────────────────────────────
    // May 1 — payday: salary + insurance + dinner
    [account.id, catId('Salary'), 5000, 'May salary', '2026-05-01', '09:00:00'],
    [account.id, catId('Bills & Utilities'), -240, 'Insurance premium', '2026-05-01', '10:00:00'],
    [account.id, catId('Food & Drinks'), -75, 'Payday family dinner', '2026-05-01', '19:30:00'],
    // May 3 — coffee + brunch
    [account.id, catId('Food & Drinks'), -8, 'Morning coffee', '2026-05-03', '09:00:00'],
    [account.id, catId('Food & Drinks'), -35, 'Weekend brunch', '2026-05-03', '10:30:00'],
    // May 5 — petrol + car wash
    [account.id, catId('Transport'), -50, 'Petrol', '2026-05-05', '08:00:00'],
    [account.id, catId('Transport'), -15, 'Car wash', '2026-05-05', '09:30:00'],
    // May 8
    [account.id, catId('Shopping'), -220, 'Online shopping haul', '2026-05-08', '14:00:00'],
    // May 10
    [
      account.id,
      catId('Bills & Utilities'),
      -195,
      'Water + internet bill',
      '2026-05-10',
      '10:00:00',
    ],
    // May 12 — pharmacy + lunch
    [account.id, catId('Health'), -60, 'Pharmacy', '2026-05-12', '11:30:00'],
    [account.id, catId('Food & Drinks'), -25, 'Lunch after pharmacy', '2026-05-12', '13:00:00'],
    // May 15 — movie + snacks
    [account.id, catId('Entertainment'), -30, 'Movie tickets', '2026-05-15', '20:00:00'],
    [account.id, catId('Food & Drinks'), -22, 'Popcorn & drinks', '2026-05-15', '20:30:00'],
    // May 18 — freelance payout: payment + self treat + dinner
    [account.id, catId('Freelance'), 1200, 'Design project payment', '2026-05-18', '14:00:00'],
    [account.id, catId('Shopping'), -160, 'Treat myself after project', '2026-05-18', '16:00:00'],
    [account.id, catId('Food & Drinks'), -45, 'Dinner with friends', '2026-05-18', '20:00:00'],
    // May 22 — lunch + grab
    [account.id, catId('Food & Drinks'), -45, 'Team lunch', '2026-05-22', '12:30:00'],
    [account.id, catId('Transport'), -12, 'Grab back to office', '2026-05-22', '14:00:00'],
    // May 25
    [account.id, catId('Transport'), -18, 'Parking', '2026-05-25', '17:00:00'],
    // May 28 — groceries + grab
    [account.id, catId('Shopping'), -85, 'Supermarket run', '2026-05-28', '11:00:00'],
    [account.id, catId('Transport'), -14, 'Grab home', '2026-05-28', '13:00:00'],

    // ── June ───────────────────────────────────────────────────────────
    // Jun 1 — payday: salary + toll + dinner
    [account.id, catId('Salary'), 5000, 'June salary', '2026-06-01', '09:00:00'],
    [account.id, catId('Transport'), -40, 'Toll & parking', '2026-06-01', '18:00:00'],
    [account.id, catId('Food & Drinks'), -65, 'Payday family dinner', '2026-06-01', '19:30:00'],
    // Jun 2 — grab + lunch
    [account.id, catId('Transport'), -8.5, 'Grab to office', '2026-06-02', '08:30:00'],
    [account.id, catId('Food & Drinks'), -12.5, 'Lunch at mamak', '2026-06-02', '13:10:00'],
    // Jun 3 — kopi + touch n go
    [account.id, catId('Food & Drinks'), -5.5, 'Kopi O breakfast', '2026-06-03', '07:30:00'],
    [account.id, catId('Transport'), -50, 'Touch n Go reload', '2026-06-03', '08:30:00'],
    // Jun 5 — grab + groceries
    [account.id, catId('Transport'), -12, 'Grab to mall', '2026-06-05', '10:30:00'],
    [account.id, catId('Shopping'), -89.9, 'Weekly groceries', '2026-06-05', '11:20:00'],
    // Jun 7
    [account.id, catId('Entertainment'), -45, 'Netflix subscription', '2026-06-07', '20:00:00'],
    // Jun 10 — gym + supplements
    [account.id, catId('Health'), -120, 'Gym membership', '2026-06-10', '07:00:00'],
    [account.id, catId('Health'), -89, 'Protein powder', '2026-06-10', '16:00:00'],
    // Jun 12
    [account.id, catId('Bills & Utilities'), -185.5, 'Electricity bill', '2026-06-12', '10:00:00'],
    // Jun 15 — cake + dinner
    [account.id, catId('Food & Drinks'), -45, 'Birthday cake', '2026-06-15', '18:00:00'],
    [account.id, catId('Food & Drinks'), -78.6, 'Dinner with family', '2026-06-15', '19:30:00'],
    // Jun 17
    [account.id, catId('Transport'), -15.8, 'Grab ride to work', '2026-06-17', '08:15:00'],
    // Jun 20 — freelance payout + celebration
    [account.id, catId('Freelance'), 800, 'Side project payment', '2026-06-20', '14:00:00'],
    [account.id, catId('Food & Drinks'), -38, 'Celebration dinner', '2026-06-20', '19:00:00'],
    // Jun 21 — starbucks + book
    [account.id, catId('Food & Drinks'), -22, 'Starbucks', '2026-06-21', '09:45:00'],
    [account.id, catId('Education'), -32, 'Book purchase', '2026-06-21', '15:00:00'],
    // Jun 22 — lunch + shopping
    [account.id, catId('Food & Drinks'), -18, 'Lunch', '2026-06-22', '13:00:00'],
    [account.id, catId('Shopping'), -129, 'Uniqlo', '2026-06-22', '15:00:00'],
    // Jun 23
    [account.id, catId('Investment'), 500, 'Dividend payout', '2026-06-23', '09:00:00'],
    // Jun 25 — birthday: lunch + grab + dinner
    [account.id, catId('Food & Drinks'), -35, 'Lunch at hawker', '2026-06-25', '12:30:00'],
    [account.id, catId('Transport'), -18, 'Grab to restaurant', '2026-06-25', '18:00:00'],
    [account.id, catId('Food & Drinks'), -55, 'Birthday dinner', '2026-06-25', '19:00:00'],
    // Jun 27
    [account.id, catId('Transport'), -30, 'Grab to airport', '2026-06-27', '06:30:00'],
    // Jun 28 — birthday angpao received + spent
    [account.id, catId('Gift'), 200, 'Birthday angpao', '2026-06-28', '12:00:00'],
    [account.id, catId('Shopping'), -89, 'Spent birthday money', '2026-06-28', '15:00:00'],
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
