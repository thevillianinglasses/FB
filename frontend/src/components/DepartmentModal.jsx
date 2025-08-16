import React, { useState, useEffect } from 'react';

function DepartmentModal({ onClose, onSave, isLoading = false }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    headDoctorId: '',
    location: '',
    contactPhone: ''
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Department name is required';
    }
    
    if (formData.contactPhone && !/^\d{10}$/.test(formData.contactPhone)) {
      newErrors.contactPhone = 'Phone must be 10 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Modal Header */}
        <div className="bg-cornflower-blue text-white px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Add New Department</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
              disabled={isLoading}
            >
              ×
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Department Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cornflower-blue ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., CARDIOLOGY, ORTHOPEDICS"
              disabled={isLoading}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
              rows="3"
              placeholder="Brief description of the department's services"
              disabled={isLoading}
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
              placeholder="Floor/Wing/Room number"
              disabled={isLoading}
            />
          </div>

          {/* Contact Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
            <input
              type="tel"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cornflower-blue ${
                errors.contactPhone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="10-digit phone number"
              maxLength="10"
              disabled={isLoading}
            />
            {errors.contactPhone && <p className="text-red-500 text-xs mt-1">{errors.contactPhone}</p>}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-cornflower-blue text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-cornflower-blue disabled:opacity-50 transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <span>🏥</span>
                  <span>Create Department</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DepartmentModal;