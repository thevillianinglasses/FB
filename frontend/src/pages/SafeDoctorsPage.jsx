import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function SafeDoctorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading] = useState(false);

  // Mock data for skeleton state
  const mockDepartments = [
    { id: '1', name: 'GENERAL MEDICINE', doctors: [] },
    { id: '2', name: 'CARDIOLOGY', doctors: [] },
    { id: '3', name: 'PEDIATRICS', doctors: [] }
  ];

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded-md mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded-md"></div>
              <div className="h-4 bg-gray-200 rounded-md w-3/4"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const ErrorState = ({ message, onRetry }) => (
    <div className="text-center py-12">
      <div className="text-red-500 text-6xl mb-4">⚠️</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load doctors</h3>
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
          <h1 className="text-2xl font-bold text-gray-900">Doctors</h1>
          <p className="mt-1 text-gray-600">Manage doctor profiles and departments</p>
        </div>
        
        {/* Search and Add Doctor */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search doctors or departments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              🔍
            </div>
          </div>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 shadow-sm transition-colors"
          >
            <span>➕</span>
            <span>Add Doctor</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && <LoadingSkeleton />}

      {/* Content - Always show departments even if empty */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockDepartments.map((department) => (
            <div key={department.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Department Header */}
              <div className="bg-blue-600 text-white px-6 py-4">
                <h3 className="text-lg font-semibold">{department.name}</h3>
                <p className="text-blue-100 text-sm">
                  {department.doctors?.length || 0} doctor{department.doctors?.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              {/* Doctors List */}
              <div className="p-6">
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">👨‍⚕️</div>
                  <p className="text-gray-500 text-sm mb-3">No doctors assigned</p>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Add first doctor
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {/* Add New Department Card */}
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <div className="p-8 text-center">
              <div className="text-gray-400 text-4xl mb-4">+</div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Add New Department</h3>
              <p className="text-sm text-gray-500 mb-4">Create a new medical department</p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-sm font-medium transition-colors">
                Create Department
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State for Search */}
      {!isLoading && searchQuery && mockDepartments.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-500">
            No doctors or departments match your search for "{searchQuery}".
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear search
          </button>
        </div>
      )}

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

export default SafeDoctorsPage;