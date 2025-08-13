import React, { useState, useEffect } from 'react';
import { useAppContext } from './AppContext';

function NewOPDPageEnhanced() {
  const { addPatient, updatePatient, doctors, loadDoctors, patients, loadPatients, patientForEditing, setPatientForEditing, isLoading } = useAppContext();

  // Form states
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [dob, setDob] = useState('');
  const [sex, setSex] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [consultationFee, setConsultationFee] = useState('');
  const [visitType, setVisitType] = useState('New');
  const [patientRating, setPatientRating] = useState(0);
  const [totalVisits, setTotalVisits] = useState(1);
  
  // UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [lastRegisteredPatient, setLastRegisteredPatient] = useState(null);
  
  // Auto-fill states
  const [showPatientSelector, setShowPatientSelector] = useState(false);
  const [matchingPatients, setMatchingPatients] = useState([]);
  const [selectedPatientForAutofill, setSelectedPatientForAutofill] = useState(null);

  // Departments list
  const departments = [
    'General Medicine',
    'Cardiology', 
    'Dermatology',
    'Orthopedics',
    'Pediatrics',
    'Gynecology',
    'ENT',
    'Ophthalmology',
    'Psychiatry',
    'Emergency'
  ];

  // Load doctors and patients on component mount
  useEffect(() => {
    loadDoctors();
    loadPatients();
  }, []);

  // Generate next OPD number in 001/25 format (daily)
  const generateOPDNumber = () => {
    const currentYear = new Date().getFullYear();
    const yearSuffix = currentYear.toString().slice(-2);
    const today = new Date().toISOString().split('T')[0];
    
    // Filter patients registered today for daily OPD numbering
    const todayPatients = patients.filter(p => {
      const patientDate = new Date(p.created_at).toISOString().split('T')[0];
      return patientDate === today && p.opd_number?.includes('/');
    });
    
    let maxNumber = 0;
    todayPatients.forEach(patient => {
      if (patient.opd_number) {
        const numberPart = parseInt(patient.opd_number.split('/')[0]);
        if (numberPart > maxNumber) {
          maxNumber = numberPart;
        }
      }
    });
    
    const nextNumber = maxNumber + 1;
    return `${nextNumber.toString().padStart(3, '0')}/${yearSuffix}`;
  };

  // Generate token number (daily per doctor)
  const generateTokenNumber = (doctorId) => {
    const today = new Date().toISOString().split('T')[0];
    const todayDoctorPatients = patients.filter(p => {
      const patientDate = new Date(p.created_at).toISOString().split('T')[0];
      return patientDate === today && p.assigned_doctor === doctorId;
    });
    
    return todayDoctorPatients.length + 1;
  };

  // Handle phone number change with auto-fill logic
  const handlePhoneChange = (e) => {
    const phone = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhoneNumber(phone);
    
    if (phone.length === 10) {
      // Find all patients with this phone number from all patient log
      const matches = patients.filter(p => p.phone_number === phone);
      
      if (matches.length === 1) {
        // Single match - auto-fill immediately
        const patient = matches[0];
        fillPatientData(patient);
        setSelectedPatientForAutofill(patient);
      } else if (matches.length > 1) {
        // Multiple matches - show selector
        setMatchingPatients(matches);
        setShowPatientSelector(true);
      } else {
        // No matches - clear auto-fill
        clearAutoFill();
      }
    } else {
      clearAutoFill();
    }
  };

  // Fill patient data from selected patient
  const fillPatientData = (patient) => {
    setPatientName(patient.patient_name || '');
    setAge(patient.age || '');
    setDob(patient.dob || '');
    setSex(patient.sex || '');
    setAddress(patient.address || '');
    
    // Count total visits for this patient
    const patientVisits = patients.filter(p => p.phone_number === patient.phone_number).length;
    setTotalVisits(patientVisits + 1);
    
    // Set visit type to Follow-up for existing patients
    setVisitType(patientVisits > 0 ? 'Follow-up' : 'New');
  };

  // Clear auto-fill data
  const clearAutoFill = () => {
    setSelectedPatientForAutofill(null);
    setShowPatientSelector(false);
    setMatchingPatients([]);
    setTotalVisits(1);
    setVisitType('New');
  };

  // Handle patient selection from floating selector
  const handlePatientSelect = (patient) => {
    fillPatientData(patient);
    setSelectedPatientForAutofill(patient);
    setShowPatientSelector(false);
  };

  // Handle doctor selection and update consultation fee
  const handleDoctorChange = (e) => {
    const doctorId = e.target.value;
    setSelectedDoctor(doctorId);
    
    if (doctorId) {
      const doctor = doctors.find(d => d.id === doctorId);
      if (doctor) {
        setConsultationFee(doctor.default_fee || '150');
        setSelectedDepartment(doctor.specialty || '');
      }
    } else {
      setConsultationFee('');
      setSelectedDepartment('');
    }
  };

  // Calculate age from DOB
  const calculateAge = (birthDate) => {
    if (!birthDate) return '';
    const today = new Date();
    const birthDateObj = new Date(birthDate);
    let years = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      years--;
    }
    return years.toString();
  };

  const handleDobChange = (e) => {
    const birthDate = e.target.value;
    setDob(birthDate);
    setAge(calculateAge(birthDate));
  };

  const handleAgeChange = (e) => {
    setAge(e.target.value);
    // Clear DOB when age is manually entered
    if (e.target.value) {
      setDob('');
    }
  };

  // Reset form
  const resetForm = () => {
    setPatientName('');
    setAge('');
    setDob('');
    setSex('');
    setAddress('');
    setPhoneNumber('');
    setSelectedDoctor('');
    setSelectedDepartment('');
    setConsultationFee('');
    setVisitType('New');
    setPatientRating(0);
    setTotalVisits(1);
    setPatientForEditing(null);
    clearAutoFill();
  };

  // Print OPD function
  const printOPD = (patientData) => {
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

    const doctorName = doctors.find(d => d.id === selectedDoctor)?.name || 'Not Assigned';
    const department = selectedDepartment || 'General';

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>OPD Registration - ${patientData.opd_number}</title>
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
          .visit-type { display: inline-block; padding: 2px 8px; background: ${visitType === 'New' ? '#28a745' : '#17a2b8'}; color: white; border-radius: 3px; font-size: 10px; }
          .token { font-size: 14px; font-weight: bold; color: #e74c3c; }
          .inr { color: #2c5aa0; font-weight: bold; }
          .rating { font-size: 10px; color: ${patientRating >= 0 ? '#28a745' : '#e74c3c'}; }
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
            <strong>OPD:</strong> ${patientData.opd_number}<br>
            <strong>Date:</strong> ${formattedDate}
          </div>
          <div>
            <strong>Time:</strong> ${formattedTime}<br>
            <span class="visit-type">${visitType}</span>
            ${patientData.token_number ? `<br><span class="token">Token: ${patientData.token_number}</span>` : ''}
          </div>
        </div>

        <div class="patient-details">
          <div class="detail-row">
            <div class="label">Patient:</div>
            <div class="value">${patientData.patient_name}</div>
          </div>
          <div class="detail-row">
            <div class="label">Age/Sex:</div>
            <div class="value">${patientData.age} Years / ${patientData.sex}</div>
          </div>
          <div class="detail-row">
            <div class="label">Phone:</div>
            <div class="value">${patientData.phone_number}</div>
          </div>
          <div class="detail-row">
            <div class="label">Department:</div>
            <div class="value">${department}</div>
          </div>
          <div class="detail-row">
            <div class="label">Doctor:</div>
            <div class="value">Dr. ${doctorName}</div>
          </div>
          <div class="detail-row">
            <div class="label">Fee:</div>
            <div class="value inr">₹${consultationFee}</div>
          </div>
          <div class="detail-row">
            <div class="label">Visits:</div>
            <div class="value">${totalVisits}</div>
          </div>
          <div class="detail-row">
            <div class="label">Rating:</div>
            <div class="value rating">Patient Rating: ${patientRating}/10</div>
          </div>
          ${patientData.address ? `
          <div class="detail-row">
            <div class="label">Address:</div>
            <div class="value">${patientData.address}</div>
          </div>
          ` : ''}
        </div>

        <div class="footer">
          <p>കോൺസൾട്ടേഷൻ ഫീസ് • Consultation Fee: <span class="inr">₹${consultationFee}</span></p>
          <p>Please keep this slip for your records</p>
          <p>Asia/Kolkata: ${formattedDate} ${formattedTime}</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    // Validation
    if (!patientName.trim()) {
      setErrorMessage('Patient name is required');
      setIsSubmitting(false);
      return;
    }

    if (!phoneNumber.trim() || phoneNumber.length !== 10) {
      setErrorMessage('Valid 10-digit phone number is required');
      setIsSubmitting(false);
      return;
    }

    if (!sex) {
      setErrorMessage('Please select gender');
      setIsSubmitting(false);
      return;
    }

    if (!age && !dob) {
      setErrorMessage('Please provide either age or date of birth');
      setIsSubmitting(false);
      return;
    }

    if (!selectedDoctor) {
      setErrorMessage('Please select a doctor');
      setIsSubmitting(false);
      return;
    }

    try {
      // Generate OPD and Token numbers
      const opdNumber = generateOPDNumber();
      const tokenNumber = generateTokenNumber(selectedDoctor);

      const patientData = {
        patient_name: patientName.trim(),
        age: age || "",
        dob: dob || "",
        sex: sex,
        address: address.trim(),
        phone_number: phoneNumber.trim(),
        email: "",
        emergency_contact_name: "",
        emergency_contact_phone: "",
        allergies: "",
        medical_history: "",
        assigned_doctor: selectedDoctor,
        visit_type: visitType,
        patient_rating: patientRating,
        department: selectedDepartment,
        consultation_fee: consultationFee,
        total_visits: totalVisits
      };

      console.log('📤 Sending patient data:', patientData);

      let result;
      if (patientForEditing) {
        result = await updatePatient(patientForEditing.id, patientData);
        setSuccessMessage('Patient updated successfully!');
      } else {
        result = await addPatient(patientData);
        
        // Add additional data that's not in the core patient model
        const enhancedResult = {
          ...result,
          opd_number: opdNumber,
          token_number: tokenNumber,
          assigned_doctor: selectedDoctor,
          department: selectedDepartment,
          consultation_fee: consultationFee,
          visit_type: visitType,
          patient_rating: patientRating,
          total_visits: totalVisits
        };
        
        setLastRegisteredPatient(enhancedResult);
        setSuccessMessage(`Patient registered successfully! OPD: ${opdNumber}, Token: ${tokenNumber}`);
      }

      // Reload patients to update lists
      await loadPatients();
      
      // Don't reset form immediately, keep for potential print
      // resetForm();

    } catch (error) {
      console.error('❌ Registration error:', error);
      setErrorMessage(`Registration failed: ${error.message || 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-charcoal-grey">
              {patientForEditing ? 'Edit Patient' : 'New OPD Registration'}
            </h2>
            <p className="text-sm text-coral-red italic mt-1">
              Unicare Polyclinic • Kerala • Asia/Kolkata • INR Currency
            </p>
          </div>
          {lastRegisteredPatient && (
            <button
              onClick={() => printOPD(lastRegisteredPatient)}
              className="bg-cornflower-blue hover:bg-opacity-80 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <span>🖨️</span>
              <span>Print OPD</span>
            </button>
          )}
        </div>

        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            <div className="flex justify-between items-center">
              <span>{successMessage}</span>
              {lastRegisteredPatient && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => printOPD(lastRegisteredPatient)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Print OPD
                  </button>
                  <button
                    onClick={resetForm}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                  >
                    New Patient
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* OPD and Token Numbers Display */}
          <div className="grid md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-700">OPD Number:</span>
              <span className="bg-cornflower-blue text-white px-3 py-1 rounded font-mono">
                {generateOPDNumber()}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-700">Token Number:</span>
              <span className="bg-coral-red text-white px-3 py-1 rounded font-mono">
                {selectedDoctor ? generateTokenNumber(selectedDoctor) : '1'}
              </span>
            </div>
          </div>

          {/* Patient Information Section */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-charcoal-grey border-b pb-2">
                Patient Information
                {selectedPatientForAutofill && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    Auto-filled from records
                  </span>
                )}
              </h3>
              
              {/* Phone Number with Auto-fill */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
                  placeholder="10-digit mobile number"
                  required
                />
                
                {/* Floating Patient Selector */}
                {showPatientSelector && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                    <div className="p-2 bg-gray-50 border-b">
                      <span className="text-sm font-medium text-gray-700">
                        Multiple patients found. Select one:
                      </span>
                    </div>
                    {matchingPatients.map((patient, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handlePatientSelect(patient)}
                        className="w-full text-left p-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium">{patient.patient_name}</div>
                        <div className="text-sm text-gray-600">
                          {patient.age} years, {patient.sex} • Last visit: {new Date(patient.created_at).toLocaleDateString()}
                        </div>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={clearAutoFill}
                      className="w-full text-left p-3 bg-green-50 text-green-700 hover:bg-green-100"
                    >
                      + Create new patient with this number
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient Name *
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={handleAgeChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
                    placeholder="Years"
                    min="0"
                    max="120"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={handleDobChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sex *
                </label>
                <div className="flex space-x-4">
                  {['Male', 'Female', 'Other'].map((option) => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="sex"
                        value={option}
                        checked={sex === option}
                        onChange={(e) => setSex(e.target.value)}
                        className="mr-2"
                        required
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
                  placeholder="Enter address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Visits
                  </label>
                  <input
                    type="number"
                    value={totalVisits}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Visit Type
                  </label>
                  <select
                    value={visitType}
                    onChange={(e) => setVisitType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
                  >
                    <option value="New">New Patient</option>
                    <option value="Follow-up">Follow-up</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-charcoal-grey border-b pb-2">
                Visit Information
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Doctor *
                </label>
                <select
                  value={selectedDoctor}
                  onChange={handleDoctorChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
                  required
                >
                  <option value="">Select Doctor</option>
                    {doctors && doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name} - {doctor.specialty}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Consultation Fee (₹)
                </label>
                <input
                  type="number"
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
                  placeholder="Enter fee amount"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient Rating Adjustment (Optional)
                </label>
                <div className="space-y-3">
                  <div className="flex items-center justify-center space-x-4">
                    <button
                      type="button"
                      onClick={() => setPatientRating(Math.max(-10, patientRating - 1))}
                      className="w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-full text-xl font-bold"
                    >
                      -1
                    </button>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{patientRating}</div>
                      <div className="text-sm text-gray-600">Current Rating</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPatientRating(Math.min(10, patientRating + 1))}
                      className="w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-full text-xl font-bold"
                    >
                      +1
                    </button>
                  </div>
                  
                  {patientRating !== 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reason for Rating Adjustment (Optional)
                      </label>
                      <textarea
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
                        placeholder="Enter reason for rating adjustment..."
                      />
                    </div>
                  )}

                  <div className={`text-center text-sm font-medium ${
                    patientRating >= 5 ? 'text-green-600' : 
                    patientRating >= 0 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {patientRating >= 5 ? 'Excellent Patient' : 
                     patientRating >= 0 ? 'Good Patient' : 
                     patientRating >= -5 ? 'Difficult Patient' : 'Problem Patient'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            {patientForEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="bg-cornflower-blue hover:bg-opacity-80 text-white font-semibold py-2 px-8 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting || isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                patientForEditing ? 'Update Patient' : 'Register Patient'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewOPDPageEnhanced;