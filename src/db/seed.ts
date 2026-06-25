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
