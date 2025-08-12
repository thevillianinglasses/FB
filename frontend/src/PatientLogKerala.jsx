import React, { useState, useEffect } from 'react';
import { useAppContext } from './AppContext';

function PatientLogKerala() {
  const { patients, loadPatients, doctors, loadDoctors, isLoading } = useAppContext();
  
  // State for filters and controls
  const [viewMode, setViewMode] = useState('rolling24h'); // 'rolling24h' or 'bydate'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctors, setSelectedDoctors] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('Active');
  const [selectedVisitType, setSelectedVisitType] = useState('');
  const [sortBy, setSortBy] = useState('time_desc');
  const [groupByDoctor, setGroupByDoctor] = useState(false);
  
  // Modal states
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidingPatient, setVoidingPatient] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const [showDocModal, setShowDocModal] = useState(false);
  const [docPatient, setDocPatient] = useState(null);

  useEffect(() => {
    loadPatients();
    if (!doctors || doctors.length === 0) {
      loadDoctors();
    }
  }, []);

  // Format dates for Kerala (DD-MMM-YYYY)
  const formatDateKerala = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata'
    });
  };

  // Format time (24-hour Asia/Kolkata)
  const formatTimeKerala = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    });
  };

  // Filter patients based on rolling 24h or by date
  const getFilteredPatients = () => {
    let filtered = [...patients];

    if (viewMode === 'rolling24h') {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      filtered = filtered.filter(patient => 
        new Date(patient.created_at) >= twentyFourHoursAgo &&
        new Date(patient.created_at) <= now
      );
    } else {
      // By date mode
      filtered = filtered.filter(patient => {
        const patientDate = new Date(patient.created_at).toISOString().split('T')[0];
        return patientDate === selectedDate;
      });
    }

    // Apply other filters
    if (searchTerm) {
      filtered = filtered.filter(patient => 
        patient.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone_number.includes(searchTerm) ||
        patient.opd_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (patient.token_number && patient.token_number.toString().includes(searchTerm))
      );
    }

    if (selectedDoctors.length > 0) {
      filtered = filtered.filter(patient => selectedDoctors.includes(patient.assigned_doctor));
    }

    if (selectedVisitType) {
      filtered = filtered.filter(patient => patient.visit_type === selectedVisitType);
    }

    if (selectedStatus === 'Active') {
      filtered = filtered.filter(patient => patient.status !== 'Voided');
    } else if (selectedStatus === 'Voided') {
      filtered = filtered.filter(patient => patient.status === 'Voided');
    }

    return filtered;
  };

  // Sort patients
  const getSortedPatients = (filtered) => {
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'time_asc':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'time_desc':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'doctor':
          const doctorA = doctors.find(d => d.id === a.assigned_doctor)?.name || '';
          const doctorB = doctors.find(d => d.id === b.assigned_doctor)?.name || '';
          return doctorA.localeCompare(doctorB);
        case 'opd':
          return a.opd_number.localeCompare(b.opd_number);
        default:
          return 0;
      }
    });
  };

  // Calculate documentation score
  const getDocumentationScore = (patient) => {
    let score = 0;
    const checks = [
      patient.aadhaar_id || patient.id_number, // ID
      patient.allergies !== undefined && patient.allergies !== '', // Allergies
      patient.consent_given, // Consent
      patient.emergency_contact, // Emergency Contact
      patient.vitals_recorded, // Vitals
    ];
    
    return checks.filter(Boolean).length;
  };

  // Get documentation badge color
  const getDocBadgeColor = (score) => {
    if (score >= 4) return 'bg-green-100 text-green-800';
    if (score >= 2) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Handle void visit
  const handleVoidVisit = (patient) => {
    setVoidingPatient(patient);
    setShowVoidModal(true);
  };

  const confirmVoidVisit = async () => {
    if (!voidReason.trim()) {
      alert('Please provide a reason for voiding this visit');
      return;
    }
    
    try {
      // TODO: API call to void visit
      console.log(`Voiding visit for ${voidingPatient.patient_name}. Reason: ${voidReason}`);
      
      setShowVoidModal(false);
      setVoidingPatient(null);
      setVoidReason('');
      await loadPatients();
      
    } catch (error) {
      console.error('Error voiding visit:', error);
      alert('Failed to void visit. Please try again.');
    }
  };

  // Handle documentation check
  const handleDocCheck = (patient) => {
    setDocPatient(patient);
    setShowDocModal(true);
  };

  // Print OPD slip
  const printOPD = (patient) => {
    const printWindow = window.open('', '_blank');
    const currentDate = new Date();
    const doctorName = doctors.find(d => d.id === patient.assigned_doctor)?.name || 'Not Assigned';

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>OPD Registration - ${patient.opd_number}</title>
        <meta charset="UTF-8">
        <style>
          @page { size: A5; margin: 10mm; }
          body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; margin: 0; padding: 0; }
          .header { text-align: center; border-bottom: 2px solid #2c5aa0; padding-bottom: 10px; margin-bottom: 15px; }
          .clinic-name { font-size: 18px; font-weight: bold; color: #2c5aa0; }
          .clinic-subtitle { font-size: 11px; color: #666; margin-top: 2px; }
          .kerala-text { font-size: 10px; color: #e74c3c; font-style: italic; }
          .opd-info { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px; background: #f8f9fa; border: 1px solid #dee2e6; }
          .patient-details { margin: 15px 0; }
          .detail-row { display: flex; padding: 3px 0; border-bottom: 1px dotted #ccc; }
          .label { font-weight: bold; width: 120px; flex-shrink: 0; }
          .value { flex-grow: 1; }
          .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #ccc; padding-top: 10px; }
          .visit-type { display: inline-block; padding: 2px 8px; background: ${patient.visit_type === 'New' ? '#28a745' : '#17a2b8'}; color: white; border-radius: 3px; font-size: 10px; }
          .token { font-size: 14px; font-weight: bold; color: #e74c3c; }
          .inr { color: #2c5aa0; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="clinic-name">UNICARE POLYCLINIC</div>
          <div class="clinic-subtitle">Electronic Health Record System</div>
          <div class="kerala-text">Kerala, India • ക്ലിനിക് രജിസ്ട്രേഷൻ</div>
        </div>

        <div class="opd-info">
          <div>
            <strong>OPD:</strong> ${patient.opd_number}<br>
            <strong>Date:</strong> ${formatDateKerala(patient.created_at)}
          </div>
          <div>
            <strong>Time:</strong> ${formatTimeKerala(patient.created_at)}<br>
            <span class="visit-type">${patient.visit_type}</span>
            ${patient.token_number ? `<br><span class="token">Token: ${patient.token_number}</span>` : ''}
          </div>
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

        <div class="footer">
          <p>കോൺസൾട്ടേഷൻ ഫീസ് • Consultation Fee: <span class="inr">₹${patient.consultation_fee || '150'}</span></p>
          <p>Please keep this slip for your records</p>
          <p>Asia/Kolkata: ${formatDateKerala(currentDate)} ${formatTimeKerala(currentDate)}</p>
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
  const sortedPatients = getSortedPatients(filteredPatients);
  
  // Group by doctor if selected
  const groupedPatients = groupByDoctor ? 
    sortedPatients.reduce((groups, patient) => {
      const doctorId = patient.assigned_doctor;
      const doctorName = doctors.find(d => d.id === doctorId)?.name || 'Unassigned';
      if (!groups[doctorName]) {
        groups[doctorName] = [];
      }
      groups[doctorName].push(patient);
      return groups;
    }, {}) : null;

  const activeCount = filteredPatients.filter(p => p.status !== 'Voided').length;
  const voidedCount = filteredPatients.filter(p => p.status === 'Voided').length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-charcoal-grey">
              Patient Log — Unicare Polyclinic (Kerala)
            </h2>
            <p className="text-sm text-coral-red italic">
              പേഷ്യന്റ് ലോഗ് • Asia/Kolkata • Currency: INR
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-cornflower-blue">
              {viewMode === 'rolling24h' ? 'Rolling 24 Hours' : `Date: ${formatDateKerala(selectedDate)}`}
            </div>
            <div className="text-sm text-gray-600">
              Active: {activeCount} | Voided: {voidedCount}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4 mb-6">
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('rolling24h')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  viewMode === 'rolling24h' 
                    ? 'bg-cornflower-blue text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Rolling 24h
              </button>
              <button
                onClick={() => setViewMode('bydate')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  viewMode === 'bydate' 
                    ? 'bg-cornflower-blue text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                By Date
              </button>
            </div>

            {viewMode === 'bydate' && (
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cornflower-blue"
                />
                <button
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                >
                  Today
                </button>
                <button
                  onClick={() => {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    setSelectedDate(yesterday.toISOString().split('T')[0]);
                  }}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                >
                  Yesterday
                </button>
              </div>
            )}
          </div>

          {/* Search and Filters */}
          <div className="grid md:grid-cols-5 gap-4">
            <div>
              <input
                type="text"
                placeholder="Search name, phone, OPD, token..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cornflower-blue"
              />
            </div>
            
            <div>
              <select
                multiple
                value={selectedDoctors}
                onChange={(e) => setSelectedDoctors(Array.from(e.target.selectedOptions, option => option.value))}
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
                value={selectedVisitType}
                onChange={(e) => setSelectedVisitType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cornflower-blue"
              >
                <option value="">All Visit Types</option>
                <option value="New">New</option>
                <option value="Follow-up">Follow-up</option>
              </select>
            </div>
            
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cornflower-blue"
              >
                <option value="Active">Active Only</option>
                <option value="Voided">Voided Only</option>
                <option value="">All Status</option>
              </select>
            </div>
            
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cornflower-blue"
              >
                <option value="time_desc">Latest First</option>
                <option value="time_asc">Oldest First</option>
                <option value="doctor">By Doctor</option>
                <option value="opd">By OPD No</option>
              </select>
            </div>
          </div>

          {/* View Options */}
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={groupByDoctor}
                onChange={(e) => setGroupByDoctor(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Group by Doctor</span>
            </label>
          </div>
        </div>

        {/* Patient List */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cornflower-blue"></div>
            <p className="mt-2 text-gray-600">Loading patients...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time In</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OPD No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visit Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documentation</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedPatients.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="px-4 py-8 text-center text-gray-500">
                      No patients found for the selected criteria
                    </td>
                  </tr>
                ) : (
                  sortedPatients.map((patient) => {
                    const docScore = getDocumentationScore(patient);
                    return (
                      <tr key={patient.id} className={patient.status === 'Voided' ? 'bg-red-50' : 'hover:bg-gray-50'}>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatTimeKerala(patient.created_at)}</td>
                        <td className="px-4 py-3 text-sm font-mono font-bold text-cornflower-blue">{patient.opd_number}</td>
                        <td className="px-4 py-3 text-sm font-bold text-coral-red">{patient.token_number || '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="font-medium text-gray-900">{patient.patient_name}</div>
                          <div className="text-gray-500">{patient.age}/{patient.sex}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{patient.phone_number}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-32 truncate">{patient.address || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          Dr. {doctors.find(d => d.id === patient.assigned_doctor)?.name || 'Unassigned'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${patient.visit_type === 'New' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                            {patient.visit_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => handleDocCheck(patient)}
                            className={`px-2 py-1 rounded text-xs font-medium cursor-pointer ${getDocBadgeColor(docScore)}`}
                          >
                            {docScore}/5
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${patient.status === 'Voided' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {patient.status || 'Active'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm space-x-2">
                          <button
                            onClick={() => printOPD(patient)}
                            className="text-cornflower-blue hover:text-cornflower-blue/80 font-medium"
                            title="Reprint OPD"
                          >
                            🖨️
                          </button>
                          {patient.status !== 'Voided' && (
                            <button
                              onClick={() => handleVoidVisit(patient)}
                              className="text-coral-red hover:text-coral-red/80 font-medium"
                              title="Void Visit"
                            >
                              ❌
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Void Visit Modal */}
      {showVoidModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Void Visit Confirmation
            </h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Are you sure you want to void the visit for:
              </p>
              <p className="font-medium">
                {voidingPatient?.patient_name} (OPD: {voidingPatient?.opd_number})
              </p>
              <p className="text-xs text-red-600 mt-2">
                Note: OPD number stays locked and will not be reused.
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for voiding (required):
              </label>
              <textarea
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cornflower-blue"
                rows="3"
                placeholder="Please provide a reason for voiding this visit..."
                required
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowVoidModal(false);
                  setVoidingPatient(null);
                  setVoidReason('');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmVoidVisit}
                className="px-4 py-2 bg-coral-red text-white rounded hover:bg-coral-red/80"
              >
                Void Visit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Documentation Modal */}
      {showDocModal && docPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Documentation Checklist
            </h3>
            <div className="mb-4">
              <p className="font-medium mb-3">
                {docPatient.patient_name} (OPD: {docPatient.opd_number})
              </p>
              <div className="space-y-2">
                {[
                  { label: 'ID Proof (Aadhaar/Other)', value: docPatient.aadhaar_id || docPatient.id_number },
                  { label: 'Allergies Documented', value: docPatient.allergies },
                  { label: 'Consent Given', value: docPatient.consent_given },
                  { label: 'Emergency Contact', value: docPatient.emergency_contact },
                  { label: 'Vitals Recorded', value: docPatient.vitals_recorded }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{item.label}</span>
                    <span className={`px-2 py-1 rounded text-xs ${item.value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {item.value ? '✓ Done' : '✗ Missing'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowDocModal(false);
                  setDocPatient(null);
                }}
                className="px-4 py-2 bg-cornflower-blue text-white rounded hover:bg-cornflower-blue/80"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientLogKerala;