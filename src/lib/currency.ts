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

export function formatAmount(amount: number, settings: FormatSettings): string {
  const sign = amount >= 0 ? '+' : '-';
  return `${sign}${formatCurrency(amount, settings)}`;
}

export function formatBalance(amount: number, settings: FormatSettings): string {
  if (amount < 0) {
    return `-${formatCurrency(amount, settings)}`;
  }
  return formatCurrency(amount, settings);
}
