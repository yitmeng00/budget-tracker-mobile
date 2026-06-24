export type ColorPalette = {
  accent: string;
  accentSoft: string;
  bg: string;
  surface: string;
  border: string;
  textPrimary: string;
  textMuted: string;
  textSubtle: string;
  textFaint: string;
  income: string;
  expense: string;
};

export const lightColors: ColorPalette = {
  accent: '#2563eb',
  accentSoft: '#eff6ff',
  bg: '#f0f4ff',
  surface: '#ffffff',
  border: '#e0e7f7',
  textPrimary: '#0f1c3f',
  textMuted: '#6b7a9e',
  textSubtle: '#8a96b8',
  textFaint: '#aab4d0',
  income: '#16a34a',
  expense: '#ef4444',
};

export const darkColors: ColorPalette = {
  accent: '#3b82f6',
  accentSoft: '#1e3252',
  bg: '#0f1117',
  surface: '#1a1f2e',
  border: '#2a3045',
  textPrimary: '#e8eaf0',
  textMuted: '#8892b0',
  textSubtle: '#6272a4',
  textFaint: '#44475a',
  income: '#22c55e',
  expense: '#f87171',
};

export const categoryColors = [
  '#7b5cf0',
  '#2563eb',
  '#f97316',
  '#06b6d4',
  '#f43f5e',
  '#ec4899',
  '#f59e0b',
  '#16a34a',
] as const;
