// src/stores/useTaskStats.ts
import { useInternTaskStore } from './useInternTaskStore';

export const useTaskStats = () =>
  useInternTaskStore((state) => {
    const complete = state.tasks.filter(t => t.status === 'completed').length;
    const assigned = state.tasks.filter(t => t.status === 'assigned').length;
    const progress = state.tasks.filter(t => t.status === 'in_progress').length;
    const hold = state.tasks.filter(t => ['hold', 'rejected'].includes(t.status)).length;

    return { complete, assigned, progress, hold };
  });
