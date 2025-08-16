import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

function SafeAppLayout({ user, onLogout }) {
  const location = useLocation();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      onLogout();
    }
  };

  // Generate breadcrumbs based on current path
  const generateBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [];

    if (pathSegments.length === 0) return breadcrumbs;

    // Always start with Admin Dashboard for admin routes
    if (pathSegments[0] === 'admin') {
      breadcrumbs.push({
        label: 'Admin Dashboard',
        path: '/admin'
      });

      if (pathSegments[1] === 'doctors') {
        breadcrumbs.push({
          label: 'Doctors',
          path: '/admin/doctors'
        });
      } else if (pathSegments[1] === 'users') {
        breadcrumbs.push({
          label: 'Users',
          path: '/admin/users'
        });
      }
    } else if (pathSegments[0] === 'reception') {
      breadcrumbs.push({
        label: 'Reception Dashboard',
        path: '/reception'
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();
  const showBackToAdmin = location.pathname.includes('/admin/') && location.pathname !== '/admin';

  return (
    <div className="min-h-screen bg-gray-50" style={{ background: '#FFFFFF', color: '#36454F' }}>
      {/* Persistent Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Left side - Logo and Title */}
            <div className="flex items-center space-x-4">
              <Link to="/admin" className="flex items-center">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                  U
                </div>
                <div className="ml-3">
                  <h1 className="text-xl font-bold text-gray-900">Unicare Polyclinic</h1>
                  <p className="text-sm text-gray-500">Electronic Health Records</p>
                </div>
              </Link>
            </div>

            {/* Right side - User info and Logout */}
            <div className="flex items-center space-x-4">
              {user && (
                <>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user.name || user.username}</p>
                    <p className="text-xs text-gray-500 capitalize">
                      {user.role === 'admin' ? 'System Administrator' : user.role}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumbs and Back Button */}
      {breadcrumbs.length > 0 && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-3">
              {/* Breadcrumbs */}
              <nav className="flex items-center space-x-2 text-sm">
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={crumb.path}>
                    <Link
                      to={crumb.path}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {crumb.label}
                    </Link>
                    {index < breadcrumbs.length - 1 && (
                      <span className="text-gray-400">›</span>
                    )}
                  </React.Fragment>
                ))}
              </nav>

              {/* Back to Admin Button */}
              {showBackToAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  <span>←</span>
                  <span>Back to Admin</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

export default SafeAppLayout;