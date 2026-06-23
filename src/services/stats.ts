import { getDb } from '../db/client';
import type { CategoryStats, MonthlySummary } from '../types';

export async function getMonthlySummaries(count: number): Promise<MonthlySummary[]> {
  const db = getDb();
  return db.getAllSync<MonthlySummary>(
    `SELECT
       CAST(strftime('%Y', date) AS INTEGER) AS year,
       CAST(strftime('%m', date) AS INTEGER) AS month,
       SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END)  AS income,
       SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) AS expenses
     FROM transactions
     GROUP BY year, month
     ORDER BY year DESC, month DESC
     LIMIT ?`,
    [count],
  );
}

export async function getCategoryStats(
  year: number,
  month: number,
  type: 'income' | 'expense',
): Promise<CategoryStats[]> {
  const db = getDb();
  const y = String(year);
  const m = String(month).padStart(2, '0');
  return db.getAllSync<CategoryStats>(
    `SELECT
       c.id    AS category_id,
       c.name  AS category_name,
       c.color AS category_color,
       c.icon  AS category_icon,
       c.type,
       SUM(ABS(t.amount)) AS total
     FROM transactions t
     JOIN categories c ON c.id = t.category_id
     WHERE strftime('%Y', t.date) = ?
       AND strftime('%m', t.date) = ?
       AND c.type = ?
     GROUP BY c.id
     ORDER BY total DESC`,
    [y, m, type],
  );
}
