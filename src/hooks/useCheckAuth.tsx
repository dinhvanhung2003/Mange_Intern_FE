// hooks/useCheckAuth.ts
import { useQuery } from "@tanstack/react-query";

export function useCheckAuth() {
  return useQuery({
    queryKey: ["auth", "check"],
    queryFn: async () => {
      const res = await fetch("/auth/check", {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Not authenticated");

      return true;
    },
    retry: false, // không tự retry nếu thất bại
    staleTime: 0, // luôn gọi lại khi component mount
  });
}
