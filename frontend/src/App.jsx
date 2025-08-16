import React, { useState, useEffect } from 'react';
import { authAPI } from './api';
import LoginPage from './LoginPage';

// Simple working components
import ReceptionDashboard from './components/ReceptionDashboard';
import AdminDashboard from './components/AdminDashboard';
import LaboratoryDashboard from './components/LaboratoryDashboard';
import PharmacyDashboard from './components/PharmacyDashboard';
import NursingDashboard from './components/NursingDashboard';
import DoctorDashboard from './components/DoctorDashboard';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
        handleLogout();
      }
    }
    setIsLoading(false);
  };

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

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cornflower-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Simple role-based rendering (working version)
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
    <div className="App">
      {renderDashboard()}
    </div>
  );
}

export default App;