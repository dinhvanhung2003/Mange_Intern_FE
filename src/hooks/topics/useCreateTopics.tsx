import { useMutation, useQueryClient } from "@tanstack/react-query";
import authApi from "../../utils/axios";

export const useCreateTopic = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      dueDate: string;
      assignedToId: number;
    }) => {
      const res = await authApi.post("/topics", data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["topics", variables.assignedToId] });

    },
  });
};
