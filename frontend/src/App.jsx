import React, { Suspense, useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider } from './AppContext';

// Import components
import ErrorBoundary from './components/ErrorBoundary';
import BootScreen from './components/BootScreen';
import SafeAppLayout from './components/SafeAppLayout';
import DiagnosticsOverlay from './components/DiagnosticsOverlay';
import NotFound from './components/NotFound';
import LoginPage from './LoginPage';

// Lazy load pages for better performance
const SafeAdminDashboard = React.lazy(() => import('./pages/SafeAdminDashboard'));
const SafeDoctorsPage = React.lazy(() => import('./pages/SafeDoctorsPage'));
const SafeUsersPage = React.lazy(() => import('./pages/SafeUsersPage'));
const SafeReceptionPage = React.lazy(() => import('./pages/SafeReceptionPage'));

import { authAPI } from './api';

// Create React Query client with safe defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
    },
    mutations: {
      retry: 1,
    },
  },
});

function AuthGuard({ children, user, onLogin }) {
  const [authState, setAuthState] = useState('checking'); // 'checking' | 'authenticated' | 'unauthenticated'
  const [redirectCount, setRedirectCount] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  // Prevent infinite redirects
  useEffect(() => {
    if (redirectCount > 3) {
      console.error('Too many redirects detected');
      setAuthState('error');
    }
  }, [redirectCount]);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setAuthState('authenticated');
        return parsedUser;
      } else {
        setAuthState('unauthenticated');
        return null;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthState('unauthenticated');
      return null;
    }
  };

  if (authState === 'checking') {
    return <BootScreen message="Checking authentication..." />;
  }

  if (authState === 'error') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Authentication Error</h2>
          <p className="text-gray-600 mb-6">Too many redirects detected. Please refresh the page.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return <LoginPage onLogin={onLogin} />;
  }

  return children;
}

function AppContent() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
    queryClient.clear();
    window.location.hash = '/';
  };

  // Initial auth check
  useEffect(() => {
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
  }, []);

  return (
    <HashRouter>
      <AuthGuard user={user} onLogin={handleLogin}>
        <SafeAppLayout user={user} onLogout={handleLogout}>
          <Suspense fallback={<BootScreen />}>
            <Routes>
              {/* Default route */}
              <Route path="/" element={<Navigate to="/admin" replace />} />
              
              {/* Admin routes */}
              <Route path="/admin" element={<SafeAdminDashboard />} />
              <Route path="/admin/doctors" element={<SafeDoctorsPage />} />
              <Route path="/admin/users" element={<SafeUsersPage />} />
              
              {/* Reception routes */}
              <Route path="/reception" element={<SafeReceptionPage />} />
              
              {/* Fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </SafeAppLayout>
      </AuthGuard>
    </HashRouter>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <div style={{ background: '#FFFFFF', color: '#36454F', minHeight: '100vh' }}>
            <AppContent />
            <DiagnosticsOverlay />
          </div>
        </AppProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;