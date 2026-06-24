const HEADERS = ['Date', 'Type', 'Category', 'Account', 'Amount', 'Note'] as const;

function escapeField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildCSV(
  rows: {
    date: string;
    type: string;
    category: string;
    account: string;
    amount: number;
    note: string;
  }[],
): string {
  const lines = [HEADERS.join(',')];
  for (const row of rows) {
    const absAmount = Math.abs(row.amount).toFixed(2);
    lines.push(
      [
        escapeField(row.date),
        escapeField(row.type),
        escapeField(row.category),
        escapeField(row.account),
        absAmount,
        escapeField(row.note),
      ].join(','),
    );
  }
  return lines.join('\n');
}

export interface ParsedRow {
  rowIndex: number;
  date: string;
  type: 'income' | 'expense';
  category: string;
  account: string;
  amount: number;
  note: string;
}

export interface ParseError {
  rowIndex: number;
  reason: string;
}

function parseFields(line: string): string[] {
  const fields: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      let field = '';
      i++;
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') {
          field += '"';
          i += 2;
        } else if (line[i] === '"') {
          i++;
          break;
        } else {
          field += line[i++];
        }
      }
      fields.push(field);
      if (line[i] === ',') i++;
    } else {
      const end = line.indexOf(',', i);
      if (end === -1) {
        fields.push(line.slice(i));
        break;
      } else {
        fields.push(line.slice(i, end));
        i = end + 1;
      }
    }
  }
  return fields;
}

export function parseCSV(content: string): { rows: ParsedRow[]; errors: ParseError[] } {
  const lines = content
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((l) => l.trim());
  const rows: ParsedRow[] = [];
  const errors: ParseError[] = [];

  if (lines.length === 0) {
    return { rows, errors: [{ rowIndex: 0, reason: 'File is empty' }] };
  }

  // Validate headers (case-insensitive)
  const headerFields = parseFields(lines[0]).map((h) => h.trim().toLowerCase());
  const expected = HEADERS.map((h) => h.toLowerCase());
  const missing = expected.filter((h) => !headerFields.includes(h));
  if (missing.length > 0) {
    return {
      rows,
      errors: [{ rowIndex: 1, reason: `Missing columns: ${missing.join(', ')}` }],
    };
  }

  const idx = (name: string) => headerFields.indexOf(name.toLowerCase());

  for (let i = 1; i < lines.length; i++) {
    const rowIndex = i + 1; // 1-based for user display
    const fields = parseFields(lines[i]);

    const date = fields[idx('date')]?.trim() ?? '';
    const typeRaw = fields[idx('type')]?.trim().toLowerCase() ?? '';
    const category = fields[idx('category')]?.trim() ?? '';
    const account = fields[idx('account')]?.trim() ?? '';
    const amountRaw = fields[idx('amount')]?.trim() ?? '';
    const note = fields[idx('note')]?.trim() ?? '';

    if (!date || !typeRaw || !category || !account || !amountRaw) {
      errors.push({ rowIndex, reason: 'Missing required field(s)' });
      continue;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      errors.push({ rowIndex, reason: `Invalid date "${date}" — use YYYY-MM-DD` });
      continue;
    }

    if (typeRaw !== 'income' && typeRaw !== 'expense') {
      errors.push({ rowIndex, reason: `Invalid type "${typeRaw}" — must be income or expense` });
      continue;
    }

    const amount = parseFloat(amountRaw);
    if (isNaN(amount) || amount <= 0) {
      errors.push({
        rowIndex,
        reason: `Invalid amount "${amountRaw}" — must be a positive number`,
      });
      continue;
    }

    rows.push({ rowIndex, date, type: typeRaw, category, account, amount, note });
  }

  return { rows, errors };
}
