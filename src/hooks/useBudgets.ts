import { Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { getBudgets, setBudgetDefault, setBudgetOverride } from '../services/budgets';

function showError(err: unknown, fallback: string) {
  const msg = err instanceof Error ? err.message : '';
  const isOurs = msg && !/^(sqlite|SqliteError|SQLITE)/i.test(msg);
  Alert.alert('Error', isOurs ? msg : fallback);
}

export function useBudgets(year: number, month: number) {
  return useQuery({
    queryKey: ['budgets', year, month],
    queryFn: () => getBudgets(year, month),
    placeholderData: keepPreviousData,
  });
}

export function useSetBudgetDefault() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      categoryId,
      amount,
      effectiveFromYear,
      effectiveFromMonth,
    }: {
      categoryId: number;
      amount: number | null;
      effectiveFromYear?: number;
      effectiveFromMonth?: number;
    }) => setBudgetDefault(categoryId, amount, effectiveFromYear, effectiveFromMonth),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgets'] }),
    onError: (err) => showError(err, "Couldn't save this budget. Please try again."),
  });
}

export function useSetBudgetOverride() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      categoryId,
      year,
      month,
      amount,
    }: {
      categoryId: number;
      year: number;
      month: number;
      amount: number | null;
    }) => setBudgetOverride(categoryId, year, month, amount),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgets'] }),
    onError: (err) => showError(err, "Couldn't save this budget. Please try again."),
  });
}
