import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getRecurringRules,
  createRecurringRule,
  updateRecurringRule,
  deleteRecurringRule,
} from '../services/recurring';
import { showError } from './utils';

const KEY = ['recurring_rules'];

export function useRecurringRules() {
  return useQuery({ queryKey: KEY, queryFn: getRecurringRules });
}

export function useCreateRecurringRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Parameters<typeof createRecurringRule>[0]) => {
      createRecurringRule(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: (err) => showError(err, "Couldn't save this recurring rule. Please try again."),
  });
}

export function useUpdateRecurringRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Parameters<typeof updateRecurringRule>[1];
    }) => {
      updateRecurringRule(id, data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: (err) => showError(err, "Couldn't update this recurring rule. Please try again."),
  });
}

export function useDeleteRecurringRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      deleteRecurringRule(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: (err) => showError(err, "Couldn't delete this recurring rule. Please try again."),
  });
}
