import { useQuery } from '@tanstack/react-query';
import {
  getMonthsTrend,
  getMonthlySummaries,
  getCategoryStats,
  getYearlySummary,
  getMonthsForYear,
  getYearlyCategoryStats,
} from '../services/stats';

export function useMonthsTrend(year: number, month: number, count: number) {
  return useQuery({
    queryKey: ['stats', 'trend', year, month, count],
    queryFn: () => getMonthsTrend(year, month, count),
  });
}

export function useMonthlySummaries(count: number) {
  return useQuery({
    queryKey: ['stats', 'monthly', count],
    queryFn: () => getMonthlySummaries(count),
  });
}

export function useCategoryStats(year: number, month: number, type: 'income' | 'expense') {
  return useQuery({
    queryKey: ['stats', 'categories', year, month, type],
    queryFn: () => getCategoryStats(year, month, type),
  });
}

export function useYearlySummary(year: number) {
  return useQuery({
    queryKey: ['stats', 'yearly-summary', year],
    queryFn: () => getYearlySummary(year),
  });
}

export function useMonthsForYear(year: number) {
  return useQuery({
    queryKey: ['stats', 'months-for-year', year],
    queryFn: () => getMonthsForYear(year),
  });
}

export function useYearlyCategoryStats(year: number, type: 'income' | 'expense') {
  return useQuery({
    queryKey: ['stats', 'yearly-categories', year, type],
    queryFn: () => getYearlyCategoryStats(year, type),
  });
}
