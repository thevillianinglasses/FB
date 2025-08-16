import React, { useState, useEffect } from 'react';
import { AppProvider, useAppContext } from './AppContext';
import { authAPI } from './api';
import LoginPage from './LoginPage';

// Import all module components
import ReceptionDashboard from './components/ReceptionDashboard';
import LaboratoryDashboard from './components/LaboratoryDashboard';
import PharmacyDashboard from './components/PharmacyDashboard';
import NursingDashboard from './components/NursingDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import AdminDashboardNew from './AdminDashboardNew';

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const { error, clearError, loadInitialData } = useAppContext();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if user is already authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const isAuthenticated = authAPI.isAuthenticated();
      const storedRole = localStorage.getItem('userRole');
      const storedName = localStorage.getItem('userName');
      
      setIsLoggedIn(isAuthenticated);
      setUserRole(storedRole || '');
      setUserName(storedName || '');
      
      // Don't auto-load data here to prevent infinite loops
      // Let individual components load their own data as needed
      
      setIsCheckingAuth(false);
    };
    
    checkAuth();
  }, []); // Remove loadInitialData from dependencies

  const handleLoginSuccess = async (role, name) => {
    setIsLoggedIn(true);
    setUserRole(role);
    setUserName(name);
    localStorage.setItem('userRole', role);
    localStorage.setItem('userName', name);
    
    // Don't auto-load data here to prevent infinite loops
    // Let individual dashboard components load their own data as needed
  };

  const handleLogout = () => {
    authAPI.logout();
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    setIsLoggedIn(false);
    setUserRole('');
    setUserName('');
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

  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Role-based dashboard rendering
  const renderDashboard = () => {
    switch (userRole) {
      case 'admin':
        return <AdminDashboardNew onLogout={handleLogout} userName={userName} />;
      case 'reception':
        return <ReceptionDashboard onLogout={handleLogout} userName={userName} />;
      case 'laboratory':
        return <LaboratoryDashboard onLogout={handleLogout} userName={userName} />;
      case 'pharmacy':
        return <PharmacyDashboard onLogout={handleLogout} userName={userName} />;
      case 'nursing':
        return <NursingDashboard onLogout={handleLogout} userName={userName} />;
      case 'doctor':
        return <DoctorDashboard onLogout={handleLogout} userName={userName} />;
      default:
        return (
          <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-charcoal-grey mb-4">Access Denied</h2>
              <p className="text-gray-600 mb-4">Invalid user role: {userRole}</p>
              <button
                onClick={handleLogout}
                className="bg-coral-red hover:bg-opacity-80 text-white font-semibold py-2 px-4 rounded"
              >
                Logout
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Global Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <button
            onClick={clearError}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {renderDashboard()}
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;