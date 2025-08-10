import React, { useState, useEffect } from 'react';
import { usersAPI } from '../api';

function AdminDashboard({ onLogout, userName }) {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'reception',
    department: '',
    email: '',
    phone: ''
  });

  const tabs = [
    { id: 'users', name: 'User Management', icon: '👥' },
    { id: 'reports', name: 'Reports', icon: '📊' },
    { id: 'settings', name: 'System Settings', icon: '⚙️' },
    { id: 'analytics', name: 'Analytics', icon: '📈' }
  ];

  useEffect(() => {
    // Only load users once when the component mounts or activeTab changes to users
    if (activeTab === 'users' && !loadedOnce) {
      loadUsers();
      setLoadedOnce(true);
    }
  }, [activeTab, loadedOnce]);

  const loadUsers = async () => {
    if (isLoading) return; // Prevent multiple simultaneous calls
    
    try {
      setIsLoading(true);
      console.log('🔄 Loading users for admin dashboard...');
      const usersData = await usersAPI.getAll();
      setUsers(usersData);
      console.log('✅ Users loaded successfully:', usersData.length);
    } catch (error) {
      console.error('❌ Error loading users:', error);
      alert(`Failed to load users: ${error.message || 'Please try again'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    if (isLoading) return; // Prevent multiple submissions
    
    try {
      setIsLoading(true);
      console.log('🔄 Creating new user:', newUser.username);
      
      // Validate required fields
      if (!newUser.username || !newUser.password || !newUser.full_name) {
        alert('Please fill in all required fields');
        return;
      }
      
      await usersAPI.create(newUser);
      console.log('✅ User created successfully');
      
      // Reset form and close modal
      setNewUser({
        username: '',
        password: '',
        full_name: '',
        role: 'reception',
        department: '',
        email: '',
        phone: ''
      });
      setShowCreateUser(false);
      
      // Reload users list
      await loadUsers();
      
    } catch (error) {
      console.error('❌ Error creating user:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Please try again';
      alert(`Error creating user: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (userId, status) => {
    if (isLoading) return; // Prevent multiple simultaneous calls
    
    try {
      setIsLoading(true);
      console.log(`🔄 Updating user ${userId} status to ${status}`);
      
      await usersAPI.updateStatus(userId, status);
      console.log('✅ User status updated successfully');
      
      // Reload users to reflect changes
      await loadUsers();
      
    } catch (error) {
      console.error('❌ Error updating user status:', error);
      alert(`Failed to update user status: ${error.message || 'Please try again'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      reception: 'bg-blue-100 text-blue-800',
      laboratory: 'bg-green-100 text-green-800',
      pharmacy: 'bg-yellow-100 text-yellow-800',
      nursing: 'bg-pink-100 text-pink-800',
      doctor: 'bg-indigo-100 text-indigo-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-charcoal-grey">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {userName}</p>
            </div>
            <button
              onClick={onLogout}
              className="bg-coral-red hover:bg-opacity-80 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="px-6">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-cornflower-blue text-cornflower-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="px-6 py-6">
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-charcoal-grey">User Management</h2>
              <button
                onClick={() => setShowCreateUser(true)}
                className="bg-cornflower-blue hover:bg-opacity-90 text-white font-semibold py-2 px-4 rounded-lg"
              >
                + Create New User
              </button>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role & Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                          <div className="text-sm text-gray-500">@{user.username}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                        <div className="text-sm text-gray-500 mt-1">{user.department}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                        <div className="text-sm text-gray-500">{user.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 text-xs font-semibold rounded-full ${
                          user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleStatusChange(user.id, user.status === 'active' ? 'inactive' : 'active')}
                          className={`${
                            user.status === 'active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {user.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-charcoal-grey mb-4">System Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900">Daily Summary</h3>
                <p className="text-blue-700 text-sm">Patient registrations, consultations, revenue</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900">Monthly Analytics</h3>
                <p className="text-green-700 text-sm">Department performance, trends</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-900">User Activity</h3>
                <p className="text-purple-700 text-sm">Login times, module usage</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-charcoal-grey mb-4">System Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium">Clinic Information</h3>
                  <p className="text-sm text-gray-600">Update clinic name, address, contact details</p>
                </div>
                <button className="text-cornflower-blue hover:underline">Configure</button>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium">Backup & Security</h3>
                  <p className="text-sm text-gray-600">Database backups, security settings</p>
                </div>
                <button className="text-cornflower-blue hover:underline">Manage</button>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium">Integration Settings</h3>
                  <p className="text-sm text-gray-600">SMS, email, payment gateway configuration</p>
                </div>
                <button className="text-cornflower-blue hover:underline">Setup</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-charcoal-grey mb-4">Analytics Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900">Total Users</h3>
                <p className="text-2xl font-bold text-blue-700">{users.length}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-green-900">Active Today</h3>
                <p className="text-2xl font-bold text-green-700">{users.filter(u => u.status === 'active').length}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-900">Departments</h3>
                <p className="text-2xl font-bold text-yellow-700">6</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-900">System Health</h3>
                <p className="text-2xl font-bold text-purple-700">100%</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Create User Modal */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-charcoal-grey mb-4">Create New User</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                >
                  <option value="reception">Reception</option>
                  <option value="laboratory">Laboratory</option>
                  <option value="pharmacy">Pharmacy</option>
                  <option value="nursing">Nursing</option>
                  <option value="doctor">Doctor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  value={newUser.department}
                  onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                />
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-cornflower-blue hover:bg-opacity-90 text-white font-semibold py-2 px-4 rounded-md disabled:opacity-50"
                >
                  {isLoading ? 'Creating...' : 'Create User'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateUser(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;