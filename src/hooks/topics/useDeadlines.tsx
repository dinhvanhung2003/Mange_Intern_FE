import { useQuery } from "@tanstack/react-query";
import authApi from "../../utils/axios";

export const useDeadlines = (topicId: number, enabled: boolean) =>
  useQuery({
    queryKey: ["deadlines", topicId],
    queryFn: async () => {
      const res = await authApi.get(`/topics/${topicId}/deadlines`);
      return res.data;
    },
    enabled,
  });
