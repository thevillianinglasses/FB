import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider, useAppContext } from './AppContext';
import { authAPI } from './api';
import toast from 'react-hot-toast';

// Components
import LoginPage from './LoginPage';
import AppLayout from './components/AppLayout';

// Import original dashboard components instead of pages
import AdminDashboard from './components/AdminDashboard';
import ReceptionDashboard from './components/ReceptionDashboard';
import LaboratoryDashboard from './components/LaboratoryDashboard';
import PharmacyDashboard from './components/pharmacy/PharmacyDashboard';
import NursingDashboard from './components/NursingDashboard';
import DoctorDashboard from './components/DoctorDashboard';

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

// Auth wrapper to handle authentication state
function AuthWrapper() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const isAuthenticated = authAPI.isAuthenticated();
      const storedRole = localStorage.getItem('user_role');
      const storedName = localStorage.getItem('user_name');
      
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
    localStorage.setItem('user_role', role);
    localStorage.setItem('user_name', name);
  };

  const getRoleBasedRoute = (role) => {
    const roleRoutes = {
      admin: '/admin',
      reception: '/reception', 
      pharmacy: '/pharmacy',
      laboratory: '/laboratory',
      nursing: '/nursing',
      doctor: '/doctor'
    };
    return roleRoutes[role] || '/admin';
  };

  const handleLogout = () => {
    authAPI.logout();
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_name');
    setIsLoggedIn(false);
    setUserRole('');
    setUserName('');
    toast.success('Logged out successfully');
  };

  // Protected Route Component - moved inside AuthWrapper to access state
  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!isLoggedIn) {
      return <Navigate to="/login" replace />;
    }
    
    if (allowedRoles && !allowedRoles.includes(userRole)) {
      toast.error('Access denied. Insufficient permissions.');
      return <Navigate to="/login" replace />;
    }
    
    return children;
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
        {/* Default redirect */}
        <Route 
          path="/" 
          element={
            <Navigate to={isLoggedIn ? getRoleBasedRoute(userRole) : '/login'} replace />
          } 
        />
        
        {/* Login Route */}
        <Route 
          path="/login" 
          element={
            isLoggedIn ? (
              <Navigate to={getRoleBasedRoute(userRole)} replace />
            ) : (
              <LoginPage onLoginSuccess={handleLoginSuccess} />
            )
          } 
        />
        
        {/* Admin Route */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard onLogout={handleLogout} userName={userName} />
            </ProtectedRoute>
          } 
        />
        
        {/* Reception Route */}
        <Route 
          path="/reception" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'reception']}>
              <ReceptionDashboard onLogout={handleLogout} userName={userName} />
            </ProtectedRoute>
          } 
        />
        
        {/* Laboratory Route */}
        <Route 
          path="/laboratory" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'laboratory']}>
              <LaboratoryDashboard onLogout={handleLogout} userName={userName} />
            </ProtectedRoute>
          } 
        />
        
        {/* Pharmacy Route */}
        <Route 
          path="/pharmacy" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'pharmacy']}>
              <PharmacyDashboard onLogout={handleLogout} userName={userName} />
            </ProtectedRoute>
          } 
        />
        
        {/* Nursing Route */}
        <Route 
          path="/nursing" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'nursing']}>
              <NursingDashboard onLogout={handleLogout} userName={userName} />
            </ProtectedRoute>
          } 
        />
        
        {/* Doctor Route */}
        <Route 
          path="/doctor" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'doctor']}>
              <DoctorDashboard onLogout={handleLogout} userName={userName} />
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