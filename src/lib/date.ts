import { DAY_NAMES, MONTH_SHORT } from './constants';

export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayISO(): string {
  return formatDateISO(new Date());
}

export function formatDateHeader(dateStr: string): string {
  const today = todayISO();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = formatDateISO(yesterdayDate);

  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';

  const date = new Date(dateStr + 'T00:00:00');
  const dayName = DAY_NAMES[date.getDay()];
  const monthName = MONTH_SHORT[date.getMonth()];
  return `${dayName}, ${monthName} ${date.getDate()}`;
}

export function currentTimeISO(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}:00`;
}
