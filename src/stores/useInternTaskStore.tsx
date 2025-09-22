// src/stores/useInternTaskStore.ts
import { create } from 'zustand';
import api from '../utils/axios';

type Task = {
  id: number;
  title: string;
  description: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'hold';
};

type TaskState = {
  tasks: Task[];
  hasFetched: boolean;
  fetchTasks: () => Promise<void>;
};

type TasksApi =
  | Task[]
  | { data: Task[]; total: number; page: number; limit: number };

const toArray = (payload: TasksApi): Task[] =>
  Array.isArray(payload) ? payload : payload?.data ?? [];

export const useInternTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  hasFetched: false,
  fetchTasks: async () => {
    if (get().hasFetched) return;
    const res = await api.get<TasksApi>('/interns/tasks', {
      params: { page: 1, limit: 1000 },
    });
    set({ tasks: toArray(res.data), hasFetched: true });
  },
}));
