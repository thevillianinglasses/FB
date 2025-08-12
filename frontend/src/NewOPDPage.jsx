import React, { useState, useEffect } from 'react';
import { useAppContext } from './AppContext';

function NewOPDPage() {
  const { addPatient, updatePatient, doctors, loadDoctors, patients, loadPatients, patientForEditing, setPatientForEditing, isLoading } = useAppContext();

  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [dob, setDob] = useState('');
  const [sex, setSex] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [visitType, setVisitType] = useState('New');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [lastRegisteredPatient, setLastRegisteredPatient] = useState(null);
  const [patientRating, setPatientRating] = useState(0);

  // Load doctors and patients on component mount
  useEffect(() => {
    loadDoctors();
    loadPatients();
  }, []);

  // Generate next OPD number in 001/25 format
  const generateOPDNumber = () => {
    const currentYear = new Date().getFullYear();
    const yearSuffix = currentYear.toString().slice(-2); // Get last 2 digits of year
    
    // Find highest OPD number for current year
    const currentYearPatients = patients.filter(p => p.opd_number?.endsWith(`/${yearSuffix}`));
    let maxNumber = 0;
    
    currentYearPatients.forEach(patient => {
      const numberPart = parseInt(patient.opd_number.split('/')[0]);
      if (numberPart > maxNumber) {
        maxNumber = numberPart;
      }
    });
    
    const nextNumber = maxNumber + 1;
    return `${nextNumber.toString().padStart(3, '0')}/${yearSuffix}`;
  };

  // Generate token number
  const generateTokenNumber = (doctorId) => {
    const today = new Date().toISOString().split('T')[0];
    const todayPatients = patients.filter(p => {
      const patientDate = new Date(p.created_at).toISOString().split('T')[0];
      return patientDate === today && p.assigned_doctor === doctorId;
    });
    
    return todayPatients.length + 1;
  };

  // Populate form if editing existing patient
  useEffect(() => {
    if (patientForEditing) {
      setPatientName(patientForEditing.patient_name || '');
      setAge(patientForEditing.age || '');
      setDob(patientForEditing.dob || '');
      setSex(patientForEditing.sex || '');
      setAddress(patientForEditing.address || '');
      setPhoneNumber(patientForEditing.phone_number || '');
      setSelectedDoctor(patientForEditing.assigned_doctor || '');
      setVisitType(patientForEditing.visit_type || 'New');
      setPatientRating(patientForEditing.patient_rating || 0);
    }
  }, [patientForEditing]);

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
  };

  const resetForm = () => {
    setPatientName('');
    setAge('');
    setDob('');
    setSex('');
    setAddress('');
    setPhoneNumber('');
    setSelectedDoctor('');
    setVisitType('New');
    setPatientRating(0);
    setPatientForEditing(null);
  };

  // Print OPD function with Kerala formatting
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

    const doctorName = doctors.find(d => d.id === patientData.assigned_doctor)?.name || 'Not Assigned';

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
          .visit-type { display: inline-block; padding: 2px 8px; background: ${patientData.visit_type === 'New' ? '#28a745' : '#17a2b8'}; color: white; border-radius: 3px; font-size: 10px; }
          .token { font-size: 14px; font-weight: bold; color: #e74c3c; }
          .inr { color: #2c5aa0; font-weight: bold; }
          .rating { font-size: 10px; color: ${patientData.patient_rating >= 0 ? '#28a745' : '#e74c3c'}; }
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
            <strong>OPD No:</strong> ${patientData.opd_number}<br>
            <strong>Date:</strong> ${formattedDate}
          </div>
          <div>
            <strong>Time:</strong> ${formattedTime}<br>
            <span class="visit-type">${patientData.visit_type}</span>
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
            <div class="label">Doctor:</div>
            <div class="value">Dr. ${doctorName}</div>
          </div>
          <div class="detail-row">
            <div class="label">Rating:</div>
            <div class="value rating">Patient Rating: ${patientData.patient_rating}/10</div>
          </div>
          ${patientData.address ? `
          <div class="detail-row">
            <div class="label">Address:</div>
            <div class="value">${patientData.address}</div>
          </div>
          ` : ''}
        </div>

        <div class="footer">
          <p>കോൺസൾട്ടേഷൻ ഫീസ് • Consultation Fee: <span class="inr">₹150</span></p>
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    console.log('🔄 Starting patient registration...');

    // Validation
    if (!patientName.trim()) {
      setErrorMessage('Patient name is required');
      setIsSubmitting(false);
      return;
    }

    if (!phoneNumber.trim()) {
      setErrorMessage('Phone number is required');
      setIsSubmitting(false);
      return;
    }

    if (phoneNumber.length !== 10) {
      setErrorMessage('Phone number must be 10 digits');
      setIsSubmitting(false);
      return;
    }

    if (!selectedDoctor) {
      setErrorMessage('Please select a doctor');
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

    try {
      const opdNumber = generateOPDNumber();
      const tokenNumber = generateTokenNumber(selectedDoctor);

      const patientData = {
        patient_name: patientName.trim(),
        age: age ? parseInt(age) : null,
        dob: dob || null,
        sex: sex,
        address: address.trim(),
        phone_number: phoneNumber.trim(),
        assigned_doctor: selectedDoctor,
        visit_type: visitType,
        patient_rating: patientRating,
        opd_number: opdNumber,
        token_number: tokenNumber
      };

      console.log('📤 Sending patient data:', patientData);

      let result;
      if (patientForEditing) {
        result = await updatePatient(patientForEditing.id, patientData);
        setSuccessMessage('Patient updated successfully!');
        console.log('✅ Patient updated:', result);
      } else {
        result = await addPatient(patientData);
        setLastRegisteredPatient(result);
        setSuccessMessage(`Patient registered successfully! OPD: ${result.opd_number}, Token: ${result.token_number}`);
        console.log('✅ Patient registered:', result);
      }

      // Reload patients to update the list
      await loadPatients();
      resetForm();

    } catch (error) {
      console.error('❌ Registration error:', error);
      setErrorMessage(`Registration failed: ${error.message || 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-charcoal-grey">
              {patientForEditing ? 'Edit Patient' : 'New OPD Registration — Kerala'}
            </h2>
            <p className="text-sm text-coral-red italic mt-1">
              പുതിയ വിസിറ്റ് രജിസ്ട്രേഷൻ • OPD Format: 001/25 • Asia/Kolkata • INR Currency
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
                <button
                  onClick={() => printOPD(lastRegisteredPatient)}
                  className="ml-4 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                >
                  Print OPD
                </button>
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
          {/* Patient Information Section */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-charcoal-grey border-b pb-2">
                Patient Information
              </h3>
              
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
                  Gender *
                </label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
                  placeholder="10-digit mobile number"
                  required
                />
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
                  placeholder="Patient address..."
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-charcoal-grey border-b pb-2">
                Visit Information
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned Doctor *
                </label>
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
                  required
                >
                  <option value="">Select Doctor</option>
                  {doctors && doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      Dr. {doctor.name} - {doctor.specialization}
                    </option>
                  ))}
                </select>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient Rating (-10 to +10)
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    value={patientRating}
                    onChange={(e) => setPatientRating(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #ef4444 0%, #fbbf24 50%, #10b981 100%)`
                    }}
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>-10 (Poor)</span>
                    <span className="font-bold text-lg">{patientRating}</span>
                    <span>+10 (Excellent)</span>
                  </div>
                  <div className={`text-center text-sm font-medium ${
                    patientRating >= 5 ? 'text-green-600' : 
                    patientRating >= 0 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {patientRating >= 5 ? 'Excellent Patient' : 
                     patientRating >= 0 ? 'Good Patient' : 'Difficult Patient'}
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

export default NewOPDPage;