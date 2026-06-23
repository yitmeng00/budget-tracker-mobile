import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../services/categories';
import type { Category } from '../types';

export function useCategories() {
  return useQuery({ queryKey: ['categories'], queryFn: getCategories });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Category, 'id'>) => createCategory(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Omit<Category, 'id'>> }) =>
      updateCategory(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
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
  });
}
