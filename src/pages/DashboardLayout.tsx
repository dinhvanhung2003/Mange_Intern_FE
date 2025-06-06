import logo from "../assets/login_logo.png";
import icon_dashboard from "../assets/icon_dashboard.png";
import avatar from "../assets/avatar.png";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { Link } from "react-router-dom";
interface TokenPayload {
  email: string;
  role: string;
  exp: number;
  iat: number;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const getRoleFromToken = (): string => {
    const token = sessionStorage.getItem("accessToken");
    if (!token) return "";
    try {
      const decoded = jwtDecode<TokenPayload>(token);
      return decoded.role || "";
    } catch (err) {
      console.error("Token decode error:", err);
      return "";
    }
  };

  const role = getRoleFromToken();
console.log("Role hiện tại:", role);
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
    <div className="flex h-screen">
      <div className="w-64 bg-gray-900 text-white p-4 flex flex-col space-y-6">
        <div className="text-xl font-bold flex">
          <img src={logo} className="w-10 inline-block mr-2" alt="Logo" />
          <div> UTTAR <br /> PRADESH<br /> TIMES</div>
        </div>
        <nav className="space-y-4">
          <a className="flex items-center space-x-2 hover:text-blue-400 flex-col cursor-pointer">
            <img src={icon_dashboard} alt="Dashboard icon" />
            <p>Dashboard</p>
          </a>
          {role === "admin" && (
            <a className="flex items-center space-x-2 hover:text-blue-400 flex-col cursor-pointer">
              <img src={icon_dashboard} alt="User management" />
              <p>User management</p>
            </a>
          )}
          {role === "intern" && (
            <a className="flex items-center space-x-2 hover:text-blue-400 flex-col cursor-pointer">
              <img src={icon_dashboard} alt="Profile" />
              <p>Profile</p>
            </a>
          )}
         {role === "mentor" && (
  <Link to="/dashboard/interns" className="flex items-center space-x-2 hover:text-blue-400 flex-col cursor-pointer">
    <img src={icon_dashboard} alt="Intern management" />
    <p>Intern Management</p>
  </Link>
)}
        </nav>
        <div className="flex items-center mx-auto">
          <img src={avatar} alt="Avatar" />
        </div>
        <button onClick={handleLogout} className="mt-auto text-sm text-gray-300 hover:text-red-400">
          Logout
        </button>
      </div>
      <div className="flex-1 p-6 overflow-y-auto bg-gray-100">
        {children}
      </div>
    </div>
  );
}
