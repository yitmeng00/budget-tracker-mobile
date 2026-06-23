import { getDb } from '../db/client';
import type { CategoryStats, MonthlySummary } from '../types';

export async function getYearlySummary(
  year: number,
): Promise<{ income: number; expenses: number }> {
  const db = getDb();
  const row = db.getFirstSync<{ income: number; expenses: number }>(
    `SELECT
       SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END)         AS income,
       SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END)    AS expenses
     FROM transactions
     WHERE strftime('%Y', date) = ?`,
    [String(year)],
  );
  return row ?? { income: 0, expenses: 0 };
}

export async function getMonthsForYear(year: number): Promise<MonthlySummary[]> {
  const db = getDb();
  return db.getAllSync<MonthlySummary>(
    `SELECT
       CAST(strftime('%Y', date) AS INTEGER) AS year,
       CAST(strftime('%m', date) AS INTEGER) AS month,
       SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END)         AS income,
       SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END)    AS expenses
     FROM transactions
     WHERE strftime('%Y', date) = ?
     GROUP BY month
     ORDER BY month ASC`,
    [String(year)],
  );
}

export async function getYearlyCategoryStats(
  year: number,
  type: 'income' | 'expense',
): Promise<CategoryStats[]> {
  const db = getDb();
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
       AND c.type = ?
     GROUP BY c.id
     ORDER BY total DESC`,
    [String(year), type],
  );
}

export async function getMonthsTrend(
  year: number,
  month: number,
  count: number,
): Promise<MonthlySummary[]> {
  const db = getDb();
  const rows = db.getAllSync<MonthlySummary>(
    `SELECT
       CAST(strftime('%Y', date) AS INTEGER) AS year,
       CAST(strftime('%m', date) AS INTEGER) AS month,
       SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END)      AS income,
       SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) AS expenses
     FROM transactions
     WHERE (CAST(strftime('%Y', date) AS INTEGER) * 12 + CAST(strftime('%m', date) AS INTEGER))
           <= (? * 12 + ?)
     GROUP BY year, month
     ORDER BY year DESC, month DESC
     LIMIT ?`,
    [year, month, count],
  );
  return rows.reverse();
}

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
