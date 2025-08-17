import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

// Create axios instance with interceptors
const api = axios.create({
  baseURL: BACKEND_URL,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_name');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (username, password) => {
    const response = await api.post('/api/auth/login', { username, password });
    
    // Store the JWT token in localStorage
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }
    
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_name');
  },
  getCurrentUser: () => {
    return {
      token: localStorage.getItem('access_token'),
      role: localStorage.getItem('user_role'),
      name: localStorage.getItem('user_name'),
    };
  },
  isAuthenticated: () => {
    const token = localStorage.getItem('access_token');
    return !!token;
  },
};

// User Management API
export const usersAPI = {
  getUsers: async () => {
    const response = await api.get('/api/users');
    return response.data;
  },
  createUser: async (userData) => {
    const response = await api.post('/api/users', userData);
    return response.data;
  },
  updateUser: async (userId, userData) => {
    const response = await api.put(`/api/users/${userId}`, userData);
    return response.data;
  },
  deleteUser: async (userId) => {
    const response = await api.delete(`/api/users/${userId}`);
    return response.data;
  },
};

// Departments API
export const departmentsAPI = {
  getDepartments: async () => {
    const response = await api.get('/api/departments');
    return response.data;
  },
  createDepartment: async (departmentData) => {
    const response = await api.post('/api/departments', departmentData);
    return response.data;
  },
  updateDepartment: async (departmentId, departmentData) => {
    const response = await api.put(`/api/departments/${departmentId}`, departmentData);
    return response.data;
  },
  deleteDepartment: async (departmentId) => {
    const response = await api.delete(`/api/departments/${departmentId}`);
    return response.data;
  },
};

// Doctors API
export const doctorsAPI = {
  getDoctors: async () => {
    const response = await api.get('/api/doctors');
    return response.data;
  },
  createDoctor: async (doctorData) => {
    const response = await api.post('/api/doctors', doctorData);
    return response.data;
  },
  updateDoctor: async (doctorId, doctorData) => {
    const response = await api.put(`/api/doctors/${doctorId}`, doctorData);
    return response.data;
  },
  deleteDoctor: async (doctorId) => {
    const response = await api.delete(`/api/doctors/${doctorId}`);
    return response.data;
  },
  getDoctorsByDepartment: async (departmentId) => {
    const response = await api.get(`/api/departments/${departmentId}/doctors`);
    return response.data;
  },
};

// Patients API
export const patientsAPI = {
  getPatients: async () => {
    const response = await api.get('/api/patients');
    return response.data;
  },
  createPatient: async (patientData) => {
    const response = await api.post('/api/patients', patientData);
    return response.data;
  },
  updatePatient: async (patientId, patientData) => {
    const response = await api.put(`/api/patients/${patientId}`, patientData);
    return response.data;
  },
  deletePatient: async (patientId) => {
    const response = await api.delete(`/api/patients/${patientId}`);
    return response.data;
  },
};

// Appointments API
export const appointmentsAPI = {
  getAppointments: async (params = {}) => {
    const response = await api.get('/api/appointments', { params });
    return response.data;
  },
  createAppointment: async (appointmentData) => {
    const response = await api.post('/api/appointments', appointmentData);
    return response.data;
  },
  updateAppointment: async (appointmentId, appointmentData) => {
    const response = await api.put(`/api/appointments/${appointmentId}`, appointmentData);
    return response.data;
  },
  deleteAppointment: async (appointmentId) => {
    const response = await api.delete(`/api/appointments/${appointmentId}`);
    return response.data;
  },
  checkInAppointment: async (appointmentId) => {
    const response = await api.post(`/api/appointments/${appointmentId}/check-in`);
    return response.data;
  },
};

// Lab Tests API
export const labTestsAPI = {
  getTests: async () => {
    const response = await api.get('/api/lab/tests');
    return response.data;
  },
  createTest: async (testData) => {
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
  },
  payBill: async (billId, paymentData) => {
    const response = await api.post(`/api/billing/bills/${billId}/pay`, paymentData);
    return response.data;
  },
};

// EMR API
export const emrAPI = {
  getConsultations: async () => {
    const response = await api.get('/api/emr/consultations');
    return response.data;
  },
  createConsultation: async (consultationData) => {
    const response = await api.post('/api/emr/consultations', consultationData);
    return response.data;
  },
  getPatientHistory: async (patientId) => {
    const response = await api.get(`/api/emr/patients/${patientId}/history`);
    return response.data;
  },
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
  },
};

