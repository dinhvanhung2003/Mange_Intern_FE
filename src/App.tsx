import { BrowserRouter, Routes, Route,Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Register from "./pages/Register";
import api from './utils/axios';
import { AuthProvider } from "./context/AuthProvider";
import InternManage from "./pages/Interns/InternManage";
import DashboardLayout from "./pages/DashboardLayout";
import UserMange from "./pages/UsersMange/UserMange";
function App() {
  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="interns" element={<InternManage />} /> 
        <Route path="users" element={<UserMange/>}/>
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
    </BrowserRouter>
  );
}

export default App;
