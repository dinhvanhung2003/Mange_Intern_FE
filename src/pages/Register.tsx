import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import background from '../assets/background_login.png';
export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async () => {
    setError('');
    if (password !== confirm) {
      return setError('Mật khẩu không khớp');
    }
    if (!email || !password || !confirm) {
      return setError('Vui lòng điền đầy đủ thông tin');
    }
    try {
      await axios.post('http://localhost:3000/auth/register', {
        email,
        password,
        role: 'intern', 
      });
      alert('Đăng ký thành công!');
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng ký thất bại');
    }
  };

  return (
    <div className="h-screen flex justify-center items-center bg-gray-50 relative">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md z-10">
        <h1 className="text-xl font-bold text-center text-gray-800 mb-2">UTTAR PRADESH TIMES</h1>
        <p className="text-center text-lg font-semibold text-blue-800 mb-6">Create an account</p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="border p-2 rounded w-full mb-3"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="border p-2 rounded w-full mb-3"
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          className="border p-2 rounded w-full mb-4"
        />
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <button
          onClick={handleRegister}
          className="bg-blue-800 text-white w-full py-2 rounded hover:bg-blue-900"
        >
          Register
        </button>
        <p className="text-sm text-center mt-4">
          Already have an account?{' '}
          <span
            className="text-blue-600 cursor-pointer hover:underline"
            onClick={() => navigate('/login')}
          >
            Log in
          </span>
        </p>
      </div>

      <div className="absolute bottom-0 w-full">
        <img src={background} alt="Cityline" className="w-full opacity-80" />
      </div>
    </div>
  );
}
