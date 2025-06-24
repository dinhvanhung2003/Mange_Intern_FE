import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import api from '../utils/axios';

interface Assignment {
  id: number;
  internId: number;
  mentorId?: number;
  mentor?: { name: string };
  startDate?: string;
  endDate?: string;
}

interface AssignmentStore {
  assignment: Assignment | null;
  loading: boolean;
  hasFetched: boolean;
  fetchAssignment: () => Promise<void>;
}

export const useAssignmentStore = create<AssignmentStore>()(
  devtools((set, get) => ({
    assignment: null,
    loading: false,
    hasFetched: false,
    fetchAssignment: async () => {
      if (get().hasFetched) return; 
      set({ loading: true }, false, 'assignment/loading');
      try {
        const res = await api.get('/interns/assignment');
        set({
          assignment: res.data,
          hasFetched: true
        }, false, 'assignment/fetched');
      } catch (err) {
        console.error(err);
      } finally {
        set({ loading: false }, false, 'assignment/loaded');
      }
    }
  }))
);

