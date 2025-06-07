import logo from "../assets/login_logo.png";
import icon_dashboard from "../assets/icon_dashboard.png";
import avatar from "../assets/avatar.png";
import { useEffect, useState } from "react";
import { useNavigate, Link, Outlet } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

interface TokenPayload {
  email: string;
  type: string;
  exp: number;
  iat: number;
}

export default function DashboardLayout() {
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const getRoleFromToken = (): string => {
    const token = sessionStorage.getItem("accessToken");
    if (!token) return "";
    try {
      const decoded = jwtDecode<TokenPayload>(token);
      return decoded.type || "";
    } catch (err) {
      console.error("Token decode error:", err);
      return "";
    }
  };

  const role = getRoleFromToken();

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");
    if (!token) {
      navigate("/login");
    } else {
      setLoading(false);
    }
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/login");
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="flex h-screen relative">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-30 sm:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className="sm:hidden fixed top-4 left-4 z-50">
        <button onClick={() => setSidebarOpen(!isSidebarOpen)}>
          <svg
            className="w-8 h-8 text-gray-800"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      <div
        className={`fixed sm:static top-0 left-0 h-full bg-gray-900 text-white p-4 space-y-6 z-40 w-64 transform transition-transform duration-200 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
        }`}
      >
        <div className="text-xl font-bold flex">
          <img src={logo} className="w-10 inline-block mr-2" alt="Logo" />
          <div>
            UTTAR <br /> PRADESH <br /> TIMES
          </div>
        </div>
        <nav className="space-y-4">
          <Link
            to="/dashboard"
            className="flex items-center space-x-2 hover:text-blue-400 flex-col cursor-pointer"
          >
            <img src={icon_dashboard} alt="Dashboard" />
            <p>Dashboard</p>
          </Link>

          {role === "admin" && (
            <Link
              to="/dashboard/users"
              className="flex items-center space-x-2 hover:text-blue-400 flex-col cursor-pointer"
            >
              <img src={icon_dashboard} alt="Intern management" />
              <p>User Management</p>
            </Link>
          )}

          {role === "intern" && (
            <a className="flex items-center space-x-2 hover:text-blue-400 flex-col cursor-pointer">
              <img src={icon_dashboard} alt="Profile" />
              <p>Profile</p>
            </a>
          )}

          {role === "mentor" && (
            <Link
              to="/dashboard/interns"
              className="flex items-center space-x-2 hover:text-blue-400 flex-col cursor-pointer"
            >
              <img src={icon_dashboard} alt="Intern management" />
              <p>Intern Management</p>
            </Link>
          )}
        </nav>

        <div className="flex items-center mx-auto justify-center">
          <img src={avatar} alt="Avatar" className="w-10 h-10 rounded-full" />
        </div>
        <div className="text-center">
             <button
          onClick={handleLogout}
          className="mt-auto text-sm text-gray-300 hover:text-red-400"
        >
          Logout
        </button>
        </div>
       
      </div>
      <div className="flex-1 p-6 overflow-y-auto bg-gray-100">
        <Outlet />
      </div>
    </div>
  );
}
