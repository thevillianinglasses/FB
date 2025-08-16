import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function SafeUsersPage() {
  const [showAddUser, setShowAddUser] = useState(false);
  const [isLoading] = useState(false);

  // Mock users data for display
  const mockUsers = [
    {
      id: '1',
      username: 'admin',
      name: 'System Administrator',
      role: 'admin',
      phone: '',
      email: ''
    },
    {
      id: '2', 
      username: 'reception',
      name: 'Reception User',
      role: 'reception',
      phone: '',
      email: ''
    }
  ];

  const roles = [
    { value: 'admin', label: 'Administrator' },
    { value: 'reception', label: 'Reception' },
    { value: 'doctor', label: 'Doctor' },
    { value: 'laboratory', label: 'Laboratory' },
    { value: 'pharmacy', label: 'Pharmacy' },
    { value: 'nursing', label: 'Nursing' }
  ];

  const UserSkeleton = () => (
    <div className="p-6 hover:bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );

  const ErrorState = ({ message, onRetry }) => (
    <div className="text-center py-12">
      <div className="text-red-500 text-6xl mb-4">⚠️</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load users</h3>
      <p className="text-gray-500 mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Retry
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-gray-600">Add, edit, and manage system users and roles</p>
        </div>
        
        <button
          onClick={() => setShowAddUser(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 shadow-sm transition-colors"
        >
          <span>➕</span>
          <span>Add User</span>
        </button>
      </div>

      {/* Add User Form */}
      {showAddUser && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New User</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Enter password (min 6 characters)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setShowAddUser(false)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                <span>👤</span>
                <span>Add User</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">System Users</h3>
        </div>
        
        {isLoading ? (
          <div>
            {[1, 2, 3].map(i => <UserSkeleton key={i} />)}
          </div>
        ) : mockUsers && mockUsers.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {mockUsers.map((user) => (
              <div key={user.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {user.name ? user.name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{user.name || 'N/A'}</h4>
                      <p className="text-sm text-gray-500">@{user.username}</p>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'doctor' ? 'bg-blue-100 text-blue-800' :
                          user.role === 'reception' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Edit
                    </button>
                    <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center">
            <div className="text-gray-400 text-4xl mb-2">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No users found</h3>
            <p className="text-gray-500">Start by adding your first system user.</p>
          </div>
        )}
      </div>

      {/* Back to Admin Button */}
      <div className="mt-8">
        <Link
          to="/admin"
          className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <span>←</span>
          <span>Back to Admin Dashboard</span>
        </Link>
      </div>
    </div>
  );
}

export default SafeUsersPage;