// Pharmacy API
export const pharmacyAPI = {
  // Suppliers
  getSuppliers: async () => {
    const response = await api.get('/api/pharmacy/suppliers');
    return response.data;
  },
  createSupplier: async (supplierData) => {
    const response = await api.post('/api/pharmacy/suppliers', supplierData);
    return response.data;
  },
  
  // Products
  getProducts: async (params = {}) => {
    const response = await api.get('/api/pharmacy/products', { params });
    return response.data;
  },
  createProduct: async (productData) => {
    const response = await api.post('/api/pharmacy/products', productData);
    return response.data;
  },
  setChemicalSchedule: async (chemicalName, schedule) => {
    const response = await api.post(`/api/pharmacy/chemicals/${encodeURIComponent(chemicalName)}/schedule/${schedule}`);
    return response.data;
  },
  
  // Racks
  getRacks: async () => {
    const response = await api.get('/api/pharmacy/racks');
    return response.data;
  },
  createRack: async (rackData) => {
    const response = await api.post('/api/pharmacy/racks', rackData);
    return response.data;
  },
  
  // Purchases
  getPurchases: async (params = {}) => {
    const response = await api.get('/api/pharmacy/purchases', { params });
    return response.data;
  },
  createPurchase: async (purchaseData) => {
    const response = await api.post('/api/pharmacy/purchases', purchaseData);
    return response.data;
  },
  approvePurchase: async (purchaseId) => {
    const response = await api.post(`/api/pharmacy/purchases/${purchaseId}/approve`);
    return response.data;
  },
  rejectPurchase: async (purchaseId, reason) => {
    const response = await api.post(`/api/pharmacy/purchases/${purchaseId}/reject`, { reason });
    return response.data;
  },
  
  // Sales
  getSales: async (params = {}) => {
    const response = await api.get('/api/pharmacy/sales', { params });
    return response.data;
  },
  createSale: async (saleData) => {
    const response = await api.post('/api/pharmacy/sales', saleData);
    return response.data;
  },
  getSaleDetails: async (saleId) => {
    const response = await api.get(`/api/pharmacy/sales/${saleId}`);
    return response.data;
  },
  editSale: async (saleId, editNotes) => {
    const response = await api.put(`/api/pharmacy/sales/${saleId}/edit`, { edit_notes: editNotes });
    return response.data;
  },
  searchPatientsByPhone: async (phone) => {
    const response = await api.get(`/api/pharmacy/sales/search/patients`, { params: { phone } });
    return response.data;
  },
  
  // Inventory
  getCurrentStock: async (params = {}) => {
    const response = await api.get('/api/pharmacy/inventory/stock', { params });
    return response.data;
  },
  getNearExpiryItems: async (params = {}) => {
    const response = await api.get('/api/pharmacy/inventory/near-expiry', { params });
    return response.data;
  },
  getBatchMovements: async (batchId) => {
    const response = await api.get(`/api/pharmacy/inventory/movements/${batchId}`);
    return response.data;
  },
  moveBatchToRack: async (batchId, rackId) => {
    const response = await api.post('/api/pharmacy/inventory/move-batch', { batch_id: batchId, new_rack_id: rackId });
    return response.data;
  },
  getInventoryValuation: async () => {
    const response = await api.get('/api/pharmacy/inventory/valuation');
    return response.data;
  },
  
  // Returns
  getReturns: async (params = {}) => {
    const response = await api.get('/api/pharmacy/returns', { params });
    return response.data;
  },
  createReturn: async (returnData) => {
    const response = await api.post('/api/pharmacy/returns', returnData);
    return response.data;
  },
  approveReturn: async (returnId) => {
    const response = await api.post(`/api/pharmacy/returns/${returnId}/approve`);
    return response.data;
  },
  searchSaleForReturn: async (billNo) => {
    const response = await api.get(`/api/pharmacy/returns/search/sale/${billNo}`);
    return response.data;
  },
  
  // Disposals
  getDisposals: async (params = {}) => {
    const response = await api.get('/api/pharmacy/disposals', { params });
    return response.data;
  },
  createDisposal: async (disposalData) => {
    const response = await api.post('/api/pharmacy/disposals', disposalData);
    return response.data;
  },
  getDisposalSummary: async (params = {}) => {
    const response = await api.get('/api/pharmacy/disposals/summary', { params });
    return response.data;
  },
  getExpiredBatches: async () => {
    const response = await api.get('/api/pharmacy/disposals/expired-batches');
    return response.data;
  },
  
  // Convenience methods
  getRecentSales: async () => {
    const response = await api.get('/api/pharmacy/sales', { params: { limit: 10 } });
    return response.data;
  },
};

export default api;