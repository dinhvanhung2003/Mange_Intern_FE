import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import logo from "../assets/login_logo.png"
import icon_dashboard from "../assets/icon_dashboard.png";
import avatar from "../assets/avatar.png";
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [role, setRole] = useState("");

  useEffect(() => {
  const fetchUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    try {
      const decoded: any = jwtDecode(token);
      setRole(decoded.role);
    } catch (e) {
      localStorage.removeItem("token");
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
          <div> UTTAR <br /> PRADESH<br/> TIMES</div>
         
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
            localStorage.removeItem("token");
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




