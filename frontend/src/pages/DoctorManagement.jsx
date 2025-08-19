import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { doctorsAPI, departmentsAPI } from '../api';

const DoctorManagement = () => {
  const [showCreateDoctor, setShowCreateDoctor] = useState(false);
  const [showCreateDepartment, setShowCreateDepartment] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [newDoctor, setNewDoctor] = useState({
    name: '',
    department_id: '',
    specialty: '',
    qualification: '',
    registration_number: '',
    default_fee: '150',
    phone: '',
    email: '',
    schedule: '',
    room_number: ''
  });
  const [newDepartment, setNewDepartment] = useState({
    name: '',
    description: '',
    location: '',
    phone: '',
    email: ''
  });

  const queryClient = useQueryClient();

  // Fetch departments
  const { 
    data: departments = [], 
    isLoading: departmentsLoading 
  } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentsAPI.getAll,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch doctors
  const { 
    data: doctors = [], 
    isLoading: doctorsLoading 
  } = useQuery({
    queryKey: ['doctors'],
    queryFn: doctorsAPI.getAll,
    staleTime: 5 * 60 * 1000,
  });

  // Create doctor mutation
  const createDoctorMutation = useMutation({
    mutationFn: doctorsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['doctors']);
      toast.success('Doctor created successfully!');
      setShowCreateDoctor(false);
      setNewDoctor({
        name: '',
        department_id: '',
        specialty: '',
        qualification: '',
        registration_number: '',
        default_fee: '150',
        phone: '',
        email: '',
        schedule: '',
        room_number: ''
      });
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to create doctor';
      toast.error(`Error: ${errorMessage}`);
    }
  });

  // Create department mutation
  const createDepartmentMutation = useMutation({
    mutationFn: departmentsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['departments']);
      toast.success('Department created successfully!');
      setShowCreateDepartment(false);
      setNewDepartment({
        name: '',
        description: '',
        location: '',
        phone: '',
        email: ''
      });
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to create department';
      toast.error(`Error: ${errorMessage}`);
    }
  });

  // Delete doctor mutation
  const deleteDoctorMutation = useMutation({
    mutationFn: doctorsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['doctors']);
      toast.success('Doctor deleted successfully!');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to delete doctor';
      toast.error(`Error: ${errorMessage}`);
    }
  });

  const handleCreateDoctor = (e) => {
    e.preventDefault();
    
    if (!newDoctor.name || !newDoctor.department_id) {
      toast.error('Please fill in name and department');
      return;
    }
    
    createDoctorMutation.mutate(newDoctor);
  };

  const handleCreateDepartment = (e) => {
    e.preventDefault();
    
    if (!newDepartment.name) {
      toast.error('Please provide department name');
      return;
    }
    
    createDepartmentMutation.mutate(newDepartment);
  };

  const handleDeleteDoctor = (doctorId) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      deleteDoctorMutation.mutate(doctorId);
    }
  };

  // Inline doctor creation for specific department
  const handleInlineCreateDoctor = (departmentId) => {
    setNewDoctor(prev => ({ ...prev, department_id: departmentId }));
    setShowCreateDoctor(true);
  };

  // Get department name by ID
  const getDepartmentName = (departmentId) => {
    const dept = departments.find(d => d.id === departmentId);
    return dept ? dept.name : 'No Department';
  };

  // Filter doctors by selected department
  const filteredDoctors = selectedDepartment === 'all' 
    ? doctors 
    : doctors.filter(doctor => doctor.department_id === selectedDepartment);

  const isLoading = departmentsLoading || doctorsLoading;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-grey">Doctor & Department Management</h1>
          <p className="text-gray-600">Manage doctors, departments, and organizational structure</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateDepartment(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            + New Department
          </button>
          <button
            onClick={() => setShowCreateDoctor(true)}
            className="bg-cornflower-blue hover:bg-opacity-90 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            + New Doctor
          </button>
        </div>
      </div>

      {/* Filter by Department */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filter by Department:</label>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Departments Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((department) => {
          const deptDoctors = doctors.filter(doctor => doctor.department_id === department.id);
          return (
            <div key={department.id} className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-charcoal-grey">{department.name}</h3>
                <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {deptDoctors.length} doctors
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{department.description}</p>
              <div className="text-xs text-gray-500 mb-4">
                <p>📍 {department.location}</p>
                <p>📞 {department.phone}</p>
              </div>
              <button
                onClick={() => handleInlineCreateDoctor(department.id)}
                className="w-full text-sm bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 px-3 rounded border transition-colors"
              >
                + Add Doctor to {department.name}
              </button>
            </div>
          );
        })}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cornflower-blue mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading doctors and departments...</p>
        </div>
      )}

      {/* Doctors Table */}
      {!isLoading && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-charcoal-grey">
              {selectedDepartment === 'all' ? 'All Doctors' : `${getDepartmentName(selectedDepartment)} Doctors`}
              <span className="ml-2 text-sm text-gray-500">({filteredDoctors.length})</span>
            </h3>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doctor Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department & Specialty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact & Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fee & Schedule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDoctors.map((doctor) => (
                <tr key={doctor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{doctor.name}</div>
                      <div className="text-sm text-gray-500">{doctor.qualification}</div>
                      <div className="text-xs text-gray-400">Reg: {doctor.registration_number}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{getDepartmentName(doctor.department_id)}</div>
                    <div className="text-sm text-gray-500">{doctor.specialty}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{doctor.phone}</div>
                    <div className="text-sm text-gray-500">{doctor.email}</div>
                    <div className="text-xs text-gray-400">Room: {doctor.room_number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">₹{doctor.default_fee}</div>
                    <div className="text-sm text-gray-500">{doctor.schedule}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDeleteDoctor(doctor.id)}
                      disabled={deleteDoctorMutation.isLoading}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Doctor Modal */}
      {showCreateDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-charcoal-grey mb-4">
              {newDoctor.department_id ? `Add Doctor to ${getDepartmentName(newDoctor.department_id)}` : 'Create New Doctor'}
            </h3>
            <form onSubmit={handleCreateDoctor} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newDoctor.name}
                  onChange={(e) => setNewDoctor({...newDoctor, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  value={newDoctor.department_id}
                  onChange={(e) => setNewDoctor({...newDoctor, department_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
                <input
                  type="text"
                  value={newDoctor.specialty}
                  onChange={(e) => setNewDoctor({...newDoctor, specialty: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                <input
                  type="text"
                  value={newDoctor.qualification}
                  onChange={(e) => setNewDoctor({...newDoctor, qualification: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                <input
                  type="text"
                  value={newDoctor.registration_number}
                  onChange={(e) => setNewDoctor({...newDoctor, registration_number: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Fee (₹)</label>
                <input
                  type="text"
                  value={newDoctor.default_fee}
                  onChange={(e) => setNewDoctor({...newDoctor, default_fee: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={newDoctor.phone}
                  onChange={(e) => setNewDoctor({...newDoctor, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newDoctor.email}
                  onChange={(e) => setNewDoctor({...newDoctor, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                <input
                  type="text"
                  value={newDoctor.room_number}
                  onChange={(e) => setNewDoctor({...newDoctor, room_number: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Schedule</label>
                <input
                  type="text"
                  value={newDoctor.schedule}
                  onChange={(e) => setNewDoctor({...newDoctor, schedule: e.target.value})}
                  placeholder="e.g., Mon-Fri 9AM-5PM"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                />
              </div>
              
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={createDoctorMutation.isLoading}
                  className="flex-1 bg-cornflower-blue hover:bg-opacity-90 text-white font-semibold py-2 px-4 rounded-md disabled:opacity-50 transition-colors"
                >
                  {createDoctorMutation.isLoading ? 'Creating...' : 'Create Doctor'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateDoctor(false);
                    setNewDoctor({
                      name: '',
                      department_id: '',
                      specialty: '',
                      qualification: '',
                      registration_number: '',
                      default_fee: '150',
                      phone: '',
                      email: '',
                      schedule: '',
                      room_number: ''
                    });
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Department Modal */}
      {showCreateDepartment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-charcoal-grey mb-4">Create New Department</h3>
            <form onSubmit={handleCreateDepartment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newDepartment.name}
                  onChange={(e) => setNewDepartment({...newDepartment, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newDepartment.description}
                  onChange={(e) => setNewDepartment({...newDepartment, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={newDepartment.location}
                  onChange={(e) => setNewDepartment({...newDepartment, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={newDepartment.phone}
                  onChange={(e) => setNewDepartment({...newDepartment, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newDepartment.email}
                  onChange={(e) => setNewDepartment({...newDepartment, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                />
              </div>
              
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={createDepartmentMutation.isLoading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md disabled:opacity-50 transition-colors"
                >
                  {createDepartmentMutation.isLoading ? 'Creating...' : 'Create Department'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateDepartment(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-md transition-colors"
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
};

export default DoctorManagement;