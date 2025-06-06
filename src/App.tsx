import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Register from "./pages/Register";
import api from './utils/axios';
import { AuthProvider } from "./context/AuthProvider";
import InternManagement from "./pages/InternManagement";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route
          path="/dashboard/interns"
          element={

            <InternManagement />

          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
