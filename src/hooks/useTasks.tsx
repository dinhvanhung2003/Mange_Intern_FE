import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../utils/axios';

export type Task = {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'error';
  score?: number | null;
  sharedDocuments?: any[];
};

type TasksResponse = {
  data: Task[];
  total: number;
  page: number;
  limit: number;
};

export function useTasks(params: { search: string; page: number; limit: number; start?: string; end?: string }) {
  const { search, page, limit, start, end } = params;

  return useQuery({
    queryKey: ['tasks', { search, page, limit, start, end }],
    queryFn: async () => {
      const res = await api.get<TasksResponse>('/interns/tasks', { params: { search, page, limit, start, end } });
      return res.data;
    },
    placeholderData: { data: [], total: 0, page: 1, limit },
    staleTime: 30_000,
  });
}

export function useAcceptTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: number; note: string }) => api.patch(`/interns/tasks/${id}/accept`, { note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useSubmitTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }: { id: number; formData: FormData }) =>
      api.patch(`/interns/tasks/${id}/submit`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
