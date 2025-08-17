import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider, useAppContext } from './AppContext';
import { authAPI } from './api';
import toast from 'react-hot-toast';

// Components
import LoginPage from './LoginPage';
import AppLayout from './components/AppLayout';

// Pages
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import DoctorManagement from './pages/DoctorManagement';
import ReceptionDashboard from './pages/ReceptionDashboard';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const userRole = localStorage.getItem('userRole');
  const isAuthenticated = authAPI.isAuthenticated();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    toast.error('Access denied. Insufficient permissions.');
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Auth wrapper to handle authentication state
function AuthWrapper() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const isAuthenticated = authAPI.isAuthenticated();
      const storedRole = localStorage.getItem('userRole');
      const storedName = localStorage.getItem('userName');
      
      setIsLoggedIn(isAuthenticated);
      setUserRole(storedRole || '');
      setUserName(storedName || '');
      setIsCheckingAuth(false);
    };
    
    checkAuth();
  }, []);

  const handleLoginSuccess = (role, name) => {
    setIsLoggedIn(true);
    setUserRole(role);
    setUserName(name);
    localStorage.setItem('userRole', role);
    localStorage.setItem('userName', name);
  };

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cornflower-blue mx-auto"></div>
          <p className="mt-4 text-charcoal-grey">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Login Route */}
        <Route 
          path="/login" 
          element={
            isLoggedIn ? (
              <Navigate to={userRole === 'admin' ? '/admin' : '/reception'} replace />
            ) : (
              <LoginPage onLoginSuccess={handleLoginSuccess} />
            )
          } 
        />
        
        {/* Default redirect */}
        <Route 
          path="/" 
          element={
            <Navigate to={isLoggedIn ? (userRole === 'admin' ? '/admin' : '/reception') : '/login'} replace />
          } 
        />
        
        {/* Admin Routes */}
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AppLayout userName={userName} userRole={userRole}>
                <Routes>
                  <Route path="/" element={<AdminDashboard />} />
                  <Route path="/users" element={<UserManagement />} />
                  <Route path="/doctors" element={<DoctorManagement />} />
                  {/* Add more admin routes as needed */}
                  <Route path="*" element={<Navigate to="/admin" replace />} />
                </Routes>
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* Reception Route */}
        <Route 
          path="/reception" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'reception']}>
              <AppLayout userName={userName} userRole={userRole}>
                <ReceptionDashboard />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* Other role routes can be added here */}
        <Route 
          path="/laboratory" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'laboratory']}>
              <AppLayout userName={userName} userRole={userRole}>
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-charcoal-grey">Laboratory Dashboard</h2>
                  <p className="text-gray-600 mt-2">Coming Soon...</p>
                </div>
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/pharmacy" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'pharmacy']}>
              <AppLayout userName={userName} userRole={userRole}>
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-charcoal-grey">Pharmacy Dashboard</h2>
                  <p className="text-gray-600 mt-2">Coming Soon...</p>
                </div>
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/nursing" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'nursing']}>
              <AppLayout userName={userName} userRole={userRole}>
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-charcoal-grey">Nursing Dashboard</h2>
                  <p className="text-gray-600 mt-2">Coming Soon...</p>
                </div>
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/doctor" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'doctor']}>
              <AppLayout userName={userName} userRole={userRole}>
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-charcoal-grey">Doctor Dashboard</h2>
                  <p className="text-gray-600 mt-2">Coming Soon...</p>
                </div>
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <AuthWrapper />
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;