// hooks/useAuth.ts
import { useEffect, useState } from "react";
import axios from "../utils/axios"; // file axios config mới với withCredentials: true

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("/auth/me"); // backend đọc cookie -> trả user
        setUser(res.data);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return loading ? null : user;
}
