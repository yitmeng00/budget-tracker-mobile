import type { UserSettings } from '../types';

type FormatSettings = Pick<UserSettings, 'currency_symbol' | 'unit_position'>;

export function formatCurrency(amount: number, settings: FormatSettings): string {
  const abs = Math.abs(amount);
  const formatted = abs.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  if (settings.unit_position === 'prefix') {
    return `${settings.currency_symbol}${formatted}`;
  }
  return `${formatted} ${settings.currency_symbol}`;
}
