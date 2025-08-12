import React, { useState, useEffect } from 'react';
import { useAppContext } from './AppContext';

function PatientLogPage() {
  const { patients, loadPatients, doctors, loadDoctors, isLoading } = useAppContext();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedVisitType, setSelectedVisitType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Active');
  const [sortBy, setSortBy] = useState('time_desc');
  const [groupByDoctor, setGroupByDoctor] = useState(false);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidingPatient, setVoidingPatient] = useState(null);
  const [voidReason, setVoidReason] = useState('');

  useEffect(() => {
    loadPatients();
    if (!doctors || doctors.length === 0) {
      loadDoctors();
    }
  }, []);

  // Filter patients based on criteria
  const filteredPatients = patients.filter(patient => {
    const patientDate = new Date(patient.created_at).toISOString().split('T')[0];
    const matchesDate = patientDate === selectedDate;
    const matchesSearch = !searchTerm || 
      patient.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone_number.includes(searchTerm) ||
      patient.opd_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDoctor = !selectedDoctor || patient.assigned_doctor === selectedDoctor;
    const matchesVisitType = !selectedVisitType || patient.visit_type === selectedVisitType;
    const matchesStatus = !selectedStatus || 
      (selectedStatus === 'Active' && patient.status !== 'Voided') ||
      (selectedStatus === 'Voided' && patient.status === 'Voided');
    
    return matchesDate && matchesSearch && matchesDoctor && matchesVisitType && matchesStatus;
  });

  // Sort patients
  const sortedPatients = [...filteredPatients].sort((a, b) => {
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
      // Here you would call an API to void the visit
      // await voidPatientVisit(voidingPatient.id, voidReason);
      
      // For now, we'll just simulate the void
      console.log(`Voiding visit for ${voidingPatient.patient_name}. Reason: ${voidReason}`);
      
      setShowVoidModal(false);
      setVoidingPatient(null);
      setVoidReason('');
      
      // Reload patients to reflect changes
      await loadPatients();
      
    } catch (error) {
      console.error('Error voiding visit:', error);
      alert('Failed to void visit. Please try again.');
    }
  };

  const printOPD = (patient) => {
    const printWindow = window.open('', '_blank');
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata'
    });
    const formattedTime = currentDate.toLocaleTimeString('en-GB', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    });

    const doctorName = doctors.find(d => d.id === patient.assigned_doctor)?.name || 'Not Assigned';

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>OPD Registration - ${patient.opd_number}</title>
        <style>
          @page { size: A5; margin: 10mm; }
          body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; margin: 0; padding: 0; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px; }
          .clinic-name { font-size: 18px; font-weight: bold; color: #2c5aa0; }
          .clinic-subtitle { font-size: 10px; color: #666; margin-top: 2px; }
          .opd-info { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px; background: #f8f9fa; border: 1px solid #dee2e6; }
          .patient-details { margin: 15px 0; }
          .detail-row { display: flex; padding: 3px 0; border-bottom: 1px dotted #ccc; }
          .label { font-weight: bold; width: 120px; flex-shrink: 0; }
          .value { flex-grow: 1; }
          .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #ccc; padding-top: 10px; }
          .visit-type { display: inline-block; padding: 2px 8px; background: ${patient.visit_type === 'New' ? '#28a745' : '#17a2b8'}; color: white; border-radius: 3px; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="clinic-name">UNICARE POLYCLINIC</div>
          <div class="clinic-subtitle">Electronic Health Record System</div>
        </div>
        <div class="opd-info">
          <div><strong>OPD No:</strong> ${patient.opd_number}<br><strong>Date:</strong> ${formattedDate}</div>
          <div><strong>Time:</strong> ${formattedTime}<br><span class="visit-type">${patient.visit_type}</span></div>
        </div>
        <div class="patient-details">
          <div class="detail-row"><div class="label">Patient Name:</div><div class="value">${patient.patient_name}</div></div>
          <div class="detail-row"><div class="label">Age/Sex:</div><div class="value">${patient.age} Years / ${patient.sex}</div></div>
          <div class="detail-row"><div class="label">Phone:</div><div class="value">${patient.phone_number}</div></div>
          <div class="detail-row"><div class="label">Address:</div><div class="value">${patient.address}</div></div>
          <div class="detail-row"><div class="label">Doctor:</div><div class="value">${doctorName}</div></div>

        </div>
        <div class="footer">
          <p>Please keep this slip for your records</p>
          <p>Generated on ${formattedDate} at ${formattedTime}</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata'
    });
  };

  const activeCount = filteredPatients.filter(p => p.status !== 'Voided').length;
  const voidedCount = filteredPatients.filter(p => p.status === 'Voided').length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-charcoal-grey mb-4">
          Patient Log — Today
        </h2>

        {/* Controls */}
        <div className="space-y-4 mb-6">
          {/* Date and Quick Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cornflower-blue"
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
          <div className="grid md:grid-cols-5 gap-4">
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

        {/* Summary */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing {filteredPatients.length} visits for {formatDate(selectedDate)}
            </div>
            <div className="text-sm space-x-4">
              <span className="text-green-600">Active: {activeCount}</span>
              <span className="text-red-600">Voided: {voidedCount}</span>
            </div>
          </div>
        </div>

        {/* Patient List */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cornflower-blue"></div>
            <p className="mt-2 text-gray-600">Loading patients...</p>
          </div>
        ) : (
          // Flat List View
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OPD No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age/Sex</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visit Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedPatients.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                      No patients found for the selected criteria
                    </td>
                  </tr>
                ) : (
                  sortedPatients.map((patient) => (
                    <tr key={patient.id} className={patient.status === 'Voided' ? 'bg-red-50' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatTime(patient.created_at)}</td>
                      <td className="px-4 py-3 text-sm font-mono font-bold text-cornflower-blue">{patient.opd_number}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{patient.patient_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{patient.age}/{patient.sex}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{patient.phone_number}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {doctors.find(d => d.id === patient.assigned_doctor)?.name || 'Unassigned'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${patient.visit_type === 'New' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                          {patient.visit_type}
                        </span>
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
                          🖨️ Print
                        </button>
                        {patient.status !== 'Voided' && (
                          <button
                            onClick={() => handleVoidVisit(patient)}
                            className="text-coral-red hover:text-coral-red/80 font-medium ml-2"
                            title="Void Visit"
                          >
                            ❌ Void
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
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
    </div>
  );
}

export default PatientLogPage;
