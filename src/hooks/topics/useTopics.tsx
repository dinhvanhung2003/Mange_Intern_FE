import { useQuery } from "@tanstack/react-query";
import authApi from "@/utils/axios";

export const useTopics = (internId: number, enabled = true) =>
  useQuery({
    queryKey: ["topics", internId],
    queryFn: async () => {
      const res = await authApi.get(`/topics/by-intern/${internId}`);
      return res.data;
    },
    enabled,
  });
