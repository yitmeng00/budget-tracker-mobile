import { getDb } from '../db/client';
import type { BudgetEntry } from '../types';

export async function getBudgets(year: number, month: number): Promise<BudgetEntry[]> {
  const db = getDb();
  const y = String(year);
  const m = String(month).padStart(2, '0');
  return db.getAllSync<BudgetEntry>(
    `SELECT
       c.id    AS category_id,
       c.name  AS category_name,
       c.color AS category_color,
       c.icon  AS category_icon,
       bl.default_amount,
       bo.amount AS override_amount,
       COALESCE(bo.amount, bl.default_amount) AS effective_amount,
       COALESCE(SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END), 0) AS spent
     FROM categories c
     LEFT JOIN budget_limits bl ON bl.category_id = c.id
     LEFT JOIN budget_overrides bo
       ON bo.category_id = c.id AND bo.year = ? AND bo.month = ?
     LEFT JOIN transactions t
       ON t.category_id = c.id
       AND strftime('%Y', t.date) = ?
       AND strftime('%m', t.date) = ?
     WHERE c.type = 'expense'
     GROUP BY c.id
     ORDER BY c.name`,
    [year, month, y, m],
  );
}

export async function setBudgetDefault(categoryId: number, amount: number | null): Promise<void> {
  const db = getDb();
  if (amount === null) {
    db.runSync('DELETE FROM budget_limits WHERE category_id = ?', [categoryId]);
  } else {
    db.runSync(
      `INSERT INTO budget_limits (category_id, default_amount) VALUES (?, ?)
       ON CONFLICT(category_id) DO UPDATE SET default_amount = excluded.default_amount`,
      [categoryId, amount],
    );
  }
}

export async function setBudgetOverride(
  categoryId: number,
  year: number,
  month: number,
  amount: number | null,
): Promise<void> {
  const db = getDb();
  if (amount === null) {
    db.runSync('DELETE FROM budget_overrides WHERE category_id = ? AND year = ? AND month = ?', [
      categoryId,
      year,
      month,
    ]);
  } else {
    db.runSync(
      `INSERT INTO budget_overrides (category_id, year, month, amount) VALUES (?, ?, ?, ?)
       ON CONFLICT(category_id, year, month) DO UPDATE SET amount = excluded.amount`,
      [categoryId, year, month, amount],
    );
  }
}
