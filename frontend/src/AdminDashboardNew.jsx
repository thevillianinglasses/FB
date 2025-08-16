import React, { useState, useEffect } from 'react';
import { useAppContext } from './AppContext';
import DoctorsDirectory from './DoctorsDirectory';

function AdminDashboardNew() {
  const { doctors, patients, users, loadDoctors, loadPatients, loadUsers } = useAppContext();
  const [currentScreen, setCurrentScreen] = useState('dashboard'); // 'dashboard' | 'doctors'
  const [currentUser] = useState({ name: 'Admin', avatar: '👤' });

  useEffect(() => {
    loadDoctors();
    loadPatients();
    loadUsers();
  }, []);

  // Get current date and time in IST
  const getCurrentDateTime = () => {
    const now = new Date();
    const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)); // Add 5.5 hours for IST
    const date = istTime.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
    const time = istTime.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    return `${date} ${time} IST`;
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
  };

  const handleDoctorsInfoClick = (e) => {
    e.preventDefault();
    // Show hover tip on single click
    const tooltip = e.currentTarget.querySelector('.hover-tooltip');
    if (tooltip) {
      tooltip.style.display = 'block';
      setTimeout(() => {
        tooltip.style.display = 'none';
      }, 2000);
    }
  };

  const handleDoctorsInfoDoubleClick = () => {
    setCurrentScreen('doctors');
  };

  if (currentScreen === 'doctors') {
    return <DoctorsDirectory onBack={() => setCurrentScreen('dashboard')} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Bar */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left: Logo */}
            <div>
              <h1 className="text-2xl font-bold text-charcoal-grey">UNICARE POLYCLINIC</h1>
              <p className="text-sm text-gray-600">Care Crafted For You</p>
            </div>
            
            {/* Right: User Avatar and Logout */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-cornflower-blue rounded-full flex items-center justify-center text-white text-sm">
                  {currentUser.avatar}
                </div>
                <span className="text-sm font-medium text-gray-700">{currentUser.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Primary Tiles - 4 cards in a row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* User Management */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                <p className="text-sm text-gray-500">Users</p>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">User Management</h3>
            <p className="text-sm text-gray-600">Manage staff accounts, roles, and permissions</p>
            <div className="mt-4 flex items-center text-cornflower-blue group-hover:translate-x-1 transition-transform">
              <span className="text-sm font-medium">Manage Users</span>
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Reports */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
                <p className="text-sm text-gray-500">Reports</p>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Reports</h3>
            <p className="text-sm text-gray-600">Analytics, patient reports, and insights</p>
            <div className="mt-4 flex items-center text-cornflower-blue group-hover:translate-x-1 transition-transform">
              <span className="text-sm font-medium">View Reports</span>
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* System Settings */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⚙️</span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">5</p>
                <p className="text-sm text-gray-500">Settings</p>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">System Settings</h3>
            <p className="text-sm text-gray-600">Configure system preferences and policies</p>
            <div className="mt-4 flex items-center text-cornflower-blue group-hover:translate-x-1 transition-transform">
              <span className="text-sm font-medium">Settings</span>
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Analytics */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📈</span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">92%</p>
                <p className="text-sm text-gray-500">Uptime</p>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
            <p className="text-sm text-gray-600">Performance metrics and system analytics</p>
            <div className="mt-4 flex items-center text-cornflower-blue group-hover:translate-x-1 transition-transform">
              <span className="text-sm font-medium">View Analytics</span>
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Doctors Info - Full-width Blue Call-to-Action */}
        <div 
          className="relative bg-cornflower-blue hover:bg-blue-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 cursor-pointer group"
          onClick={handleDoctorsInfoClick}
          onDoubleClick={handleDoctorsInfoDoubleClick}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Doctors Info</h3>
              <p className="text-blue-100">Manage doctor profiles, departments, and scheduling</p>
              <div className="mt-3 flex items-center">
                <span className="text-sm text-blue-100 mr-2">{doctors.length} doctors registered</span>
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-xs text-blue-100 ml-2">Active</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-3xl">👨‍⚕️</span>
              </div>
              <svg 
                className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
          
          {/* Hover Tooltip */}
          <div className="hover-tooltip absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-gray-900 text-white text-sm px-3 py-2 rounded-md shadow-lg hidden z-10">
            Double-click to open
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
          </div>
        </div>
      </main>

      {/* Footer Status Strip */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>{getCurrentDateTime()}</span>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <span>Build v2.1.0</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>System Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default AdminDashboardNew;