import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAccounts,
  getAccountGroups,
  createAccount,
  updateAccount,
  deleteAccount,
} from '../services/accounts';
import type { Account } from '../types';

export function useAccounts() {
  return useQuery({ queryKey: ['accounts'], queryFn: getAccounts });
}

export function useAccountGroups() {
  return useQuery({ queryKey: ['account-groups'], queryFn: getAccountGroups });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Account, 'id'>) => createAccount(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Omit<Account, 'id'>> }) =>
      updateAccount(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteAccount(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  });
}
