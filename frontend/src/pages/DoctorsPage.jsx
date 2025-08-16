import React, { useState } from 'react';
import { useDoctors, useDepartments, useCreateDepartment, useCreateDoctor, useDeleteDoctor } from '../hooks/useData';
import DepartmentModal from '../components/DepartmentModal';
import DoctorModal from '../components/DoctorModal';
import toast from 'react-hot-toast';

function DoctorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);

  // Data hooks
  const { data: departments = [], isLoading: departmentsLoading } = useDepartments();
  const { data: allDoctors = [], isLoading: doctorsLoading } = useDoctors();
  
  // Mutation hooks
  const createDepartmentMutation = useCreateDepartment();
  const createDoctorMutation = useCreateDoctor();
  const deleteDoctorMutation = useDeleteDoctor();

  const isLoading = departmentsLoading || doctorsLoading;

  // Group doctors by department
  const departmentGroups = departments.map(dept => ({
    ...dept,
    doctors: allDoctors.filter(doctor => doctor.departmentId === dept.id)
  }));

  // Filter departments based on search
  const filteredDepartments = departmentGroups.filter(dept => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const departmentMatch = dept.name.toLowerCase().includes(query);
    const doctorMatch = dept.doctors.some(doctor => 
      doctor.name.toLowerCase().includes(query) ||
      doctor.degree.toLowerCase().includes(query)
    );
    
    return departmentMatch || doctorMatch;
  });

  // Handle creating new department
  const handleCreateDepartment = (departmentData) => {
    createDepartmentMutation.mutate(departmentData, {
      onSuccess: () => {
        setShowDepartmentModal(false);
      }
    });
  };

  // Handle creating new doctor
  const handleCreateDoctor = (doctorData) => {
    createDoctorMutation.mutate(doctorData, {
      onSuccess: () => {
        setShowDoctorModal(false);
        setEditingDoctor(null);
      }
    });
  };

  // Handle editing doctor
  const handleEditDoctor = (doctor) => {
    setEditingDoctor(doctor);
    setShowDoctorModal(true);
  };

  // Handle deleting doctor
  const handleDeleteDoctor = (doctorId) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      deleteDoctorMutation.mutate(doctorId);
    }
  };

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
              className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-transparent"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              🔍
            </div>
          </div>
          <button
            onClick={() => {
              setEditingDoctor(null);
              setShowDoctorModal(true);
            }}
            className="bg-cornflower-blue hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 shadow-sm transition-colors"
          >
            <span>➕</span>
            <span>Add Doctor</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && <LoadingSkeleton />}

      {/* Departments Grid */}
      {!isLoading && filteredDepartments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDepartments.map((department) => (
            <div key={department.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Department Header */}
              <div className="bg-cornflower-blue text-white px-6 py-4">
                <h3 className="text-lg font-semibold">{department.name}</h3>
                <p className="text-blue-100 text-sm">
                  {department.doctors.length} doctor{department.doctors.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              {/* Doctors List */}
              <div className="p-6">
                {department.doctors.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-2">👨‍⚕️</div>
                    <p className="text-gray-500 text-sm mb-3">No doctors assigned</p>
                    <button
                      onClick={() => {
                        setEditingDoctor({ departmentId: department.id });
                        setShowDoctorModal(true);
                      }}
                      className="text-cornflower-blue hover:text-blue-700 text-sm font-medium"
                    >
                      Add first doctor
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {department.doctors.slice(0, 3).map((doctor) => (
                      <div key={doctor.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{doctor.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{doctor.degree}</p>
                            {doctor.phone && (
                              <div className="flex items-center text-xs text-gray-500 mt-2">
                                <span className="mr-3">📞 {doctor.phone}</span>
                                <span>Fee: ₹{doctor.fee}</span>
                              </div>
                            )}
                            {doctor._pending && (
                              <div className="flex items-center text-xs text-orange-600 mt-1">
                                <span className="mr-1">⏱️</span>
                                <span>Syncing...</span>
                              </div>
                            )}
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => handleEditDoctor(doctor)}
                              className="text-cornflower-blue hover:text-blue-700 text-sm font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteDoctor(doctor.id)}
                              className="text-red-600 hover:text-red-700 text-sm font-medium"
                              disabled={doctor._pending}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {department.doctors.length > 3 && (
                      <div className="text-center py-2">
                        <span className="text-sm text-gray-500">
                          +{department.doctors.length - 3} more doctor{department.doctors.length - 3 !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Add New Department Card */}
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <div className="p-8 text-center">
              <div className="text-gray-400 text-4xl mb-4">+</div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Add New Department</h3>
              <p className="text-sm text-gray-500 mb-4">Create a new medical department</p>
              <button
                onClick={() => setShowDepartmentModal(true)}
                className="bg-cornflower-blue hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-sm font-medium transition-colors"
                disabled={createDepartmentMutation.isLoading}
              >
                {createDepartmentMutation.isLoading ? 'Creating...' : 'Create Department'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State for Search */}
      {!isLoading && searchQuery && filteredDepartments.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-500">
            No doctors or departments match your search for "{searchQuery}".
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-4 text-cornflower-blue hover:text-blue-700 font-medium"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Modals */}
      {showDepartmentModal && (
        <DepartmentModal
          onClose={() => setShowDepartmentModal(false)}
          onSave={handleCreateDepartment}
          isLoading={createDepartmentMutation.isLoading}
        />
      )}

      {showDoctorModal && (
        <DoctorModal
          doctor={editingDoctor}
          departments={departments}
          onClose={() => {
            setShowDoctorModal(false);
            setEditingDoctor(null);
          }}
          onSave={handleCreateDoctor}
          isLoading={createDoctorMutation.isLoading}
        />
      )}
    </div>
  );
}

export default DoctorsPage;