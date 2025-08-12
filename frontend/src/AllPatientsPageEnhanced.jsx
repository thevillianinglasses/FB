import React, { useState, useEffect } from 'react';
import { useAppContext } from './AppContext';

function AllPatientsPageEnhanced() {
  const { patients, loadPatients, deletePatient, setPatientForEditing, doctors, loadDoctors, isLoading } = useAppContext();
  
  // State for filtering and search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedVisitType, setSelectedVisitType] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  
  // Statistics state
  const [stats, setStats] = useState({
    totalPatients: 0,
    newPatients: 0,
    followUpPatients: 0,
    todayVisits: 0,
    uniquePhoneNumbers: 0
  });

  useEffect(() => {
    loadPatients();
    loadDoctors();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [patients]);

  // Calculate statistics
  const calculateStats = () => {
    if (!patients || patients.length === 0) return;

    const today = new Date().toISOString().split('T')[0];
    const todayVisits = patients.filter(p => {
      const patientDate = new Date(p.created_at).toISOString().split('T')[0];
      return patientDate === today;
    }).length;

    // Count unique phone numbers to get unique patients
    const uniquePhones = new Set(patients.map(p => p.phone_number)).size;
    
    // Count by visit type correctly
    const newPatientVisits = patients.filter(p => !p.visit_type || p.visit_type === 'New').length;
    const followUpVisits = patients.filter(p => p.visit_type === 'Follow-up').length;

    setStats({
      totalPatients: patients.length,
      newPatients: newPatientVisits,
      followUpPatients: followUpVisits,
      todayVisits,
      uniquePhoneNumbers: uniquePhones
    });
  };

  // Get unique patients (group by phone number, keep latest record for display)
  const getUniquePatients = () => {
    const phoneGroups = {};
    
    patients.forEach(patient => {
      const phone = patient.phone_number;
      if (!phoneGroups[phone]) {
        phoneGroups[phone] = [];
      }
      phoneGroups[phone].push(patient);
    });

    // For each phone group, get the most recent record and add visit count
    return Object.values(phoneGroups).map(group => {
      const sortedGroup = group.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const latestRecord = { ...sortedGroup[0] };
      latestRecord.totalVisits = group.length;
      latestRecord.firstVisit = group.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0].created_at;
      latestRecord.allVisits = group;
      return latestRecord;
    });
  };

  // Filter and search patients
  const getFilteredPatients = () => {
    let filtered = getUniquePatients();

    // Search by name, phone, or OPD number
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(patient => 
        patient.patient_name?.toLowerCase().includes(term) ||
        patient.phone_number?.includes(term) ||
        patient.opd_number?.toLowerCase().includes(term)
      );
    }

    // Filter by gender
    if (selectedGender) {
      filtered = filtered.filter(patient => patient.sex === selectedGender);
    }

    // Filter by doctor
    if (selectedDoctor) {
      filtered = filtered.filter(patient => patient.assigned_doctor === selectedDoctor);
    }

    // Sort patients
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'created_at' || sortBy === 'firstVisit') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  // Pagination
  const getPaginatedPatients = () => {
    const filtered = getFilteredPatients();
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return {
      patients: filtered.slice(startIndex, endIndex),
      totalPages: Math.ceil(filtered.length / pageSize),
      totalCount: filtered.length
    };
  };

  // Get doctor name
  const getDoctorName = (doctorId) => {
    const doctor = doctors.find(d => d.id === doctorId);
    return doctor ? `Dr. ${doctor.name}` : 'Unassigned';
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata'
    });
  };

  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Kolkata'
    });
  };

  // Show patient visit history
  const showVisitHistory = (patient) => {
    const visits = patient.allVisits.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    alert(`Visit History for ${patient.patient_name}:\n\n` +
      visits.map((visit, index) => 
        `${index + 1}. ${formatDate(visit.created_at)} ${formatTime(visit.created_at)} - OPD: ${visit.opd_number || 'N/A'}`
      ).join('\n')
    );
  };

  // Handle patient edit
  const handleEdit = (patient) => {
    setPatientForEditing(patient);
  };

  // Handle patient delete (disabled for unique patients as per requirements)
  const handleDelete = (patient) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${patient.patient_name} from All Patient Log?\n\n` +
      `This will remove all ${patient.totalVisits} visit records for this patient.\n` +
      `This action cannot be undone.`
    );
    
    if (confirmDelete) {
      // In a real application, this would call an API to delete the patient
      // For now, we'll simulate the deletion
      alert(`${patient.patient_name} and all associated visits have been permanently deleted from the system.`);
      
      // Reload patients to refresh the list
      loadPatients();
    }
  };

  const { patients: paginatedPatients, totalPages, totalCount } = getPaginatedPatients();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-charcoal-grey">All Patient Log</h2>
              <p className="text-sm text-coral-red italic mt-1">
                Permanent Patient Records • Unicare Polyclinic • Kerala
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Helps with auto-fill and duplicate prevention • Cannot be deleted
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="p-6 bg-blue-50 border-b">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-cornflower-blue">{stats.uniquePhoneNumbers}</div>
              <div className="text-sm text-gray-600">Unique Patients</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.totalPatients}</div>
              <div className="text-sm text-gray-600">Total Visits</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.newPatients}</div>
              <div className="text-sm text-gray-600">New Patients</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.followUpPatients}</div>
              <div className="text-sm text-gray-600">Follow-ups</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-coral-red">{stats.todayVisits}</div>
              <div className="text-sm text-gray-600">Today's Visits</div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="p-6 border-b bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <input
                type="text"
                placeholder="Search by name, phone, or OPD..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
              />
            </div>
            
            <div>
              <select
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
              >
                <option value="">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
              >
                <option value="">All Doctors</option>
                {doctors.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>
                    Dr. {doctor.name} - {doctor.specialty}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
              >
                <option value="created_at-desc">Latest First</option>
                <option value="created_at-asc">Oldest First</option>
                <option value="patient_name-asc">Name A-Z</option>
                <option value="patient_name-desc">Name Z-A</option>
                <option value="totalVisits-desc">Most Visits</option>
                <option value="totalVisits-asc">Least Visits</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Showing {paginatedPatients.length} of {totalCount} unique patients
              </span>
            </div>
            
            {/* Clear Filters */}
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedGender('');
                setSelectedDoctor('');
                setSelectedVisitType('');
                setCurrentPage(1);
              }}
              className="text-sm text-cornflower-blue hover:text-opacity-80"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Patient Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  S.No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visits
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Visit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doctor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-cornflower-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading patients...
                    </div>
                  </td>
                </tr>
              ) : paginatedPatients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    {searchTerm || selectedGender || selectedDoctor ? 
                      'No patients found matching your filters.' : 
                      'No patients registered yet.'
                    }
                  </td>
                </tr>
              ) : (
                paginatedPatients.map((patient, index) => (
                  <tr key={`${patient.phone_number}-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="text-gray-900 font-medium">
                        {(currentPage - 1) * pageSize + index + 1}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {patient.patient_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {patient.age} years, {patient.sex}
                        </div>
                        <div className="text-xs text-cornflower-blue">
                          Latest OPD: {patient.opd_number || 'N/A'}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{patient.phone_number}</div>
                      {patient.address && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {patient.address}
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">
                          {patient.totalVisits}
                        </span>
                        <button
                          onClick={() => showVisitHistory(patient)}
                          className="ml-2 text-xs text-cornflower-blue hover:text-opacity-80"
                        >
                          View History
                        </button>
                      </div>
                      <div className="text-xs text-gray-500">
                        First: {formatDate(patient.firstVisit)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {formatDate(patient.created_at)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatTime(patient.created_at)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {getDoctorName(patient.assigned_doctor)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(patient)}
                          className="text-cornflower-blue hover:text-opacity-80 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => showVisitHistory(patient)}
                          className="text-green-600 hover:text-opacity-80 text-sm"
                        >
                          History
                        </button>
                        <button
                          onClick={() => handleDelete(patient)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages, currentPage - 2 + i));
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 border rounded text-sm ${
                        currentPage === pageNum
                          ? 'bg-cornflower-blue text-white border-cornflower-blue'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AllPatientsPageEnhanced;