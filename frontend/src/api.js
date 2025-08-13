import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

// Create axios instance
const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
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
    }
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  }
};

// Users API (Admin only)
export const usersAPI = {
  getAll: async () => {
    const response = await api.get('/api/users');
    return response.data;
  },
  
  create: async (userData) => {
    const response = await api.post('/api/users', userData);
    return response.data;
  },
  
  updateStatus: async (userId, status) => {
    const response = await api.put(`/api/users/${userId}/status?status=${status}`);
    return response.data;
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
  },
  
  getVitals: async (patientId) => {
    const response = await api.get(`/api/patients/${patientId}/vitals`);
    return response.data;
  },
  
  getConsultations: async (patientId) => {
    const response = await api.get(`/api/patients/${patientId}/consultations`);
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

// Laboratory API
export const labAPI = {
  getTests: async () => {
    const response = await api.get('/api/lab/tests');
    return response.data;
  },
  
  addTest: async (testData) => {
    const response = await api.post('/api/lab/tests', testData);
    return response.data;
  },
  
  getOrders: async () => {
    const response = await api.get('/api/lab/orders');
    return response.data;
  },
  
  createOrder: async (orderData) => {
    const response = await api.post('/api/lab/orders', orderData);
    return response.data;
  },
  
  updateOrderStatus: async (orderId, status) => {
    const response = await api.put(`/api/lab/orders/${orderId}/status?status=${status}`);
    return response.data;
  },
  
  getResults: async () => {
    const response = await api.get('/api/lab/results');
    return response.data;
  },
  
  addResult: async (resultData) => {
    const response = await api.post('/api/lab/results', resultData);
    return response.data;
  }
};

// Pharmacy API
export const pharmacyAPI = {
  getMedications: async () => {
    const response = await api.get('/api/pharmacy/medications');
    return response.data;
  },
  
  addMedication: async (medicationData) => {
    const response = await api.post('/api/pharmacy/medications', medicationData);
    return response.data;
  },
  
  updateStock: async (medId, quantity) => {
    const response = await api.put(`/api/pharmacy/medications/${medId}/stock?quantity=${quantity}`);
    return response.data;
  },
  
  getPrescriptions: async () => {
    const response = await api.get('/api/pharmacy/prescriptions');
    return response.data;
  },
  
  createPrescription: async (prescriptionData) => {
    const response = await api.post('/api/pharmacy/prescriptions', prescriptionData);
    return response.data;
  },
  
  dispensePrescription: async (prescriptionId) => {
    const response = await api.put(`/api/pharmacy/prescriptions/${prescriptionId}/dispense`);
    return response.data;
  }
};

// Nursing API
export const nursingAPI = {
  getVitals: async () => {
    const response = await api.get('/api/nursing/vitals');
    return response.data;
  },
  
  recordVitals: async (vitalsData) => {
    const response = await api.post('/api/nursing/vitals', vitalsData);
    return response.data;
  },
  
  getProcedures: async () => {
    const response = await api.get('/api/nursing/procedures');
    return response.data;
  },
  
  recordProcedure: async (procedureData) => {
    const response = await api.post('/api/nursing/procedures', procedureData);
    return response.data;
  }
};

// EMR/Doctor API
export const emrAPI = {
  getConsultations: async () => {
    const response = await api.get('/api/emr/consultations');
    return response.data;
  },
  
  createConsultation: async (consultationData) => {
    const response = await api.post('/api/emr/consultations', consultationData);
    return response.data;
  }
};

// Billing API
export const billingAPI = {
  getBills: async () => {
    const response = await api.get('/api/billing/bills');
    return response.data;
  },
  
  createBill: async (billData) => {
    const response = await api.post('/api/billing/bills', billData);
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

// Appointments API
export const appointmentsAPI = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.date) params.append('date', filters.date);
    if (filters.doctor_id) params.append('doctor_id', filters.doctor_id);
    if (filters.status) params.append('status', filters.status);
    
    const url = params.toString() ? `/api/appointments?${params.toString()}` : '/api/appointments';
    const response = await api.get(url);
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/api/appointments/${id}`);
    return response.data;
  },
  
  create: async (appointmentData) => {
    const response = await api.post('/api/appointments', appointmentData);
    return response.data;
  },
  
  update: async (id, appointmentData) => {
    const response = await api.put(`/api/appointments/${id}`, appointmentData);
    return response.data;
  },
  
  updateStatus: async (id, status) => {
    const response = await api.put(`/api/appointments/${id}/status?status=${status}`);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/api/appointments/${id}`);
    return response.data;
  },
  
  getToday: async () => {
    const response = await api.get('/api/appointments/today');
    return response.data;
  },
  
  getByDoctor: async (doctorId, date = null) => {
    const url = date 
      ? `/api/appointments/doctor/${doctorId}?date=${date}`
      : `/api/appointments/doctor/${doctorId}`;
    const response = await api.get(url);
    return response.data;
  }
};

export default api;