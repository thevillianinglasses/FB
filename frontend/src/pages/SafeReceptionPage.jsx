import React from 'react';
import { Link } from 'react-router-dom';

function SafeReceptionPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Reception Dashboard</h1>
        <p className="mt-1 text-gray-600">Patient registration and management</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">➕</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">--</h3>
              <p className="text-sm text-gray-600">Today's Registrations</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">--</h3>
              <p className="text-sm text-gray-600">Appointments</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⏳</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">--</h3>
              <p className="text-sm text-gray-600">Waiting Patients</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Functions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center text-white text-2xl mx-auto mb-4">
              ➕
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">New OPD Registration</h3>
            <p className="text-sm text-gray-600">Register new patients and assign OPD numbers</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center text-white text-2xl mx-auto mb-4">
              👥
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All Patients</h3>
            <p className="text-sm text-gray-600">View and manage all patient records</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center text-white text-2xl mx-auto mb-4">
              📋
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">24-Hour Patient Log</h3>
            <p className="text-sm text-gray-600">Track today's patient activities</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl mx-auto mb-4">
              📅
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Appointment Scheduling</h3>
            <p className="text-sm text-gray-600">Schedule and manage patient appointments</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-600 rounded-xl flex items-center justify-center text-white text-2xl mx-auto mb-4">
              💰
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Billing System</h3>
            <p className="text-sm text-gray-600">Process payments and generate invoices</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="text-center">
            <div className="w-16 h-16 bg-teal-600 rounded-xl flex items-center justify-center text-white text-2xl mx-auto mb-4">
              📞
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Patient Communication</h3>
            <p className="text-sm text-gray-600">Send SMS and email notifications</p>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="mt-12 text-center text-gray-500">
        <p className="text-sm">
          © 2025 Unicare Polyclinic • Reception Module
        </p>
        <p className="text-xs mt-1">
          System Status: 🟢 Online • {new Date().toLocaleDateString('en-IN')}
        </p>
      </div>
    </div>
  );
}

export default SafeReceptionPage;