import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  getTransactions,
  searchTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../services/transactions';
import type { Transaction, TransactionFilters } from '../types';

export function useTransactions(year: number, month: number) {
  return useQuery({
    queryKey: ['transactions', year, month],
    queryFn: () => getTransactions(year, month),
    placeholderData: keepPreviousData,
  });
}

export function useSearchTransactions(query: string, filters: TransactionFilters) {
  const isActive =
    query.trim().length > 0 || !!filters.type || (filters.categoryIds?.length ?? 0) > 0;
  return useQuery({
    queryKey: ['transactions', 'search', query, filters],
    queryFn: () => searchTransactions(query, filters),
    enabled: isActive,
    placeholderData: keepPreviousData,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Transaction, 'id' | 'category' | 'account'>) => createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Omit<Transaction, 'id' | 'category' | 'account'>;
    }) => updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
