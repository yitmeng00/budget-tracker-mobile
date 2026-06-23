import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBudgets, setBudgetDefault, setBudgetOverride } from '../services/budgets';

export function useBudgets(year: number, month: number) {
  return useQuery({
    queryKey: ['budgets', year, month],
    queryFn: () => getBudgets(year, month),
  });
}

export function useSetBudgetDefault() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, amount }: { categoryId: number; amount: number | null }) =>
      setBudgetDefault(categoryId, amount),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgets'] }),
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
  });
}
