import logo from "../assets/login_logo.png";
import icon_dashboard from "../assets/icon_dashboard.png";
import avatar from "../assets/avatar.png";
import { useEffect, useState } from "react";
import { useNavigate, Link, Outlet, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import FloatingChat from "./Chat/FloatingChat";
import Snackbar from "@mui/material/Snackbar";
import api from "../utils/axios";
import NotificationBell from "../components/Ring";
import Submenu from "../components/SubMenu";
import SidebarLink from "../components/SidebarLink";
import users from "../assets/siderbars/users.png";
import tasks from "../assets/siderbars/tasks.png"
import { queryClient } from "../index";
import { useAssignmentStore } from "../stores/useAssignmentStore";


const socket = require("socket.io-client")("http://localhost:3000");

interface TokenPayload {
  email: string;
  type: string;
  exp: number;
  iat: number;
}

export default function DashboardLayout() {
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [unreadTasks, setUnreadTasks] = useState(0);
  const [taskNotification, setTaskNotification] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [savedNotifications, setSavedNotifications] = useState<any[]>([]);


  // fetch assigment 
  const { fetchAssignment } = useAssignmentStore();



  const navigate = useNavigate();
  const location = useLocation();
  const [submenuOpen, setSubmenuOpen] = useState(false);
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
    if (role === 'intern') {
      fetchAssignment();
    }
  }, [role]);
  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");
    if (!token) {
      navigate("/login");
    } else {
      setLoading(false);
    }
  }, [navigate]);
  useEffect(() => {
    setSubmenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (role === "intern" && 'serviceWorker' in navigator && 'PushManager' in window) {
      const registerServiceWorkerAndSubscribe = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');

          await new Promise<void>((resolve) => {
            if (registration.active) return resolve();
            const readyCheck = setInterval(() => {
              if (registration.active) {
                clearInterval(readyCheck);
                resolve();
              }
            }, 100);
          });


          if (Notification.permission !== 'granted') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
              console.warn(' Người dùng chưa cấp quyền nhận thông báo.');
              return;
            }
          }

          const existing = await registration.pushManager.getSubscription();
          const subscription = existing || await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
              'BC8Nn9QOkwrx5s3N4hOrYaGEqiqhdSs0HWoHNuqzRGKETp5YtTxLfVSX6qdKUq3RDhOmOxBwv5nGFMXdG0kug5U'
            ),
          });

          await fetch('http://localhost:3001/notifications/save-subscription', {

            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${sessionStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(subscription),
          });

          console.log(' Push đăng ký thành công!');
        } catch (err) {
          console.error(' Đăng ký Push Notification thất bại:', err);
        }
      };
      const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
          .replace(/\-/g, '+')
          .replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      };

      registerServiceWorkerAndSubscribe();
    }
  }, [role]);

  useEffect(() => {
    if (role === "intern") {
      api.get("/interns/assignment").then((res) => {
        if (res.data?.internId) {
          socket.emit("join", res.data.internId);
        }
      });

      api.get("/notifications")
        .then((res) => {
          setSavedNotifications(res.data);
          setUnreadTasks(res.data.filter((n: any) => !n.isRead).length);
        });

      socket.on("task_assigned", (task: any) => {
        setUnreadTasks((prev) => prev + 1);
        setTaskNotification(`Bạn vừa được giao task: ${task.title}`);
        setShake(true);
        setTimeout(() => setShake(false), 1000);
      });

      return () => {
        socket.off("task_assigned");
      };
    }
  }, [role]);

  useEffect(() => {
    const handler = () => setUnreadTasks(0);
    window.addEventListener("reset-unread-tasks", handler);
    return () => window.removeEventListener("reset-unread-tasks", handler);
  }, []);

  const handleLogout = () => {
    socket.disconnect();
    sessionStorage.clear();
    // delete cache
    queryClient.clear()
    // delete store 
    useAssignmentStore.getState().clearAssignment();
    navigate("/login");
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-30 sm:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar toggle (mobile) */}
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

      {/* Sidebar */}
      <div className={`fixed sm:static top-0 left-0 h-full bg-[#1c1c1e] text-white p-4 flex flex-col justify-between z-40 w-64 transition-transform duration-300 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} sm:translate-x-0`}>

        {/* Logo */}
        <div>
          <div className="flex flex-row items-center justify-center mb-10">
            <img src={logo} alt="Logo" className="w-12 h-12 mb-2" />
            <div className="text-left font-bold leading-tight items-start text-xl">
              UTTAR<br />PRADESH<br />TIMES
            </div>
          </div>
          {/* Navigation */}
          <nav className="space-y-4">
            <SidebarLink to="/dashboard" label="Dashboard" icon={icon_dashboard} currentPath={location.pathname} />

            {role === "admin" && (
              <Submenu
                label="Admin Management"
                icon={icon_dashboard}
                routes={[
                  { label: "User Management", to: "/dashboard/users" },
                  { label: "Task Management", to: "/dashboard/admin/tasks" },
                ]}
                submenuOpen={submenuOpen}
                setSubmenuOpen={setSubmenuOpen}
                currentPath={location.pathname}
              />
            )}


            {role === "intern" && (
              <>
                <SidebarLink to="/dashboard/interns/profile" label="Intern Profile" icon={icon_dashboard} currentPath={location.pathname} />
                <SidebarLink to="/dashboard/interns/my-tasks" label="My Tasks" icon={tasks} currentPath={location.pathname} />
              </>
            )}

            {role === "mentor" && (
              <>
                <Submenu
                  label="Intern Management"
                  icon={icon_dashboard}
                  routes={[
                    { label: "Quản lý Intern", to: "/dashboard/interns?tab=interns" },
                    { label: "Quản lý Task", to: "/dashboard/interns?tab=tasks" }
                  ]}
                  submenuOpen={submenuOpen}
                  setSubmenuOpen={setSubmenuOpen}
                  currentPath={location.pathname}
                />


                {/* <SidebarLink
                  to="/dashboard/interns"
                  label="Intern Management"
                  icon={icon_dashboard}
                  currentPath={location.pathname}
                /> */}
              </>
            )}

          </nav>
        </div>

        {/* Avatar + Logout */}
        <div className="text-center space-y-2">
          <img src={avatar} alt="Avatar" className="w-10 h-10 mx-auto rounded-full border border-orange-400" />
          <button onClick={handleLogout} className="text-sm text-gray-300 hover:text-red-400">
            Logout
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto bg-gray-100">



        <div
          className={`flex-1 p-6 overflow-y-auto bg-gray-100 transition-all duration-300 ${submenuOpen ? "pl-64" : ""
            }`}
        >
          <Outlet />
        </div>


        {(role === "intern" || role === "mentor") && <FloatingChat />}
        <Snackbar
          open={!!taskNotification}
          autoHideDuration={4000}
          onClose={() => setTaskNotification(null)}
          message={taskNotification}
        />
      </div>
      {role === "intern" && (
        <NotificationBell
          unreadTasks={unreadTasks}
          setUnreadTasks={setUnreadTasks}
          triggerShake={shake}
          setShake={setShake}
          notifications={savedNotifications}
        />
      )}
    </div>
  );
}


// export function SidebarLink({ to, label, icon, currentPath }: { to: string, label: string, icon: string, currentPath: string }) {
//   const isActive = currentPath === to;

//   return (
//     <Link
//       to={to}
//       className={`flex flex-col items-center justify-center px-4 py-5 rounded-xl transition hover:bg-gray-800 ${isActive ? 'bg-gray-800' : ''
//         }`}
//     >
//       <img src={icon} alt={label} className="w-7 h-7 mb-2" />
//       <span className={`text-base transition font-normal ${isActive ? 'font-semibold' : 'hover:font-semibold'}`}>
//         {label}
//       </span>
//     </Link>
//   );
// }




