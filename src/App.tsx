import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Register from "./pages/Register";
import api from './utils/axios';
import { AuthProvider } from "./context/AuthProvider";
import InternManage from "./pages/Interns/InternManage";
import DashboardLayout from "./pages/DashboardLayout";
import UserMange from "./pages/UsersMange/UserMange";
import InternProfileForm from "./pages/Profiles/InternProfileForm";
import MyTask from "./pages/Interns/MyTask";
import TaskList from "./pages/Tasks/TasksList";
import ChatRoom from "./pages/Chat/FloatingChat";
import FloatingChat from "./pages/Chat/FloatingChat";
import { useEffect } from "react";
import { useAssignmentStore } from "./stores/useAssignmentStore";
function App() {
//   useEffect(() => {
//   if ('serviceWorker' in navigator) {
//     navigator.serviceWorker
//       .register('/sw.js')
//       .then((registration) => {
//         console.log(' Service Worker registered:', registration);
//       })
//       .catch((error) => {
//         console.error(' Service Worker registration failed:', error);
//       });
//   }
// }, []);
 const { fetchAssignment } = useAssignmentStore();

  useEffect(() => {
    fetchAssignment(); 
  }, []);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="interns" element={<InternManage />} />
          <Route path="users" element={<UserMange />} />
          <Route path="interns/profile" element={<InternProfileForm />} />
          <Route path="interns/my-tasks" element={<MyTask />} />
          <Route path="admin/tasks" element={<TaskList />} />
         
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
      <FloatingChat />
    </BrowserRouter>
  );
}

export default App;
