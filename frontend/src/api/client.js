import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const checkHealth = async () => {
  try {
    const response = await apiClient.get("/api/health");
    return {
      ok: true,
      data: response.data,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      data: null,
      error: error.message || "Failed to reach backend API",
    };
  }
};

export const fetchSystemInfo = async () => {
  try {
    const response = await apiClient.get("/api/system/info");
    return {
      ok: true,
      data: response.data,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      data: null,
      error: error.message || "Failed to fetch system info",
    };
  }
};

export default apiClient;
