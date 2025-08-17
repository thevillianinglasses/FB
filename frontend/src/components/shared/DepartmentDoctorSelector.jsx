import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { departmentsAPI, doctorsAPI } from '../../api';

const DepartmentDoctorSelector = ({
  selectedDepartment,
  setSelectedDepartment,
  selectedDoctor,
  setSelectedDoctor,
  onDoctorChange,
  required = false,
  className = ""
}) => {
  const [showCreateDoctor, setShowCreateDoctor] = useState(false);
  const [newDoctor, setNewDoctor] = useState({
    name: '',
    department_id: '',
    specialty: '',
    qualification: '',
    default_fee: '150',
    phone: '',
    email: '',
    room_number: ''
  });

  const queryClient = useQueryClient();

  // Fetch departments using React Query
  const { 
    data: departments = [], 
    isLoading: departmentsLoading 
  } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentsAPI.getAll,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch doctors using React Query
  const { 
    data: doctors = [], 
    isLoading: doctorsLoading 
  } = useQuery({
    queryKey: ['doctors'],
    queryFn: doctorsAPI.getAll,
    staleTime: 5 * 60 * 1000,
  });

  // Create doctor mutation with optimistic updates
  const createDoctorMutation = useMutation({
    mutationFn: doctorsAPI.create,
    // Optimistic update
    onMutate: async (newDoctorData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries(['doctors']);
      
      // Snapshot the previous value
      const previousDoctors = queryClient.getQueryData(['doctors']);
      
      // Optimistically update
      const tempDoctor = {
        ...newDoctorData,
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      queryClient.setQueryData(['doctors'], (old) => [...(old || []), tempDoctor]);
      
      return { previousDoctors, tempDoctor };
    },
    onSuccess: (createdDoctor, variables, context) => {
      // Invalidate and refetch
      queryClient.invalidateQueries(['doctors']);
      queryClient.invalidateQueries(['departments', variables.department_id]);
      
      toast.success(`Dr. ${createdDoctor.name} added successfully!`);
      
      // Auto-select the newly created doctor
      if (setSelectedDoctor) {
        setSelectedDoctor(createdDoctor.id);
        if (onDoctorChange) {
          onDoctorChange(createdDoctor);
        }
      }
      
      setShowCreateDoctor(false);
      setNewDoctor({
        name: '',
        department_id: '',
        specialty: '',
        qualification: '',
        default_fee: '150',
        phone: '',
        email: '',
        room_number: ''
      });
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousDoctors) {
        queryClient.setQueryData(['doctors'], context.previousDoctors);
      }
      
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to create doctor';
      toast.error(`Error: ${errorMessage}`);
    }
  });

  const handleDepartmentChange = (departmentId) => {
    setSelectedDepartment(departmentId);
    
    // Clear doctor selection when department changes
    if (setSelectedDoctor) {
      setSelectedDoctor('');
    }
    
    // Auto-fill department in new doctor form
    setNewDoctor(prev => ({ ...prev, department_id: departmentId }));
  };

  const handleDoctorChange = (doctorId) => {
    if (setSelectedDoctor) {
      setSelectedDoctor(doctorId);
    }
    
    if (onDoctorChange) {
      const doctor = doctors.find(d => d.id === doctorId);
      if (doctor) {
        onDoctorChange(doctor);
      }
    }
  };

  const handleInlineCreateDoctor = (departmentId) => {
    const department = departments.find(d => d.id === departmentId);
    setNewDoctor(prev => ({ 
      ...prev, 
      department_id: departmentId,
      specialty: department?.name || '' 
    }));
    setShowCreateDoctor(true);
  };

  const handleCreateDoctor = (e) => {
    e.preventDefault();
    
    if (!newDoctor.name || !newDoctor.department_id) {
      toast.error('Please provide doctor name and department');
      return;
    }
    
    createDoctorMutation.mutate(newDoctor);
  };

  // Get doctors for selected department
  const filteredDoctors = selectedDepartment 
    ? doctors.filter(doctor => doctor.department_id === selectedDepartment)
    : doctors;

  // Get department name by ID
  const getDepartmentName = (departmentId) => {
    const dept = departments.find(d => d.id === departmentId);
    return dept ? dept.name : 'Unknown Department';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Department Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Department {required && <span className="text-red-500">*</span>}
        </label>
        <select
          value={selectedDepartment}
          onChange={(e) => handleDepartmentChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
          required={required}
          disabled={departmentsLoading}
        >
          <option value="">
            {departmentsLoading ? 'Loading departments...' : 'Select Department'}
          </option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>
      </div>

      {/* Doctor Selection with Inline Create */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-sm font-medium text-gray-700">
            Doctor {required && <span className="text-red-500">*</span>}
          </label>
          {selectedDepartment && (
            <button
              type="button"
              onClick={() => handleInlineCreateDoctor(selectedDepartment)}
              className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded transition-colors"
            >
              + Add to {getDepartmentName(selectedDepartment)}
            </button>
          )}
        </div>
        
        <select
          value={selectedDoctor}
          onChange={(e) => handleDoctorChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
          required={required}
          disabled={doctorsLoading || !selectedDepartment}
        >
          <option value="">
            {!selectedDepartment 
              ? 'Select department first' 
              : doctorsLoading 
                ? 'Loading doctors...' 
                : 'Select Doctor'}
          </option>
          {filteredDoctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.name} - {doctor.specialty}
            </option>
          ))}
        </select>
        
        {selectedDepartment && filteredDoctors.length === 0 && !doctorsLoading && (
          <p className="text-sm text-gray-500 mt-1">
            No doctors found in {getDepartmentName(selectedDepartment)}.
            <button
              type="button"
              onClick={() => handleInlineCreateDoctor(selectedDepartment)}
              className="ml-1 text-cornflower-blue hover:underline"
            >
              Add the first doctor
            </button>
          </p>
        )}
      </div>

      {/* Inline Doctor Creation Modal */}
      {showCreateDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-charcoal-grey mb-4">
              Add New Doctor to {getDepartmentName(newDoctor.department_id)}
            </h3>
            
            <form onSubmit={handleCreateDoctor} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Doctor Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newDoctor.name}
                  onChange={(e) => setNewDoctor({...newDoctor, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  placeholder="Enter doctor's full name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
                <input
                  type="text"
                  value={newDoctor.specialty}
                  onChange={(e) => setNewDoctor({...newDoctor, specialty: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  placeholder="e.g., General Medicine, Cardiology"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                <input
                  type="text"
                  value={newDoctor.qualification}
                  onChange={(e) => setNewDoctor({...newDoctor, qualification: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  placeholder="e.g., MBBS, MD"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                  <input
                    type="text"
                    value={newDoctor.room_number}
                    onChange={(e) => setNewDoctor({...newDoctor, room_number: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                    placeholder="e.g., 101"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={newDoctor.phone}
                  onChange={(e) => setNewDoctor({...newDoctor, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  placeholder="Contact number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newDoctor.email}
                  onChange={(e) => setNewDoctor({...newDoctor, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  placeholder="Email address"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={createDoctorMutation.isLoading}
                  className="flex-1 bg-cornflower-blue hover:bg-opacity-90 text-white font-semibold py-2 px-4 rounded-md disabled:opacity-50 transition-colors"
                >
                  {createDoctorMutation.isLoading ? 'Adding...' : 'Add Doctor'}
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
                      default_fee: '150',
                      phone: '',
                      email: '',
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
    </div>
  );
};

export default DepartmentDoctorSelector;