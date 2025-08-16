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
        <p className="text-gray-600 mt-2">Comprehensive system reports and analytics</p>
      </div>

      {/* Report Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Report Tabs">
            {reportTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveReportTab(tab.id)}
                className={`${
                  activeReportTab === tab.id
                    ? 'border-cornflower-blue text-cornflower-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Doctors Info Tab */}
          {activeReportTab === 'doctors-info' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-charcoal-grey">Department-wise Doctor Management</h2>
                <button
                  onClick={() => {
                    const newDoctorName = prompt('Enter new doctor name:');
                    const department = prompt('Enter department:');
                    if (newDoctorName && department) {
                      // Add new doctor logic here
                      console.log('Adding new doctor:', newDoctorName, department);
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
                >
                  + Add New Doctor
                </button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-lg text-gray-600">Loading departments...</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Department Boxes */}
                  {departments.map((department) => (
                    <div key={department.department} className="bg-white border-2 border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      {/* Department Header */}
                      <div className="bg-cornflower-blue text-white px-4 py-3 rounded-t-lg">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">{department.department}</h3>
                          <div className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs">
                            {department.total_doctors} doctors
                          </div>
                        </div>
                      </div>

                      {/* Doctors List */}
                      <div className="p-4">
                        {department.doctors.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <p className="text-sm">No doctors in this department</p>
                            <button
                              onClick={() => {
                                const newDoctorName = prompt(`Add new doctor to ${department.department}:`);
                                if (newDoctorName) {
                                  console.log('Adding doctor to', department.department, newDoctorName);
                                }
                              }}
                              className="mt-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                            >
                              + Add Doctor
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {department.doctors.map((doctor) => (
                              <div
                                key={doctor.id}
                                className="p-3 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer transition-colors"
                                onDoubleClick={() => handleDoctorProfile(doctor)}
                                title="Double-click to view detailed profile"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900 text-sm">Dr. {doctor.name}</p>
                                    <p className="text-xs text-gray-600">
                                      {doctor.qualification || 'Not specified'} • ₹{doctor.default_fee}
                                    </p>
                                    <p className="text-xs text-gray-500">{doctor.phone || 'No phone'}</p>
                                  </div>
                                  <div className="flex flex-col space-y-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditDoctor(doctor);
                                      }}
                                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Print profile for Dr. ${doctor.name}?`)) {
                                          // Print functionality here
                                          window.print();
                                        }
                                      }}
                                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200"
                                    >
                                      Print
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Add New Department Box */}
                  <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-8 text-center">
                      <div className="text-gray-400 text-4xl mb-4">+</div>
                      <h3 className="text-lg font-medium text-gray-700 mb-2">Add New Department</h3>
                      <button
                        onClick={() => {
                          const newDepartment = prompt('Enter new department name:');
                          if (newDepartment && newDepartment.trim()) {
                            // Add new department logic here
                            console.log('Adding new department:', newDepartment);
                          }
                        }}
                        className="bg-cornflower-blue hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                      >
                        Create Department
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Department Stats Tab */}
          {activeReportTab === 'department-stats' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-charcoal-grey">Department Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-blue-900 text-lg">Total Departments</h3>
                  <p className="text-3xl font-bold text-blue-700">{departments.length}</p>
                </div>
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-green-900 text-lg">Total Doctors</h3>
                  <p className="text-3xl font-bold text-green-700">{doctors.length}</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-purple-900 text-lg">Avg Doctors/Dept</h3>
                  <p className="text-3xl font-bold text-purple-700">
                    {departments.length > 0 ? Math.round(doctors.length / departments.length) : 0}
                  </p>
                </div>
                <div className="bg-orange-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-orange-900 text-lg">Active Profiles</h3>
                  <p className="text-3xl font-bold text-orange-700">
                    {doctors.filter(d => d.has_profile).length}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Monthly Reports Tab */}
          {activeReportTab === 'monthly-reports' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-charcoal-grey">Monthly Reports</h2>
              <div className="bg-gray-50 p-8 rounded-lg text-center">
                <p className="text-gray-600">Monthly reports functionality coming soon...</p>
              </div>
            </div>
          )}

          {/* System Analytics Tab */}
          {activeReportTab === 'system-analytics' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-charcoal-grey">System Analytics</h2>
              <div className="bg-gray-50 p-8 rounded-lg text-center">
                <p className="text-gray-600">System analytics functionality coming soon...</p>
              </div>
            </div>
          )}
        </div>
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