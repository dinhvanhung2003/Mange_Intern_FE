import React, { useState } from 'react';
import axios from 'axios';
import logo_login from '../assets/login_logo.png';
import background_login from '../assets/background_login.png';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axios';
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post(
        'http://localhost:3000/auth/login',
        { email, password, captcha },
        { withCredentials: true }
      );

      sessionStorage.setItem('accessToken', res.data.accessToken);
      navigate('/dashboard');
    } catch (err) {
      setError('Sai tài khoản, mật khẩu hoặc mã captcha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex justify-center items-center relative">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-6">
          <div className="flex flex-row items-center mb-2">
            <img src={logo_login} alt="Logo" className="h-10 mb-2" />
            <h1 className="text-xl font-bold text-gray-800 ml-2">UTTAR PRADESH TIMES</h1>
          </div>
          <p className="text-xl text-blue-800 font-semibold mt-4">Welcome Back</p>
        </div>

        {error && <div className="text-red-500 mb-3 text-sm">{error}</div>}

        <input
          type="email"
          placeholder="hannah.green@test.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 w-full mb-3 rounded"
        />
        <input
          type="password"
          placeholder="Password123@"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 w-full mb-3 rounded"
        />
        <div className="flex items-center mb-3">
          <input
            type="text"
            placeholder="Enter the shown text"
            value={captcha}
            onChange={(e) => setCaptcha(e.target.value)}
            className="border p-2 w-full mr-2 rounded"
          />
          <div className="border p-2 text-lg font-bold bg-gray-100 select-none">mkfxc</div>
        </div>
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={() => setRememberMe(!rememberMe)}
            className="mr-2"
          />
          <label className="text-sm text-gray-700">Remember me on this computer</label>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="bg-blue-800 text-white w-full py-2 rounded hover:bg-blue-900 disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </div>

      <div className="absolute bottom-0 w-full">
        <img src={background_login} alt="Cityline" className="w-full opacity-80" />
      </div>
    </div>
  );
};

export default Login;
