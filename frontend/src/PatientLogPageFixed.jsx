import React, { useState, useEffect } from 'react';
import { useAppContext } from './AppContext';

function PatientLogPageFixed() {
  const { patients, loadPatients, doctors, loadDoctors, isLoading } = useAppContext();
  
  // State management
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedVisitType, setSelectedVisitType] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Enhanced state for patient status management
  const [patientStatuses, setPatientStatuses] = useState({});
  const [voidReasons, setVoidReasons] = useState({});
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [patientToVoid, setPatientToVoid] = useState(null);
  const [voidReason, setVoidReason] = useState('');

  useEffect(() => {
    loadPatients();
    loadDoctors();
  }, []);

  // Generate token numbers for patients (simulated since backend doesn't store them)
  const generateTokenNumber = (patient, filteredPatients) => {
    const doctorPatients = filteredPatients
      .filter(p => p.assigned_doctor === patient.assigned_doctor)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    const tokenIndex = doctorPatients.findIndex(p => p.id === patient.id);
    return tokenIndex >= 0 ? tokenIndex + 1 : 1;
  };

  // Get filtered patients for selected date
  const getFilteredPatients = () => {
    let filtered = patients.filter(patient => {
      const patientDate = new Date(patient.created_at).toISOString().split('T')[0];
      return patientDate === selectedDate;
    });

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(patient => 
        patient.patient_name?.toLowerCase().includes(term) ||
        patient.phone_number?.includes(term) ||
        patient.opd_number?.toLowerCase().includes(term)
      );
    }

    // Apply doctor filter
    if (selectedDoctor) {
      filtered = filtered.filter(patient => patient.assigned_doctor === selectedDoctor);
    }

    // Apply status filter - FIXED: Properly filter by status
    if (selectedStatus) {
      filtered = filtered.filter(patient => {
        const status = patientStatuses[patient.id] || 'Active';
        return status === selectedStatus;
      });
    } else {
      // By default, hide voided entries unless specifically searching for them
      filtered = filtered.filter(patient => {
        const status = patientStatuses[patient.id] || 'Active';
        return status !== 'Voided';
      });
    }

    // Apply visit type filter
    if (selectedVisitType) {
      filtered = filtered.filter(patient => patient.visit_type === selectedVisitType);
    }

    // Sort patients
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'created_at') {
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

  // Get doctor name
  const getDoctorName = (doctorId) => {
    const doctor = doctors.find(d => d.id === doctorId);
    return doctor ? doctor.name : 'Unassigned';
  };

  // Get patient status
  const getPatientStatus = (patientId) => {
    return patientStatuses[patientId] || 'Active';
  };

  // Update patient status
  const updatePatientStatus = (patientId, newStatus) => {
    setPatientStatuses(prev => ({
      ...prev,
      [patientId]: newStatus
    }));
  };

  // Handle void patient
  const handleVoidPatient = (patient) => {
    setPatientToVoid(patient);
    setShowVoidModal(true);
  };

  // Confirm void patient
  const confirmVoidPatient = () => {
    if (!voidReason.trim()) {
      alert('Please provide a reason for voiding this patient entry.');
      return;
    }

    updatePatientStatus(patientToVoid.id, 'Voided');
    setVoidReasons(prev => ({
      ...prev,
      [patientToVoid.id]: voidReason
    }));

    setShowVoidModal(false);
    setPatientToVoid(null);
    setVoidReason('');
    
    alert(`Patient ${patientToVoid.patient_name} has been voided. OPD number ${patientToVoid.opd_number} is retained.`);
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

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Completed': return 'bg-blue-100 text-blue-800';
      case 'Voided': return 'bg-red-100 text-red-800';
      case 'No Show': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Print OPD slip
  const printOPD = (patient) => {
    const printWindow = window.open('', '_blank');
    const doctorName = getDoctorName(patient.assigned_doctor);
    const tokenNumber = generateTokenNumber(patient, getFilteredPatients());

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>OPD Registration - ${patient.opd_number}</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; margin: 0; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #2c5aa0; padding-bottom: 10px; margin-bottom: 15px; }
          .clinic-name { font-size: 18px; font-weight: bold; color: #2c5aa0; }
          .opd-info { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px; background: #f8f9fa; }
          .patient-details { margin: 15px 0; }
          .detail-row { display: flex; padding: 3px 0; border-bottom: 1px dotted #ccc; }
          .label { font-weight: bold; width: 120px; }
          .value { flex-grow: 1; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="clinic-name">UNICARE POLYCLINIC</div>
          <div>Kerala, India • ക്ലിനിക് രജിസ്ട്രേഷൻ</div>
        </div>
        <div class="opd-info">
          <div><strong>OPD:</strong> ${patient.opd_number}</div>
          <div><strong>Token:</strong> ${tokenNumber}</div>
          <div><strong>Date:</strong> ${formatDate(patient.created_at)}</div>
        </div>
        <div class="patient-details">
          <div class="detail-row">
            <div class="label">Patient:</div>
            <div class="value">${patient.patient_name}</div>
          </div>
          <div class="detail-row">
            <div class="label">Age/Sex:</div>
            <div class="value">${patient.age} Years / ${patient.sex}</div>
          </div>
          <div class="detail-row">
            <div class="label">Phone:</div>
            <div class="value">${patient.phone_number}</div>
          </div>
          <div class="detail-row">
            <div class="label">Doctor:</div>
            <div class="value">Dr. ${doctorName}</div>
          </div>
          ${patient.address ? `
          <div class="detail-row">
            <div class="label">Address:</div>
            <div class="value">${patient.address}</div>
          </div>
          ` : ''}
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const filteredPatients = getFilteredPatients();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-charcoal-grey">Patient Log — Rolling 24 Hours</h2>
              <p className="text-sm text-coral-red italic mt-1">
                Real-time Updates • Unicare Polyclinic • Kerala • {formatDate(selectedDate)}
              </p>
            </div>
            <div className="text-lg font-bold text-cornflower-blue">
              {filteredPatients.length} visits
            </div>
          </div>
        </div>

        {/* Date Selection and Quick Actions */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
              />
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className={`px-3 py-1 rounded text-sm ${selectedDate === new Date().toISOString().split('T')[0] ? 'bg-cornflower-blue text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                Today
              </button>
              <button
                onClick={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  setSelectedDate(yesterday.toISOString().split('T')[0]);
                }}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
              >
                Yesterday
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="grid md:grid-cols-6 gap-4">
            <div>
              <input
                type="text"
                placeholder="Search name, phone, OPD..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cornflower-blue"
              />
            </div>
            
            <div>
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cornflower-blue"
              >
                <option value="">All Doctors</option>
                {doctors && doctors.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>
                    Dr. {doctor.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cornflower-blue"
              >
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Voided">Voided</option>
                <option value="No Show">No Show</option>
              </select>
            </div>
            
            <div>
              <select
                value={selectedVisitType}
                onChange={(e) => setSelectedVisitType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cornflower-blue"
              >
                <option value="">All Visit Types</option>
                <option value="New">New Patient</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Consultation">Consultation</option>
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
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cornflower-blue"
              >
                <option value="created_at-desc">Latest First</option>
                <option value="created_at-asc">Oldest First</option>
                <option value="patient_name-asc">Name A-Z</option>
                <option value="patient_name-desc">Name Z-A</option>
              </select>
            </div>

            <div>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedDoctor('');
                  setSelectedStatus('');
                  setSelectedVisitType('');
                }}
                className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Patient Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  OPD No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Token
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Age/Sex
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doctor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visit Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-cornflower-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading patients...
                    </div>
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center text-gray-500">
                    {searchTerm || selectedDoctor || selectedStatus || selectedVisitType ? 
                      'No patients found matching your filters.' : 
                      `No patients registered on ${formatDate(selectedDate)}.`
                    }
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient, index) => {
                  const status = getPatientStatus(patient.id);
                  const tokenNumber = generateTokenNumber(patient, filteredPatients);
                  const doctorName = getDoctorName(patient.assigned_doctor);
                  
                  return (
                    <tr key={patient.id} className={`hover:bg-gray-50 ${status === 'Voided' ? 'opacity-60' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="text-gray-900">{formatTime(patient.created_at)}</div>
                        <div className="text-gray-500 text-xs">{formatDate(patient.created_at)}</div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-cornflower-blue">
                          {patient.opd_number || 'N/A'}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-coral-red">
                          {tokenNumber}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {patient.patient_name}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {patient.age} / {patient.sex}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {patient.phone_number}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Dr. {doctorName}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          patient.visit_type === 'New' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {patient.visit_type || 'New'}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={status}
                          onChange={(e) => updatePatientStatus(patient.id, e.target.value)}
                          className={`px-2 py-1 text-xs font-medium rounded-full border-0 ${getStatusColor(status)}`}
                        >
                          <option value="Active">Active</option>
                          <option value="Completed">Completed</option>
                          <option value="No Show">No Show</option>
                          {status !== 'Voided' && <option value="Voided">Void</option>}
                        </select>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => printOPD(patient)}
                            className="text-cornflower-blue hover:text-opacity-80"
                            title="Reprint OPD Slip"
                          >
                            Print
                          </button>
                          
                          {status !== 'Voided' && (
                            <button
                              onClick={() => handleVoidPatient(patient)}
                              className="text-red-600 hover:text-red-800"
                              title="Void Entry"
                            >
                              Void
                            </button>
                          )}
                          
                          {status === 'Voided' && voidReasons[patient.id] && (
                            <span 
                              className="text-xs text-gray-500 cursor-help"
                              title={`Voided: ${voidReasons[patient.id]}`}
                            >
                              ⚠️ Voided
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Void Modal */}
      {showVoidModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md m-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Void Patient Entry
            </h3>
            
            <p className="text-gray-600 mb-4">
              You are voiding <strong>{patientToVoid?.patient_name}</strong> (OPD: {patientToVoid?.opd_number}).
              The OPD number will be retained and not reused.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Voiding (Required)
              </label>
              <textarea
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
                placeholder="Enter reason for voiding this entry..."
                required
              />
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowVoidModal(false);
                  setPatientToVoid(null);
                  setVoidReason('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmVoidPatient}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Void Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientLogPageFixed;