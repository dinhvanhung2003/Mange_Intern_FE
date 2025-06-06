import { createContext, useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../utils/axios";

interface AuthContextType {
  role: string;
  loading: boolean;
  logout: () => void;
}

interface TokenPayload {
  email: string;
  role: string;
  exp: number;
  iat: number;
}

export const AuthContext = createContext<AuthContextType>({
  role: "",
  loading: true,
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const logout = () => {
    sessionStorage.clear();
    navigate("/login");
  };

  const getAccessTokenSafe = async (): Promise<string> => {
    let token = sessionStorage.getItem("accessToken");

    if (!token) {
      const res = await api.post("/auth/refresh", {}, { withCredentials: true });
      token = res.data.accessToken;
      if (token) sessionStorage.setItem("accessToken", token);
    }

    if (!token) throw new Error("Không lấy được accessToken");
    return token;
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = await getAccessTokenSafe();
        const decoded = jwtDecode<TokenPayload>(token);

        if (!decoded.role) throw new Error("Token không chứa role");

        setRole(decoded.role);
      } catch (err) {
        console.error("AuthProvider error:", err);
        sessionStorage.clear();
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ role, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
