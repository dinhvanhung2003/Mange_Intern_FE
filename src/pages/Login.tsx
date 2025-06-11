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
  const [captchaText, setCaptchaText] = useState(generateCaptcha());
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    if (!email) {
      setError('Vui lòng điền email!');
      setLoading(false);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Email không hợp lệ.');
      setLoading(false);
      return;
    }
    if (!password) {
      setError('Vui lòng điền mật khẩu!');
      setLoading(false);
      return;
    }
    if (!captcha) {
      setError('Vui lòng điền mã captcha!');
      setLoading(false);
      return;
    }




    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      setLoading(false);
      return;
    }
    if (captcha !== captchaText) {
      setError('Mã captcha không đúng.');
      setLoading(false);
      return;
    }
    try {
      const res = await api.post(
        'http://localhost:3000/auth/login',
        { email, password, captcha },
        { withCredentials: true }
      );

      sessionStorage.setItem('accessToken', res.data.accessToken);
      navigate('/dashboard');
    } catch (err) {
      setError('Sai tài khoản, mật khẩu');
    } finally {
      setLoading(false);
    }
  };
  function generateCaptcha(length = 5) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }
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
        <input
          type="email"
          placeholder="hannah.green@test.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 w-full mb-3 rounded outline-none"
        />
        <input
          type="password"
          placeholder="Password123@"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 w-full mb-3 rounded outline-none"
        />
        <div className="flex items-center mb-3">
          <input
            type="text"
            placeholder="Enter the shown text"
            value={captcha}
            onChange={(e) => setCaptcha(e.target.value)}
            className="border p-2 w-full mr-2 rounded outline-none"
          />
          <div className="border p-2 text-lg font-bold bg-gray-100 select-none">{captchaText}</div>
          <button
            onClick={() => setCaptchaText(generateCaptcha())}
            className="ml-2 text-blue-600 hover:underline text-sm"
          >
            Refresh
          </button>
        </div>
        {error && <div className="text-red-500 mb-3 text-sm">{error}</div>}
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
        <div>
          <p className="text-sm text-center mt-4">
            Chưa có tài khoản?{' '}
            <span
              className="text-blue-600 cursor-pointer hover:underline"
              onClick={() => navigate('/register')}
            >
              Đăng ký ngay
            </span>
          </p>
        </div>
      </div>

      <div className="absolute bottom-0 w-full">
        <img src={background_login} alt="Cityline" className="w-full opacity-80" />
      </div>
    </div>
  );
};

export default Login;
