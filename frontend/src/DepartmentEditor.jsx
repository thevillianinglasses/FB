import React, { useState } from 'react';
import { departmentsAPI } from './api';

function DepartmentEditor({ onClose, onSave }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    head_of_department: '',
    location: '',
    contact_number: '',
    email: ''
  });

  // Form validation errors
  const [errors, setErrors] = useState({});

  // Validation rules
  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.name.trim()) newErrors.name = 'Department name is required';

    // Email validation (if provided)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation (if provided)
    if (formData.contact_number && !/^\d{10}$/.test(formData.contact_number)) {
      newErrors.contact_number = 'Phone must be 10 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
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

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      alert('❌ Please correct the errors before saving.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare department data
      const departmentData = {
        name: formData.name.trim().toUpperCase(),
        description: formData.description.trim(),
        head_of_department: formData.head_of_department.trim(),
        location: formData.location.trim(),
        contact_number: formData.contact_number.trim(),
        email: formData.email.trim(),
        created_at: new Date().toISOString(),
        status: 'active'
      };

      console.log('🔄 Saving department with data:', departmentData);

      // For now, we'll just simulate the save since we don't have a backend endpoint yet
      // In a real implementation, this would call an API
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success toast
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);

      // Call onSave callback after short delay
      setTimeout(() => {
        onSave && onSave(departmentData);
      }, 1000);

    } catch (error) {
      console.error('Error saving department:', error);
      alert(`❌ Error saving department: ${error.message || 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Success Toast */}
        {showSuccessToast && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-60 flex items-center space-x-2">
            <span className="text-lg">✅</span>
            <span>Department saved successfully!</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="bg-cornflower-blue text-white px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Add New Department</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-charcoal-grey border-b border-gray-200 pb-2">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department Name* <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cornflower-blue ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., GENERAL MEDICINE, CARDIOLOGY, PEDIATRICS"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  rows="3"
                  placeholder="Brief description of the department's services and specialties"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Head of Department</label>
                <input
                  type="text"
                  name="head_of_department"
                  value={formData.head_of_department}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  placeholder="Dr. Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  placeholder="Floor/Wing/Room number"
                />
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-charcoal-grey border-b border-gray-200 pb-2">
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                <input
                  type="tel"
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cornflower-blue ${
                    errors.contact_number ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="10-digit phone number"
                  maxLength="10"
                />
                {errors.contact_number && <p className="text-red-500 text-xs mt-1">{errors.contact_number}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cornflower-blue ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="department@unicare.com"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 px-6 py-4 bg-gray-50 rounded-b-xl border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-6 py-2 bg-cornflower-blue text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-cornflower-blue disabled:opacity-50 transition-colors flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>🏥</span>
                <span>Create Department</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DepartmentEditor;