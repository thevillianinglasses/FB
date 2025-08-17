import React from 'react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const adminModules = [
    {
      id: 'users',
      name: 'User Management',
      description: 'Manage system users, roles, and permissions',
      icon: '👥',
      path: '/admin/users',
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      id: 'doctors',
      name: 'Doctor Management',
      description: 'Manage doctors, departments, and specialties',
      icon: '👨‍⚕️',
      path: '/admin/doctors',
      color: 'bg-green-50 border-green-200 hover:bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      id: 'departments',
      name: 'Department Management',
      description: 'Manage hospital departments and organizational structure',
      icon: '🏥',
      path: '/admin/departments',
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      id: 'reports',
      name: 'Reports & Analytics',
      description: 'System reports, analytics, and insights',
      icon: '📊',
      path: '/admin/reports',
      color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
      iconColor: 'text-yellow-600'
    },
    {
      id: 'settings',
      name: 'System Settings',
      description: 'Configure system settings and preferences',
      icon: '⚙️',
      path: '/admin/settings',
      color: 'bg-gray-50 border-gray-200 hover:bg-gray-100',
      iconColor: 'text-gray-600'
    },
    {
      id: 'backup',
      name: 'Backup & Security',
      description: 'Database backups and security management',
      icon: '🔒',
      path: '/admin/backup',
      color: 'bg-red-50 border-red-200 hover:bg-red-100',
      iconColor: 'text-red-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div>
        <h1 className="text-3xl font-bold text-charcoal-grey mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">
          Manage all aspects of the Unicare EHR system from this central location.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
              <p className="text-2xl font-semibold text-charcoal-grey">--</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">👨‍⚕️</span>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Active Doctors</h3>
              <p className="text-2xl font-semibold text-charcoal-grey">--</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-2xl">🏥</span>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Departments</h3>
              <p className="text-2xl font-semibold text-charcoal-grey">--</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-2xl">💡</span>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">System Health</h3>
              <p className="text-2xl font-semibold text-green-600">Good</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Modules Grid */}
      <div>
        <h2 className="text-xl font-semibold text-charcoal-grey mb-4">
          Administration Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminModules.map((module) => (
            <Link
              key={module.id}
              to={module.path}
              className={`block p-6 rounded-lg border-2 transition-all duration-200 ${module.color}`}
            >
              <div className="flex items-start space-x-4">
                <div className={`text-3xl ${module.iconColor}`}>
                  {module.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-charcoal-grey mb-2">
                    {module.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {module.description}
                  </p>
                  <div className="mt-3 flex items-center text-sm text-cornflower-blue">
                    <span>Manage</span>
                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h3 className="text-lg font-semibold text-charcoal-grey mb-4">
          Recent System Activity
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">System startup completed</span>
            </div>
            <span className="text-xs text-gray-400">Just now</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Database connected successfully</span>
            </div>
            <span className="text-xs text-gray-400">2 min ago</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Default departments initialized</span>
            </div>
            <span className="text-xs text-gray-400">5 min ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;