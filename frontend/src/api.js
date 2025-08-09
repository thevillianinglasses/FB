import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

// Create axios instance
const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
let authToken = localStorage.getItem('authToken');

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      // Redirect to login or trigger re-authentication
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: async (username, password) => {
    const response = await api.post('/api/auth/login', { username, password });
    if (response.data.access_token) {
      localStorage.setItem('authToken', response.data.access_token);
      authToken = response.data.access_token;
    }
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('authToken');
    authToken = null;
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  }
};

// Patients API
export const patientsAPI = {
  getAll: async () => {
    const response = await api.get('/api/patients');
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/api/patients/${id}`);
    return response.data;
  },
  
  create: async (patientData) => {
    const response = await api.post('/api/patients', patientData);
    return response.data;
  },
  
  update: async (id, patientData) => {
    const response = await api.put(`/api/patients/${id}`, patientData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/api/patients/${id}`);
    return response.data;
  }
};

// Doctors API
export const doctorsAPI = {
  getAll: async () => {
    const response = await api.get('/api/doctors');
    return response.data;
  },
  
  create: async (doctorData) => {
    const response = await api.post('/api/doctors', doctorData);
    return response.data;
  }
};

// Health check API
export const healthAPI = {
  check: async () => {
    const response = await api.get('/api/health');
    return response.data;
  }
};

export default api;