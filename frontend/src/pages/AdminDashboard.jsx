import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDoctors, useDepartments } from '../hooks/useData';

function AdminDashboard() {
  const navigate = useNavigate();
  const { data: doctors = [] } = useDoctors();
  const { data: departments = [] } = useDepartments();

  const handleDoctorsClick = () => {
    navigate('/admin/doctors');
  };

  const handleUsersClick = () => {
    navigate('/admin/users');
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    const date = istTime.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Kolkata'
    });
    const time = istTime.toLocaleTimeString('en-IN', {
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });
    return { date, time };
  };

  const { date, time } = getCurrentDateTime();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome to Unicare Polyclinic Management System
        </p>
        <div className="mt-4 text-sm text-gray-500">
          <p>{date}</p>
          <p>{time} IST</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏥</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{departments.length}</h3>
              <p className="text-sm text-gray-600">Departments</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👨‍⚕️</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{doctors.length}</h3>
              <p className="text-sm text-gray-600">Doctors</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">0</h3>
              <p className="text-sm text-gray-600">Today's Appointments</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">--</h3>
              <p className="text-sm text-gray-600">Active Users</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Action Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* User Management */}
        <div 
          onClick={handleUsersClick}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 hover:shadow-md transition-all duration-300 cursor-pointer group"
        >
          <div className="flex items-center">
            <div className="w-16 h-16 bg-cornflower-blue rounded-xl flex items-center justify-center text-white text-2xl group-hover:scale-105 transition-transform">
              👥
            </div>
            <div className="ml-6">
              <h3 className="text-xl font-semibold text-gray-900 group-hover:text-cornflower-blue transition-colors">
                User Management
              </h3>
              <p className="text-gray-600 mt-1">
                Add, edit, and manage system users and roles
              </p>
            </div>
          </div>
        </div>

        {/* Reports */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 hover:shadow-md transition-all duration-300 cursor-pointer group">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center text-white text-2xl group-hover:scale-105 transition-transform">
              📊
            </div>
            <div className="ml-6">
              <h3 className="text-xl font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                Reports
              </h3>
              <p className="text-gray-600 mt-1">
                Generate and view system reports and analytics
              </p>
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 hover:shadow-md transition-all duration-300 cursor-pointer group">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center text-white text-2xl group-hover:scale-105 transition-transform">
              ⚙️
            </div>
            <div className="ml-6">
              <h3 className="text-xl font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                System Settings
              </h3>
              <p className="text-gray-600 mt-1">
                Configure system preferences and settings
              </p>
            </div>
          </div>
        </div>

        {/* Analytics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 hover:shadow-md transition-all duration-300 cursor-pointer group">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-orange-600 rounded-xl flex items-center justify-center text-white text-2xl group-hover:scale-105 transition-transform">
              📈
            </div>
            <div className="ml-6">
              <h3 className="text-xl font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                Analytics
              </h3>
              <p className="text-gray-600 mt-1">
                View system usage and performance metrics
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Doctors Info Call-to-Action */}
      <div 
        onClick={handleDoctorsClick}
        className="bg-gradient-to-r from-cornflower-blue to-blue-600 rounded-xl p-8 cursor-pointer hover:shadow-lg transition-all duration-300 group"
      >
        <div className="flex items-center justify-between text-white">
          <div>
            <h3 className="text-2xl font-bold mb-2">Doctors Info</h3>
            <p className="text-blue-100 text-lg">
              Manage doctor profiles, departments, and medical staff
            </p>
            <div className="mt-4 flex items-center space-x-6 text-blue-100">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🏥</span>
                <span>{departments.length} Departments</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">👨‍⚕️</span>
                <span>{doctors.length} Doctors</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center group-hover:bg-opacity-30 transition-all">
              <span className="text-white text-xl group-hover:translate-x-1 transition-transform">→</span>
            </div>
            <p className="text-sm text-blue-100 mt-2">Click to manage</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-gray-500">
        <p className="text-sm">
          © 2025 Unicare Polyclinic • EHR System v2.0
        </p>
        <p className="text-xs mt-1">
          Last updated: {new Date().toLocaleDateString('en-IN')} • System Status: 🟢 Online
        </p>
      </div>
    </div>
  );
}

export default AdminDashboard;