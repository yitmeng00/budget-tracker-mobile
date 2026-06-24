import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reassignAndDeleteCategory,
} from '../services/categories';
import { showError } from './utils';
import type { Category } from '../types';

export function useCategories() {
  return useQuery({ queryKey: ['categories'], queryFn: getCategories });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Category, 'id'>) => createCategory(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
    onError: (err) => showError(err, "Couldn't create this category. Please try again."),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Omit<Category, 'id'>> }) =>
      updateCategory(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
    onError: (err) => showError(err, "Couldn't update this category. Please try again."),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
    onError: (err) => showError(err, "Couldn't delete this category. Please try again."),
  });
}

export function useReassignAndDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ fromId, toId }: { fromId: number; toId: number }) =>
      reassignAndDeleteCategory(fromId, toId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
    onError: (err) => showError(err, "Couldn't reassign transactions. Please try again."),
  });
}
