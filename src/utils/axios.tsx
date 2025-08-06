import axios, {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

let isRefreshing = false;
let refreshSubscribers: (() => void)[] = [];

// --- Axios instance ---
const authApi: AxiosInstance = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true, // gửi cookie (accessToken + refreshToken) mỗi request
});

// --- Helper: chờ refresh xong ---
const subscribeTokenRefresh = (cb: () => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = () => {
  refreshSubscribers.forEach((cb) => cb());
  refreshSubscribers = [];
};

// --- Request interceptor ---
// Không cần thêm Authorization header vì token đã nằm trong cookie
authApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  return config;
});

// --- Response interceptor ---
authApi.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (err: AxiosError) => {
    const originalRequest = err.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh(() => {
            resolve(authApi(originalRequest));
          });
        });
      }

      isRefreshing = true;
      try {
        // Gọi refresh → BE set lại accessToken trong cookie
        await authApi.post("/auth/refresh");
        onRefreshed();
        isRefreshing = false;
        return authApi(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(err);
  }
);

export default authApi;
