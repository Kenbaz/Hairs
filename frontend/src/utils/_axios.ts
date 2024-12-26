import axios, { AxiosError, InternalAxiosRequestConfig, AxiosRequestConfig } from "axios";
import { store } from "@/src/libs/_redux/store";
import { logout, refreshAccessToken } from "../libs/_redux/authSlice";


interface RetryableAxiosRequestConfig extends AxiosRequestConfig { 
  _retry?: boolean;
}

interface QueueItem {
  resolve: (value: string | PromiseLike<string>) => void;
  reject: (reason?: unknown) => void;
}


// interface RefreshTokenResponse { 
//   access: string;
// }

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const axiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for handling cookies
});


// Keep track of refresh token attempts
let isRefreshing = false;
let failedQueue: QueueItem[] = [];


const processQueue = (
  error: Error | null,
  token: string | null = null
): void => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });
  failedQueue = [];
};


// Add request interceptor to attach token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableAxiosRequestConfig;

    // If there is no config, reject immediately
    if (!originalRequest) {
      return Promise.reject(error);
    };

    // Avoid infinite loops
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // Handle 401 errors
    if (error.response?.status === 401) {
      if (isRefreshing) {
        // if already refreshing, queue this request
        try {
          const token = await new Promise<string>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${token}`,
          };
          return axiosInstance(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      isRefreshing = true;
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token
        const action = await store.dispatch(refreshAccessToken()).unwrap();
        const newToken = action.access;

        // Update headers and retry the original request
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${newToken}`,
        };
        processQueue(null, newToken);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError instanceof Error ? refreshError : new Error('Token refresh failed'), null);

        // If refresh fails, logout the user
        store.dispatch(logout());
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
