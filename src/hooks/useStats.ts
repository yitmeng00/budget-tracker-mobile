import { useQuery } from '@tanstack/react-query';
import { getMonthlySummaries, getCategoryStats } from '../services/stats';

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
