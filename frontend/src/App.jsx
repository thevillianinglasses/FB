import React, { useState } from 'react';
import { AppProvider } from './AppContext';
import LoginPage from './LoginPage';
import { authAPI } from './api';

// Import dashboard components
import ReceptionDashboard from './components/ReceptionDashboard';
import AdminDashboard from './components/AdminDashboard';
import LaboratoryDashboard from './components/LaboratoryDashboard';
import PharmacyDashboard from './components/PharmacyDashboard';
import NursingDashboard from './components/NursingDashboard';
import DoctorDashboard from './components/DoctorDashboard';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  const handleLogin = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      setUser(response.user);
      setIsAuthenticated(true);
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Preview header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-6 text-center">
            <h1 className="text-3xl font-bold text-blue-600">Unicare Polyclinic EHR System</h1>
            <p className="text-gray-600 mt-2">🏥 Complete Electronic Health Records Management</p>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 py-8">
          <LoginPage onLogin={handleLogin} />
        </div>
      </div>
    );
  }

  // Role-based dashboard rendering
  const renderDashboard = () => {
    switch (user?.role) {
      case 'admin':
        return <AdminDashboard onLogout={handleLogout} userName={user.username} />;
      case 'reception':
        return <ReceptionDashboard onLogout={handleLogout} userName={user.username} />;
      case 'laboratory':
        return <LaboratoryDashboard onLogout={handleLogout} userName={user.username} />;
      case 'pharmacy':
        return <PharmacyDashboard onLogout={handleLogout} userName={user.username} />;
      case 'nursing':
        return <NursingDashboard onLogout={handleLogout} userName={user.username} />;
      case 'doctor':
        return <DoctorDashboard onLogout={handleLogout} userName={user.username} />;
      default:
        return <AdminDashboard onLogout={handleLogout} userName={user.username} />;
    }
  };

  return (
    <AppProvider>
      {renderDashboard()}
    </AppProvider>
  );
}

export default App;