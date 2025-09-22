import logo from "../../assets/login_logo.png";
import icon_dashboard from "../../assets/icon_dashboard.png";
import avatar from "../../assets/avatar.png";
import { useEffect, useState } from "react";
import { useNavigate, Link, Outlet, useLocation } from "react-router-dom";
import authApi from "../../utils/axios";
import Chat from "../chats/Chat";
import Snackbar from "@mui/material/Snackbar";
import api from "../../utils/axios";
import NotificationBell from "../../components/Ring";
import Submenu from "../../components/SubMenu";
import SidebarLink from "../../components/SidebarLink";
import tasks from "../../assets/siderbars/tasks.png"
import { queryClient } from "../../index";
import { useAssignmentStore } from "../../stores/useAssignmentStore";
import { getRoleFromServer } from "../../utils/getRole";
import { CircularProgress, Box } from "@mui/material";
import {Alert} from "@mui/material";
const socket = require("socket.io-client")("http://localhost:3000");

interface TokenPayload {
  email: string;
  type: string;
  exp: number;
  iat: number;
}

export default function DashboardLayout() {
  const location = useLocation();
  const fullPath = location.pathname + location.search;
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [unreadTasks, setUnreadTasks] = useState(0);
  const [taskNotification, setTaskNotification] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [savedNotifications, setSavedNotifications] = useState<any[]>([]);
  // fetch assigment 
  const { fetchAssignment } = useAssignmentStore();
  const navigate = useNavigate();
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const [role, setRole] = useState<string>("");

  // xử lý snack chung 
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info" | "warning">("success");

  const showSnackbar = (message: string, severity: typeof snackbarSeverity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };


  // gửi token lên server để lấy role
  useEffect(() => {
    const fetchRole = async () => {
      try {
        const fetchedRole = await getRoleFromServer();
        setRole(fetchedRole || "");
      } catch (error) {
        console.error("Lỗi khi lấy role:", error);
      }
    };
    fetchRole();
  }, []);

  // const role = getRoleFromToken();
  // check auth ở layout
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/auth/check", {
          method: "GET",
          credentials: "include", // gửi cookie kèm request
        });

        if (res.ok) {
          setLoading(false);
        } else {
          navigate("/login", { replace: true });
        }
      } catch (error) {
        navigate("/login", { replace: true });
      }
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    setSubmenuOpen(false);
  }, [location.pathname]);
  // service worker
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

          await fetch('http://localhost:3000/notifications/save-subscription', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // để gửi cookie
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
  // notification cho mentor
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
      socket.on("deadline_assigned", (data: any) => {
        setUnreadTasks((prev) => prev + 1);
        setTaskNotification(`Bạn có deadline mới trong topic "${data.topicTitle}"`);
        setShake(true);
        setTimeout(() => setShake(false), 1000);
      });
      return () => {
        socket.off("task_assigned");
        socket.off("deadline_assigned");
      };
    }
  }, [role]);

  useEffect(() => {
    const handler = () => setUnreadTasks(0);
    window.addEventListener("reset-unread-tasks", handler);
    return () => window.removeEventListener("reset-unread-tasks", handler);
  }, []);

  useEffect(() => {
    if (role === 'intern') {
      fetchAssignment();
    }
  }, [role]);
  // xử lý đăng xuất 
const handleLogout = async () => {
  try {
    // Ngắt kết nối socket
    socket.disconnect();
    queryClient.clear();
    useAssignmentStore.getState().clearAssignment();

    // --- 1. Xóa push subscription ---
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;

      // Unsubscribe ở browser
      registration.active?.postMessage({ type: 'UNSUBSCRIBE_PUSH' });

      // Xóa ở DB trước khi mất quyền truy cập
      try {
        await api.delete('/notifications/remove-subscription', {
          data: { endpoint }
        });
      } catch (err) {
        console.error('Xóa subscription thất bại:', err);
      }
    }

    // --- 2. Gọi API logout ---
    await authApi.post('/auth/logout');

    // --- 3. Chuyển hướng ---
    navigate("/login");
  } catch (error) {
    console.error("Lỗi khi đăng xuất:", error);
    navigate("/login");
  }
};


  if (loading) {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <CircularProgress />
    </Box>
  );
}

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
              <>
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
                <SidebarLink to="/dashboard/admin/document" label="Dashboard" icon={icon_dashboard} currentPath={location.pathname} />

              </>

            )}


            {role === "intern" && (
              <>
                <SidebarLink to="/dashboard/interns/profile" label="Intern Profile" icon={icon_dashboard} currentPath={location.pathname} />
                <SidebarLink to="/dashboard/interns/my-tasks" label="My Tasks" icon={tasks} currentPath={location.pathname} />
                <SidebarLink to="/dashboard/interns/topics" label="Topics" icon={tasks} currentPath={location.pathname} />

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
                  currentPath={fullPath}
                />
                <SidebarLink to="/dashboard/mentors/document" label="Document" icon={tasks} currentPath={location.pathname} />
                <SidebarLink to="/dashboard/mentors/documents" label="Topics" icon={tasks} currentPath={location.pathname} />

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
          <Outlet context={{ showSnackbar }} />
        </div>


        {(role === "intern" || role === "mentor") && <Chat />}
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
       <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ zIndex: 9999 }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}




