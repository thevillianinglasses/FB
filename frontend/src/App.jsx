import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './LoginPage';
import SafeAppLayout from './components/SafeAppLayout';
import AdminDashboard from './pages/AdminDashboard';
import DoctorsPage from './pages/DoctorsPage';
import UsersPage from './pages/UsersPage';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState(null);
  
  useEffect(() => {
    try {
      const storedRole = localStorage.getItem('userRole');
      const storedName = localStorage.getItem('userName');
      setUserRole(storedRole);
      setUserName(storedName);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLoginSuccess = (role, name) => {
    localStorage.setItem('userRole', role);
    localStorage.setItem('userName', name);
    setUserRole(role);
    setUserName(name);
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('authToken');
    setUserRole(null);
    setUserName(null);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cornflower-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-cornflower-blue mb-2">Unicare Polyclinic</h1>
          <p className="text-gray-600">Initializing System...</p>
        </div>
      </div>
    );
  }

  // If not logged in, show login page
  if (!userRole) {
    return (
      <ErrorBoundary>
        <Router>
          <Routes>
            <Route path="*" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
          </Routes>
        </Router>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <SafeAppLayout
          user={{ role: userRole, name: userName }}
          onLogout={handleLogout}
        >
          <Routes>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/doctors" element={<DoctorsPage />} />
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="*" element={<Navigate to="/admin" />} />
          </Routes>
        </SafeAppLayout>
      </Router>
    </ErrorBoundary>
  );
}

export default App;