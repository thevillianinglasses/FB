import React from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { authAPI } from '../api';

const AppLayout = ({ userName, userRole }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    authAPI.logout();
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    toast.success('Logged out successfully');
    navigate('/');
  };

  // Generate breadcrumbs based on current path
  const generateBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [];

    if (pathSegments.length === 0) return [];

    // Always start with main dashboard
    if (pathSegments[0] === 'admin') {
      breadcrumbs.push({
        name: 'Admin Dashboard',
        path: '/admin',
        isCurrent: pathSegments.length === 1
      });

      if (pathSegments.length > 1) {
        const subPage = pathSegments[1];
        const pageNames = {
          doctors: 'Doctor Management',
          users: 'User Management',
          departments: 'Department Management'
        };
        
        breadcrumbs.push({
          name: pageNames[subPage] || subPage.charAt(0).toUpperCase() + subPage.slice(1),
          path: `/admin/${subPage}`,
          isCurrent: true
        });
      }
    } else if (pathSegments[0] === 'reception') {
      breadcrumbs.push({
        name: 'Reception Dashboard',
        path: '/reception',
        isCurrent: true
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Persistent Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {/* Back to Admin Button - Show on admin sub-pages */}
              {location.pathname.includes('/admin/') && (
                <Link 
                  to="/admin"
                  className="flex items-center text-sm text-gray-600 hover:text-cornflower-blue transition-colors"
                >
                  <span className="mr-2">←</span>
                  Back to Admin
                </Link>
              )}
              
              <div>
                <h1 className="text-2xl font-bold text-charcoal-grey">
                  Unicare EHR System
                </h1>
                <p className="text-sm text-gray-600">Welcome, {userName} • {userRole}</p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="bg-coral-red hover:bg-opacity-80 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
          
          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <nav className="mt-4" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm">
                {breadcrumbs.map((breadcrumb, index) => (
                  <li key={breadcrumb.path} className="flex items-center">
                    {index > 0 && <span className="mx-2 text-gray-400">/</span>}
                    {breadcrumb.isCurrent ? (
                      <span className="text-charcoal-grey font-medium">
                        {breadcrumb.name}
                      </span>
                    ) : (
                      <Link
                        to={breadcrumb.path}
                        className="text-cornflower-blue hover:text-opacity-80 transition-colors"
                      >
                        {breadcrumb.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="px-6 py-6">
        <Outlet />
      </main>

      {/* Toast Notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#10B981',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#10B981',
            },
          },
          error: {
            style: {
              background: '#EF4444',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#EF4444',
            },
          },
        }}
      />
    </div>
  );
};

export default AppLayout;