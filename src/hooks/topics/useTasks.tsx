import { useQuery } from "@tanstack/react-query";
import authApi from "@/utils/axios";

export const useTasks = (internId: number, enabled = true) =>
  useQuery({
    queryKey: ["tasks", internId],
    queryFn: async () => {
      const res = await authApi.get(`/mentor/interns/${internId}/tasks`);
      return res.data;
    },
    enabled,
  });
