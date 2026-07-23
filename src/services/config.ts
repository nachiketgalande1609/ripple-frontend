import axios from "axios";
import { useGlobalStore } from "../store/store";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
    },
});

// 🔁 Add dynamic headers using a request interceptor
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    const userId = useGlobalStore.getState().user?.id || "";

    if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
    }

    config.headers["X-CURRENT-USER-ID"] = userId;

    return config;
});

// 🔒 Log out automatically when the server returns 401 (revoked/expired token)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            useGlobalStore.getState().setUser(null);
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export default api;
