// import axios from 'axios';

// const api = axios.create({
//   baseURL: 'http://localhost:3000',
//   withCredentials: true,
// });


// api.interceptors.request.use(config => {
//   const token = sessionStorage.getItem('accessToken');
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });


// api.interceptors.response.use(
//   res => res,
//   async err => {
//     const originalRequest = err.config;

//     if (err.response?.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;

//       try {
//         const res = await api.post('/auth/refresh');

//         const newAccessToken = res.data.accessToken;
//         sessionStorage.setItem('accessToken', newAccessToken);
//         originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

//         return api(originalRequest);
//       } catch (refreshError) {

//         sessionStorage.clear();
//         window.location.href = '/login';
//         return Promise.reject(refreshError);
//       }
//     }

//     return Promise.reject(err);
//   }
// );



// export default api;
// utils/authApi.ts
import axios from "axios";

const authApi = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true, 
});

// Gắn accessToken từ sessionStorage vào header Authorization
authApi.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Tự động xử lý khi accessToken hết hạn
authApi.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    // Nếu 401 và chưa thử lại lần nào
    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const res = await authApi.post("/auth/refresh");

        const newAccessToken = res.data.accessToken;
        sessionStorage.setItem("accessToken", newAccessToken);

        // Gắn token mới vào request gốc và gửi lại
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return authApi(originalRequest);
      } catch (refreshError) {
        sessionStorage.clear();
        window.location.href = "/login"; // Điều hướng về trang login
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(err);
  }
);

export default authApi;
