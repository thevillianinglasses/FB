import React, { useState, useEffect } from 'react';
import { useAppContext } from './AppContext';

function AdminReportsPage() {
  const { doctors, loadDoctors, isLoading } = useAppContext();
  const [activeReportTab, setActiveReportTab] = useState('doctors-info');
  const [departments, setDepartments] = useState([]);
  const [showDoctorProfile, setShowDoctorProfile] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorProfile, setDoctorProfile] = useState({
    degree: '',
    registration_number: '',
    address: '',
    phone: '',
    email: '',
    certificates: []
  });
  const [editingDoctorId, setEditingDoctorId] = useState(null);
  const [editingDoctor, setEditingDoctor] = useState({});

  // Report tabs
  const reportTabs = [
    { id: 'doctors-info', name: 'Doctors Info', icon: '👨‍⚕️' },
    { id: 'department-stats', name: 'Department Stats', icon: '🏥' },
    { id: 'monthly-reports', name: 'Monthly Reports', icon: '📊' },
    { id: 'system-analytics', name: 'System Analytics', icon: '📈' }
  ];

  // Load departments and doctors on mount
  useEffect(() => {
    loadDoctors();
    loadDepartmentsReport();
  }, []);

  // Load departments with doctors from backend
  const loadDepartmentsReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.REACT_APP_BACKEND_URL}/api/admin/reports/departments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const departmentsData = await response.json();
        setDepartments(departmentsData);
      } else {
        console.error('Error loading departments report');
      }
    } catch (error) {
      console.error('Error loading departments report:', error);
    }
  };

  // Handle doctor profile (double-click)
  const handleDoctorProfile = async (doctor) => {
    setSelectedDoctor(doctor);
    setShowDoctorProfile(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.REACT_APP_BACKEND_URL}/api/admin/doctors/${doctor.id}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const profileData = await response.json();
        setDoctorProfile(profileData);
      }
    } catch (error) {
      console.error('Error loading doctor profile:', error);
    }
  };

  // Save doctor profile
  const saveDoctorProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.REACT_APP_BACKEND_URL}/api/admin/doctors/${selectedDoctor.id}/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...doctorProfile,
          doctor_id: selectedDoctor.id
        })
      });
      
      if (response.ok) {
        alert('✅ Doctor profile updated successfully!');
        setShowDoctorProfile(false);
        loadDepartmentsReport(); // Reload data
      } else {
        alert('❌ Error updating doctor profile');
      }
    } catch (error) {
      console.error('Error saving doctor profile:', error);
      alert('❌ Error saving doctor profile');
    }
  };

  // Handle doctor edit
  const handleEditDoctor = (doctor) => {
    setEditingDoctorId(doctor.id);
    setEditingDoctor({
      name: doctor.name,
      specialty: doctor.specialty,
      qualification: doctor.qualification || '',
      default_fee: doctor.default_fee || '500',
      phone: doctor.phone || '',
      email: doctor.email || ''
    });
  };

  // Save doctor edits
  const saveDoctor = async (doctorId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.REACT_APP_BACKEND_URL}/api/admin/doctors/${doctorId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editingDoctor)
      });
      
      if (response.ok) {
        alert('✅ Doctor updated successfully!');
        setEditingDoctorId(null);
        loadDepartmentsReport(); // Reload data
        loadDoctors(); // Reload doctors in context
      } else {
        alert('❌ Error updating doctor');
      }
    } catch (error) {
      console.error('Error updating doctor:', error);
      alert('❌ Error updating doctor');
    }
  };

  // Delete doctor
  const deleteDoctor = async (doctor) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete Dr. ${doctor.name}?\n\n` +
      `This action cannot be undone and will remove:\n` +
      `• Doctor profile\n` +
      `• All associated data\n` +
      `• Historical records\n\n` +
      `Type "DELETE" to confirm this action.`
    );

    if (confirmDelete) {
      const doubleConfirm = prompt('Type "DELETE" to confirm deletion:');
      
      if (doubleConfirm === 'DELETE') {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${import.meta.env.REACT_APP_BACKEND_URL}/api/admin/doctors/${doctor.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            alert('✅ Doctor deleted successfully!');
            loadDepartmentsReport(); // Reload data
            loadDoctors(); // Reload doctors in context
          } else {
            alert('❌ Error deleting doctor');
          }
        } catch (error) {
          console.error('Error deleting doctor:', error);
          alert('❌ Error deleting doctor');
        }
      }
    }
  };

  // Add certificate to doctor profile
  const addCertificate = () => {
    const certificateName = prompt('Enter certificate name (e.g., "TCMC Registration", "Postgraduate Certificate"):');
    if (certificateName) {
      const newCertificate = {
        id: Date.now().toString(),
        certificate_name: certificateName,
        file_path: '',
        file_name: '',
        uploaded_at: new Date().toISOString()
      };
      
      setDoctorProfile(prev => ({
        ...prev,
        certificates: [...prev.certificates, newCertificate]
      }));
    }
  };

  // Remove certificate
  const removeCertificate = (certificateId) => {
    setDoctorProfile(prev => ({
      ...prev,
      certificates: prev.certificates.filter(cert => cert.id !== certificateId)
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-charcoal-grey">Admin Reports</h1>
        <p className="text-gray-600 mt-2">Department-wise doctor management and profiles</p>
      </div>

      {/* Department Cards */}
      <div className="grid gap-6">
        {departments.map((department) => (
          <div key={department.department} className="bg-white border border-gray-200 rounded-lg shadow-sm">
            {/* Department Header */}
            <div className="bg-cornflower-blue text-white px-6 py-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{department.department}</h2>
                <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                  {department.total_doctors} doctors
                </div>
              </div>
            </div>

            {/* Doctors List */}
            <div className="p-6">
              {department.doctors.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No doctors in this department</p>
              ) : (
                <div className="space-y-4">
                  {department.doctors.map((doctor) => (
                    <div key={doctor.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      {editingDoctorId === doctor.id ? (
                        // Edit Mode
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <input
                              type="text"
                              value={editingDoctor.name}
                              onChange={(e) => setEditingDoctor({...editingDoctor, name: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                              placeholder="Doctor name"
                            />
                            <input
                              type="text"
                              value={editingDoctor.specialty}
                              onChange={(e) => setEditingDoctor({...editingDoctor, specialty: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                              placeholder="Specialty"
                            />
                            <input
                              type="text"
                              value={editingDoctor.qualification}
                              onChange={(e) => setEditingDoctor({...editingDoctor, qualification: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                              placeholder="Qualification"
                            />
                            <input
                              type="text"
                              value={editingDoctor.default_fee}
                              onChange={(e) => setEditingDoctor({...editingDoctor, default_fee: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                              placeholder="Default fee"
                            />
                            <input
                              type="tel"
                              value={editingDoctor.phone}
                              onChange={(e) => setEditingDoctor({...editingDoctor, phone: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                              placeholder="Phone number"
                            />
                            <input
                              type="email"
                              value={editingDoctor.email}
                              onChange={(e) => setEditingDoctor({...editingDoctor, email: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                              placeholder="Email"
                            />
                          </div>
                          <div className="flex space-x-3">
                            <button
                              onClick={() => saveDoctor(doctor.id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingDoctorId(null)}
                              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Display Mode
                        <div className="flex items-center justify-between">
                          <div 
                            className="flex-1 cursor-pointer"
                            onDoubleClick={() => handleDoctorProfile(doctor)}
                            title="Double-click to view detailed profile"
                          >
                            <h3 className="text-lg font-semibold text-gray-900">Dr. {doctor.name}</h3>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p><span className="font-medium">Qualification:</span> {doctor.qualification || 'Not specified'}</p>
                              <p><span className="font-medium">Fee:</span> ₹{doctor.default_fee}</p>
                              <p><span className="font-medium">Phone:</span> {doctor.phone || 'Not provided'}</p>
                              {doctor.has_profile && (
                                <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                  Profile Complete
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditDoctor(doctor)}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 focus:outline-none"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteDoctor(doctor)}
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 focus:outline-none"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Doctor Profile Modal */}
      {showDoctorProfile && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-cornflower-blue text-white px-6 py-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Dr. {selectedDoctor.name} - Detailed Profile</h2>
                <button
                  onClick={() => setShowDoctorProfile(false)}
                  className="text-white hover:text-gray-300 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
                    <input
                      type="text"
                      value={doctorProfile.degree}
                      onChange={(e) => setDoctorProfile({...doctorProfile, degree: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                      placeholder="e.g., MBBS, MD, MS"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                    <input
                      type="text"
                      value={doctorProfile.registration_number}
                      onChange={(e) => setDoctorProfile({...doctorProfile, registration_number: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                      placeholder="Medical council registration number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={doctorProfile.phone}
                      onChange={(e) => setDoctorProfile({...doctorProfile, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                      placeholder="10-digit mobile number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={doctorProfile.email}
                      onChange={(e) => setDoctorProfile({...doctorProfile, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                      placeholder="doctor@email.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    value={doctorProfile.address}
                    onChange={(e) => setDoctorProfile({...doctorProfile, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                    rows="3"
                    placeholder="Complete address with city, state, pincode"
                  />
                </div>
              </div>

              {/* Certificates Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-lg font-semibold text-gray-900">Certificates & Documents</h3>
                  <button
                    onClick={addCertificate}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none"
                  >
                    + Add Certificate
                  </button>
                </div>

                {doctorProfile.certificates.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No certificates added yet</p>
                    <p className="text-sm text-gray-400 mt-1">Click "Add Certificate" to upload documents</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {doctorProfile.certificates.map((cert) => (
                      <div key={cert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{cert.certificate_name}</p>
                          <p className="text-sm text-gray-500">
                            {cert.file_name || 'File not uploaded'} • Added: {new Date(cert.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => alert('File upload functionality will be implemented next')}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                          >
                            Upload
                          </button>
                          <button
                            onClick={() => removeCertificate(cert.id)}
                            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => setShowDoctorProfile(false)}
                  className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  onClick={saveDoctorProfile}
                  className="px-6 py-2 bg-cornflower-blue text-white rounded-md hover:bg-blue-700 focus:outline-none"
                >
                  Save Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminReportsPage;