import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

let authToken = localStorage.getItem("clauseiq_token") || null;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30s timeout for file processing
});

apiClient.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

export const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    localStorage.setItem("clauseiq_token", token);
  } else {
    localStorage.removeItem("clauseiq_token");
  }
};

export const getAuthToken = () => authToken;

export const checkHealth = async () => {
  try {
    const response = await apiClient.get("/api/health");
    return { ok: true, data: response.data, error: null };
  } catch (error) {
    return { ok: false, data: null, error: error.message || "Failed to reach backend API" };
  }
};

export const fetchSystemInfo = async () => {
  try {
    const response = await apiClient.get("/api/system/info");
    return { ok: true, data: response.data, error: null };
  } catch (error) {
    return { ok: false, data: null, error: error.message };
  }
};

export const loginUser = async (email, password) => {
  try {
    const response = await apiClient.post("/api/auth/login", { email, password });
    if (response.data?.access_token) {
      setAuthToken(response.data.access_token);
    }
    return { ok: true, data: response.data, error: null };
  } catch (error) {
    return {
      ok: false,
      data: null,
      error: error.response?.data?.detail || error.message || "Authentication failed",
    };
  }
};

export const fetchContracts = async () => {
  try {
    const response = await apiClient.get("/api/contracts");
    return { ok: true, data: response.data, error: null };
  } catch (error) {
    return { ok: false, data: null, error: error.message };
  }
};

export const fetchContractDetail = async (contractId) => {
  try {
    const response = await apiClient.get(`/api/contracts/${contractId}`);
    return { ok: true, data: response.data, error: null };
  } catch (error) {
    return { ok: false, data: null, error: error.message };
  }
};

export const uploadContractFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post("/api/contracts/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { ok: true, data: response.data, error: null };
  } catch (error) {
    return {
      ok: false,
      data: null,
      error: error.response?.data?.detail || error.message || "Upload failed",
    };
  }
};

export const deleteContractApi = async (contractId) => {
  try {
    await apiClient.delete(`/api/contracts/${contractId}`);
    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};

export const markContractCompletedApi = async (contractId) => {
  try {
    const response = await apiClient.post(`/api/contracts/${contractId}/complete`);
    return { ok: true, data: response.data, error: null };
  } catch (error) {
    return {
      ok: false,
      data: null,
      error: error.response?.data?.detail || error.message || "Failed to mark contract as completed",
    };
  }
};


export const fetchObligations = async () => {
  try {
    const response = await apiClient.get("/api/obligations");
    return { ok: true, data: response.data, error: null };
  } catch (error) {
    return { ok: false, data: null, error: error.message };
  }
};

export const fetchAuditLogs = async () => {
  try {
    const response = await apiClient.get("/api/audit-logs");
    return { ok: true, data: response.data, error: null };
  } catch (error) {
    return { ok: false, data: null, error: error.message };
  }
};

export const clearAllContractsApi = async () => {
  try {
    const response = await apiClient.post("/api/contracts/clear-all");
    return { ok: true, data: response.data, error: null };
  } catch (error) {
    return { ok: false, data: null, error: error.message };
  }
};

export const fetchAIStatus = async () => {
  try {
    const response = await apiClient.get("/api/settings/ai-status");
    return { ok: true, data: response.data, error: null };
  } catch (error) {
    return { ok: false, data: null, error: error.message };
  }
};

export const saveAIConfig = async (config) => {
  try {
    const response = await apiClient.post("/api/settings/ai-config", config);
    return { ok: true, data: response.data, error: null };
  } catch (error) {
    return {
      ok: false,
      data: null,
      error: error.response?.data?.detail || error.message || "Failed to update AI configuration",
    };
  }
};

export const fetchRisks = async () => {
  try {
    const response = await apiClient.get("/api/risks");
    return { ok: true, data: response.data, error: null };
  } catch (error) {
    return { ok: false, data: null, error: error.message };
  }
};

export default apiClient;

