import { create } from 'zustand';
import api from '../utils/axios';

type Task = {
  id: number;
  title: string;
  description: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'hold' ;

};

type TaskState = {
  tasks: Task[];
  hasFetched: boolean;
  fetchTasks: () => Promise<void>;
};

export const useInternTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  hasFetched: false,
  fetchTasks: async () => {
    if (get().hasFetched) return;
    const res = await api.get('/interns/tasks');
    set({ tasks: res.data, hasFetched: true });
  },
}));
