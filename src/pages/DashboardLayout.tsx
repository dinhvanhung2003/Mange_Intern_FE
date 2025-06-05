import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import logo from "../assets/login_logo.png"
import icon_dashboard from "../assets/icon_dashboard.png";
import avatar from "../assets/avatar.png";
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [role, setRole] = useState("");
  function isTokenExpired(token: string): boolean {
    try {
      const decoded: any = jwtDecode(token);
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
  useEffect(() => {
    const fetchUser = async () => {
      let accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      // Không có token → login
      if (!accessToken || !refreshToken) return navigate("/login");

      // Nếu token hết hạn → gọi refresh
      if (isTokenExpired(accessToken)) {
        try {
          const decodedRefresh: any = jwtDecode(refreshToken);
          const userId = decodedRefresh.sub;

          const res = await fetch("http://localhost:3000/auth/refresh", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, refreshToken }),
          });
          console.log("Access token hết hạn, đang gọi refresh token...");

          if (!res.ok) throw new Error("Refresh failed");

          const data = await res.json();
          accessToken = data.accessToken;
          localStorage.setItem("accessToken", data.accessToken);
          console.log("Đã nhận accessToken mới:", data.accessToken);

          localStorage.setItem("refreshToken", data.refreshToken);
        } catch {
          localStorage.clear();
          return navigate("/login");
        }
      }

      try {
        const decoded: any = jwtDecode(accessToken as string);
        setRole(decoded.role);
      } catch {
        localStorage.clear();
        navigate("/login");
      }
    };

    fetchUser();
  }, []);


  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white p-4 flex flex-col space-y-6">
        <div className="text-xl font-bold flex">
          <img src={logo} className="w-10 inline-block mr-2" alt="Logo" />
          <div> UTTAR <br /> PRADESH<br /> TIMES</div>

        </div>
        <nav className="space-y-4">
          <a className="flex items-center space-x-2 hover:text-blue-400 flex-col cursor-pointer">
            <img src={icon_dashboard} alt="icon_dashboarddashboard"></img>

            <p>Dashboard</p>
          </a>
          {role === "admin" && (
            <a className="flex items-center space-x-2 hover:text-blue-400 flex-col cursor-pointer">
              <img src={icon_dashboard} alt="icon_dashboarddashboard"></img>

              <p>User management</p>
            </a>
          )}
          {role === "intern" && (
            <a className="flex items-center space-x-2 hover:text-blue-400 flex-col cursor-pointer">
              <img src={icon_dashboard} alt="icon_dashboarddashboard"></img>

              <p>Profile</p>
            </a>
          )}

          {role === "mentor" && (
            <a className="flex items-center space-x-2 hover:text-blue-400 flex-col cursor-pointer">
              <img src={icon_dashboard} alt="icon_dashboarddashboard"></img>

              <p>Intern Management</p>
            </a>
          )}
        </nav>
        <div className="flex items-center mx-auto">
          <img src={avatar} alt="avatar"></img>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            navigate("/login");
          }}
          className="mt-auto text-sm text-gray-300 hover:text-red-400"
        >
          Logout
        </button>
      </div>


      <div className="flex-1 p-6 overflow-y-auto bg-gray-100">
        {children}
      </div>
    </div>
  );
}




