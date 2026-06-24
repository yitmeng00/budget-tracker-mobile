import { getDb } from '../db/client';
import type { RecurringFrequency, RecurringRule } from '../types';

type RawRule = Omit<RecurringRule, 'active'> & { active: number };

const SELECT_RULES = `
  SELECT
    r.id, r.category_id, r.account_id, r.amount, r.note, r.description,
    r.frequency, r.start_date, r.last_created_date, r.active,
    c.name  AS category_name,
    c.color AS category_color,
    c.type  AS category_type,
    a.name  AS account_name
  FROM recurring_rules r
  JOIN categories c ON c.id = r.category_id
  JOIN accounts   a ON a.id = r.account_id
`;

function mapRule(row: RawRule): RecurringRule {
  return { ...row, active: Boolean(row.active) };
}

export function getRecurringRules(): RecurringRule[] {
  const db = getDb();
  const rows = db.getAllSync<RawRule>(`${SELECT_RULES} ORDER BY r.id ASC`);
  return rows.map(mapRule);
}

export function createRecurringRule(data: {
  category_id: number;
  account_id: number;
  amount: number;
  note: string;
  description: string;
  frequency: RecurringFrequency;
  start_date: string;
}): void {
  const db = getDb();
  db.runSync(
    `INSERT INTO recurring_rules (category_id, account_id, amount, note, description, frequency, start_date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.category_id,
      data.account_id,
      data.amount,
      data.note,
      data.description,
      data.frequency,
      data.start_date,
    ],
  );
}

export function updateRecurringRule(
  id: number,
  data: {
    category_id: number;
    account_id: number;
    amount: number;
    note: string;
    description: string;
    frequency: RecurringFrequency;
    start_date: string;
    active: boolean;
  },
): void {
  const db = getDb();
  db.runSync(
    `UPDATE recurring_rules
     SET category_id=?, account_id=?, amount=?, note=?, description=?, frequency=?, start_date=?, active=?
     WHERE id=?`,
    [
      data.category_id,
      data.account_id,
      data.amount,
      data.note,
      data.description,
      data.frequency,
      data.start_date,
      data.active ? 1 : 0,
      id,
    ],
  );
}

export function deleteRecurringRule(id: number): void {
  const db = getDb();
  db.runSync('DELETE FROM recurring_rules WHERE id = ?', [id]);
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseDate(s: string): Date {
  return new Date(s + 'T00:00:00');
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function addMonthsFrom(origin: Date, months: number): Date {
  const originalDay = origin.getDate();
  const r = new Date(origin.getFullYear(), origin.getMonth() + months, 1);
  const daysInMonth = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate();
  r.setDate(Math.min(originalDay, daysInMonth));
  return r;
}

function addYearsFrom(origin: Date, years: number): Date {
  const r = new Date(origin);
  r.setFullYear(r.getFullYear() + years);
  return r;
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

// Returns all dates that are due between (lastCreated, today] for a given rule
function computeDueDates(
  frequency: RecurringFrequency,
  startDate: Date,
  lastCreatedDate: Date | null,
  today: Date,
): Date[] {
  const results: Date[] = [];

  function push(d: Date) {
    if (d < startDate) return;
    if (lastCreatedDate && d <= lastCreatedDate) return;
    if (d > today) return;
    results.push(new Date(d));
  }

  if (frequency === 'daily') {
    let d = new Date(startDate);
    while (d <= today) {
      push(d);
      d = addDays(d, 1);
    }
  } else if (frequency === 'weekly') {
    let d = new Date(startDate);
    while (d <= today) {
      push(d);
      d = addDays(d, 7);
    }
  } else if (frequency === 'biweekly') {
    let d = new Date(startDate);
    while (d <= today) {
      push(d);
      d = addDays(d, 14);
    }
  } else if (frequency === 'monthly') {
    let offset = 0;
    let d = new Date(startDate);
    while (d <= today) {
      push(d);
      offset++;
      d = addMonthsFrom(startDate, offset);
    }
  } else if (frequency === 'end_of_month') {
    let d = endOfMonth(startDate);
    while (d <= today) {
      push(d);
      d = endOfMonth(new Date(d.getFullYear(), d.getMonth() + 1, 1));
    }
  } else if (frequency === 'bimonthly') {
    let offset = 0;
    let d = new Date(startDate);
    while (d <= today) {
      push(d);
      offset += 2;
      d = addMonthsFrom(startDate, offset);
    }
  } else if (frequency === 'annually') {
    let offset = 0;
    let d = new Date(startDate);
    while (d <= today) {
      push(d);
      offset++;
      d = addYearsFrom(startDate, offset);
    }
  }

  return results;
}

// ─── Process on app open ──────────────────────────────────────────────────────

export function processRecurringTransactions(): number {
  const db = getDb();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rules = db.getAllSync<RawRule>(`${SELECT_RULES} WHERE r.active = 1`);
  let created = 0;

  for (const rule of rules) {
    const startDate = parseDate(rule.start_date);
    const lastCreated = rule.last_created_date ? parseDate(rule.last_created_date) : null;
    const dueDates = computeDueDates(
      rule.frequency as RecurringFrequency,
      startDate,
      lastCreated,
      today,
    );

    for (const dueDate of dueDates) {
      const dateStr = toDateStr(dueDate);
      db.withTransactionSync(() => {
        db.runSync(
          `INSERT INTO transactions (account_id, category_id, amount, note, description, date, time)
           VALUES (?, ?, ?, ?, ?, ?, '00:00:00')`,
          [rule.account_id, rule.category_id, rule.amount, rule.note, rule.description, dateStr],
        );
        db.runSync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [
          rule.amount,
          rule.account_id,
        ]);
      });
      created++;
    }

    if (dueDates.length > 0) {
      const latestDate = toDateStr(dueDates[dueDates.length - 1]);
      db.runSync('UPDATE recurring_rules SET last_created_date=? WHERE id=?', [
        latestDate,
        rule.id,
      ]);
    }
  }

  return created;
}
