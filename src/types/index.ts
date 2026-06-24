export type WeekDay = 'Sunday' | 'Monday' | 'Saturday';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface TransactionFilters {
  type?: 'income' | 'expense';
  categoryIds?: number[];
}
export type UnitPosition = 'prefix' | 'suffix';
export type CategoryType = 'income' | 'expense';
export type TransactionType = 'income' | 'expense';
export type ViewMode = 'daily' | 'calendar' | 'monthly';
export type StatsPeriod = 'monthly' | 'annual';

export interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
  type: CategoryType;
}

export interface AccountGroup {
  id: number;
  name: string;
  sort_order: number;
}

export interface Account {
  id: number;
  name: string;
  type: string;
  icon: string;
  color: string;
  balance: number;
  group_id: number | null;
}

export interface Transaction {
  id: number;
  account_id: number;
  category_id: number;
  amount: number; // positive = income, negative = expense
  note: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS
  category?: Category;
  account?: Account;
}

export interface UserSettings {
  week_start: WeekDay;
  currency_country: string;
  currency_code: string;
  currency_symbol: string;
  unit_position: UnitPosition;
  theme: ThemeMode;
}

export interface BudgetEntry {
  category_id: number;
  category_name: string;
  category_color: string;
  category_icon: string;
  default_amount: number | null;
  override_amount: number | null;
  effective_amount: number | null;
  spent: number;
}

export interface MonthlySummary {
  year: number;
  month: number; // 1-indexed
  income: number;
  expenses: number;
}

export interface CategoryStats {
  category_id: number;
  category_name: string;
  category_color: string;
  category_icon: string;
  total: number;
  type: CategoryType;
}

export type RecurringFrequency =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'end_of_month'
  | 'bimonthly'
  | 'annually';

export interface RecurringRule {
  id: number;
  category_id: number;
  account_id: number;
  amount: number;
  note: string;
  description: string;
  frequency: RecurringFrequency;
  start_date: string; // YYYY-MM-DD — reference date for the schedule
  last_created_date: string | null; // YYYY-MM-DD of last auto-created transaction
  active: boolean;
  category_name: string;
  category_color: string;
  category_type: CategoryType;
  account_name: string;
}

export interface TransactionFormData {
  account_id: number;
  category_id: number;
  amount: string;
  note: string;
  description: string;
  date: string;
  time: string;
  type: TransactionType;
}
