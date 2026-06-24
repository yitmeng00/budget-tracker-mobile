import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAccounts,
  getAccountGroups,
  getNetWorth,
  createAccount,
  updateAccount,
  deleteAccount,
  createAccountGroup,
  updateAccountGroup,
  deleteAccountGroup,
} from '../services/accounts';
import { showError } from './utils';
import type { Account } from '../types';

export function useAccounts() {
  return useQuery({ queryKey: ['accounts'], queryFn: getAccounts });
}

export function useNetWorth() {
  return useQuery({ queryKey: ['accounts', 'net-worth'], queryFn: getNetWorth });
}

export function useAccountGroups() {
  return useQuery({ queryKey: ['account-groups'], queryFn: getAccountGroups });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Account, 'id'>) => createAccount(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
    onError: (err) => showError(err, "Couldn't create this account. Please try again."),
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Omit<Account, 'id'>> }) =>
      updateAccount(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
    onError: (err) => showError(err, "Couldn't update this account. Please try again."),
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteAccount(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
    onError: (err) => showError(err, "Couldn't delete this account. Please try again."),
  });
}

export function useCreateAccountGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createAccountGroup(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['account-groups'] }),
    onError: (err) => showError(err, "Couldn't create this group. Please try again."),
  });
}

export function useUpdateAccountGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => updateAccountGroup(id, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['account-groups'] }),
    onError: (err) => showError(err, "Couldn't update this group. Please try again."),
  });
}

export function useDeleteAccountGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteAccountGroup(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['account-groups'] }),
    onError: (err) => showError(err, "Couldn't delete this group. Please try again."),
  });
}
