import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/layouts/Dashboard";
import Register from "./pages/auth/Register";
import InternManage from "./pages/mentors/intern-task/InternManage";
import DashboardLayout from "./pages/layouts/DashboardLayout";
import UserMange from "./pages/admins/user-manages/UserMange";
import InternProfileForm from "./pages/profiles/InternProfileForm";
import MyTask from "./pages/interns/TaskIntern";
import TaskList from "./pages/tasks/TasksList";
import ChatWrapper from "./pages/chats/ChatWrapper";
import InternTopicsTab from "./pages/interns/InternTopicsTab";
import DocumentManager from "./pages/mentors/documents/DocumentManager";
import DocumentAdmin from "./pages/admins/AdminDocument";
import SharedTopicsTab from "./pages/mentors/topic/SharedTopicsTab";
function App() {

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
         <Route path="/dashboard/interns/topics" element={<InternTopicsTab />} />
          <Route path="/dashboard/mentors/document" element={<DocumentManager />} />
           <Route path="/dashboard/mentors/documents" element={<SharedTopicsTab />} />
           <Route path="/dashboard/admin/document" element={<DocumentAdmin />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
      <ChatWrapper />
    </BrowserRouter>
  );
}

export default App;
