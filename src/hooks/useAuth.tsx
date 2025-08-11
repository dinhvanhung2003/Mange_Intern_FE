
import { useQuery } from "@tanstack/react-query";
import axios from "../utils/axios";

export function useAuth() {
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await axios.get("/auth/me");
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // cache trong 5 phút
    retry: false, // không tự retry nếu lỗi (ví dụ chưa đăng nhập)
  });

  if (isLoading) return null;
  if (isError) return null;

  return user;
}
