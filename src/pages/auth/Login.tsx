import React, { useState } from 'react';
import axios from 'axios';
import logo_login from '../../assets/login_logo.png';
import background_login from '../../assets/background_login.png';
import { useNavigate } from 'react-router-dom';
import { FiRefreshCw } from 'react-icons/fi';
import api from '../../utils/axios';
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
      // const { accessToken, refreshToken } = res.data;
      // document.cookie = `accessToken=${accessToken}; path=/; max-age=900`; // 15 phút
      // document.cookie = `refreshToken=${refreshToken}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 ngày
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
    <div className="relative flex justify-center items-center min-h-screen bg-gray-100">
      <div className="z-10 bg-white rounded-md shadow-md w-full max-w-sm px-6 py-6">

        {/* Logo */}
        <div className="flex items-center justify-center mb-4">
          <img src={logo_login} alt="Logo" className="h-8" />
          <h1 className="text-lg font-bold text-gray-900 ml-2">UTTAR PRADESH TIMES</h1>
        </div>

        {/* Welcome */}
        <h2 className="text-xl font-semibold text-[#153060] mb-4">Welcome Back</h2>


        {/* Email */}
        <div className="mb-3">
          <label className="text-sm text-[#153060] font-medium">User Name</label>
          <input
            type="email"
            placeholder="hannah.green@test.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 border border-gray-300 bg-gray-50 p-2 w-full rounded-sm text-sm outline-none"
          />
        </div>

        {/* Password */}
        <div className="mb-3">
          <label className="text-sm text-[#153060] font-medium">Password</label>
          <input
            type="password"
            placeholder="Password123@"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 border border-gray-300 bg-gray-50 p-2 w-full rounded-sm text-sm outline-none"
          />
        </div>

        {/* Captcha */}
        <div className="mb-3">
          <label className="text-sm text-[#153060] font-medium">Security Text</label>
          <div className="flex items-center mt-1 space-x-2">
            <input
              type="text"
              placeholder="Enter the shown text"
              value={captcha}
              onChange={(e) => setCaptcha(e.target.value)}
              className="border border-gray-300 p-2 rounded-sm w-full text-sm outline-none"
            />
            <div className="captcha-box relative border border-gray-300 rounded-md bg-white px-3 py-2 text-lg font-extrabold text-black select-none">
              {captchaText}
            </div>

            <button
              onClick={() => setCaptchaText(generateCaptcha())}
              className="text-blue-600 hover:text-blue-800"
              title="Refresh Captcha"
            >
              <FiRefreshCw size={18} />
            </button>
          </div>
        </div>
        {error && (
          <div className="text-red-600 text-sm mb-3">
            {error}
          </div>
        )}
        {/* Checkbox */}
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={() => setRememberMe(!rememberMe)}
            className="mr-2 w-4 h-4 text-blue-600 bg-white border border-gray-300 rounded focus:ring-blue-500"
          />
          <label className="text-sm text-gray-700">Remember me on this computer</label>
        </div>

        {/* Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-[#1D3C78] text-white py-2 rounded-sm hover:bg-[#102952] transition disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Log in'}
        </button>
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

      {/* Background Image */}
      <img
        src={background_login}
        alt="Background"
        className="absolute bottom-0 left-0 w-full z-0 opacity-90"
      />
    </div>
  );
};
export default Login;
