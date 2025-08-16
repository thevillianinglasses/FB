import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider } from './AppContext';
import AppLayout from './components/AppLayout';
import LoginPage from './LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import DoctorsPage from './pages/DoctorsPage';
import UsersPage from './pages/UsersPage';
import ReceptionDashboard from './components/ReceptionDashboard';
import { authAPI } from './api';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 60 seconds
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

function AppContent() {
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
    // Clear React Query cache on logout
    queryClient.clear();
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

  return (
    <Router>
      <Routes>
        {/* Admin Routes */}
        {user?.role === 'admin' && (
          <Route 
            path="/admin" 
            element={<AppLayout user={user} onLogout={handleLogout} />}
          >
            <Route index element={<AdminDashboard />} />
            <Route path="doctors" element={<DoctorsPage />} />
            <Route path="users" element={<UsersPage />} />
          </Route>
        )}
        
        {/* Reception Routes */}
        {user?.role === 'reception' && (
          <>
            <Route 
              path="/reception" 
              element={<AppLayout user={user} onLogout={handleLogout} />}
            >
              <Route index element={<ReceptionDashboard />} />
            </Route>
          </>
        )}

        {/* Default redirects based on role */}
        <Route 
          path="/" 
          element={
            <Navigate 
              to={
                user?.role === 'admin' ? '/admin' : 
                user?.role === 'reception' ? '/reception' :
                '/admin'
              } 
              replace 
            />
          } 
        />
        
        {/* Fallback redirect */}
        <Route 
          path="*" 
          element={
            <Navigate 
              to={
                user?.role === 'admin' ? '/admin' : 
                user?.role === 'reception' ? '/reception' :
                '/admin'
              } 
              replace 
            />
          } 
        />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;