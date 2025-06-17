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

  const navigate = useNavigate();
  const location = useLocation();

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
    navigate("/login");
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="flex h-screen relative">
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
      <div
        className={`fixed sm:static top-0 left-0 h-full bg-gray-900 text-white p-4 space-y-6 z-40 w-64 transform transition-transform duration-200 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
          }`}
      >
        <div className="text-xl font-bold flex">
          <img src={logo} className="w-10 inline-block mr-2" alt="Logo" />
          <div>
            UTTAR <br /> PRADESH <br /> TIMES
          </div>
        </div>
        <nav className="space-y-4">
          <Link to="/dashboard" className="flex items-center space-x-2 hover:text-blue-400 flex-col cursor-pointer">
            <img src={icon_dashboard} alt="Dashboard" />
            <p>Dashboard</p>
          </Link>

          {role === "admin" && (
            <>
              <Link to="/dashboard/users" className="flex items-center space-x-2 hover:text-blue-400 flex-col cursor-pointer">
                <img src={icon_dashboard} alt="User Management" />
                <p>User Management</p>
              </Link>
              <Link to="/dashboard/admin/tasks" className="flex items-center space-x-2 hover:text-blue-400 flex-col cursor-pointer">
                <img src={icon_dashboard} alt="Task Management" />
                <p>Task Management</p>
              </Link>
            </>
          )}

          {role === "intern" && (
            <>
              <Link to="/dashboard/interns/profile" className="flex items-center space-x-2 hover:text-blue-400 flex-col cursor-pointer">
                <img src={icon_dashboard} alt="Intern Profile" />
                <p>Intern Profile</p>
              </Link>
              <Link to="/dashboard/interns/my-tasks" className="flex items-center space-x-2 hover:text-blue-400 flex-col cursor-pointer">
                <img src={icon_dashboard} alt="My Tasks" />
                <p>My Tasks</p>
              </Link>
            </>
          )}

          {role === "mentor" && (
            <Link to="/dashboard/interns" className="flex items-center space-x-2 hover:text-blue-400 flex-col cursor-pointer">
              <img src={icon_dashboard} alt="Intern Management" />
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
