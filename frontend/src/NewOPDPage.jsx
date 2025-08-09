import React, { useState, useEffect } from 'react';
import { useAppContext } from './AppContext';

function NewOPDPage() {
  const { addPatient, updatePatient, doctors, patientForEditing, setPatientForEditing, isLoading } = useAppContext();

  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [dob, setDob] = useState('');
  const [sex, setSex] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Populate form if editing existing patient
  useEffect(() => {
    if (patientForEditing) {
      setPatientName(patientForEditing.patient_name || '');
      setAge(patientForEditing.age || '');
      setDob(patientForEditing.dob || '');
      setSex(patientForEditing.sex || '');
      setAddress(patientForEditing.address || '');
      setPhoneNumber(patientForEditing.phone_number || '');
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

  const clearForm = () => {
    setPatientName('');
    setAge('');
    setDob('');
    setSex('');
    setAddress('');
    setPhoneNumber('');
    setPatientForEditing(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    // Basic validation
    if (!patientName || !age || !sex || !phoneNumber) {
      setErrorMessage('Please fill all required fields: Name, Age, Sex, Phone Number.');
      setIsSubmitting(false);
      return;
    }

    try {
      const patientData = {
        patient_name: patientName,
        age: age,
        dob: dob,
        sex: sex,
        address: address,
        phone_number: phoneNumber
      };

      let result;
      if (patientForEditing) {
        // Update existing patient
        result = await updatePatient(patientForEditing.id, { ...patientData, id: patientForEditing.id });
        setSuccessMessage(`Patient ${result.patient_name} updated successfully! OPD: ${result.opd_number}, Token: ${result.token_number}`);
      } else {
        // Add new patient
        result = await addPatient(patientData);
        setSuccessMessage(`Patient ${result.patient_name} registered successfully! OPD: ${result.opd_number}, Token: ${result.token_number}`);
      }

      clearForm();
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Error submitting patient:', error);
      setErrorMessage(error.response?.data?.detail || 'Failed to save patient. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    clearForm();
    setErrorMessage('');
    setSuccessMessage('');
  };

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-charcoal-grey border-b pb-3">
          {patientForEditing ? 'Edit Patient' : 'New OPD Registration'}
        </h2>
        {patientForEditing && (
          <button
            onClick={handleCancel}
            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded"
          >
            Cancel Edit
          </button>
        )}
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}
      
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorMessage}
        </div>
      )}

      {/* Display current editing patient info */}
      {patientForEditing && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-100 p-3 rounded-lg shadow-sm">
            <label className="block text-sm font-medium text-charcoal-grey">Current OPD Number</label>
            <p className="text-lg text-cornflower-blue font-semibold">{patientForEditing.opd_number || 'N/A'}</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-lg shadow-sm">
            <label className="block text-sm font-medium text-charcoal-grey">Current Token Number</label>
            <p className="text-lg text-cornflower-blue font-semibold">{patientForEditing.token_number || 'N/A'}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Name */}
        <div>
          <label htmlFor="patientName" className="block text-sm font-medium text-charcoal-grey">
            Patient Name <span className="text-coral-red">*</span>
          </label>
          <input 
            type="text" 
            id="patientName" 
            value={patientName} 
            onChange={(e) => setPatientName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-cornflower-blue rounded-md shadow-sm focus:outline-none focus:ring-cornflower-blue focus:border-cornflower-blue sm:text-sm" 
            required 
            disabled={isSubmitting}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date of Birth */}
          <div>
            <label htmlFor="dob" className="block text-sm font-medium text-charcoal-grey">Date of Birth</label>
            <input 
              type="date" 
              id="dob" 
              value={dob} 
              onChange={handleDobChange}
              className="mt-1 block w-full px-3 py-2 bg-white border border-cornflower-blue rounded-md shadow-sm focus:outline-none focus:ring-cornflower-blue focus:border-cornflower-blue sm:text-sm" 
              disabled={isSubmitting}
            />
          </div>
          {/* Age */}
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-charcoal-grey">
              Age <span className="text-coral-red">*</span>
            </label>
            <input 
              type="number" 
              id="age" 
              value={age} 
              onChange={handleAgeChange}
              className="mt-1 block w-full px-3 py-2 bg-white border border-cornflower-blue rounded-md shadow-sm focus:outline-none focus:ring-cornflower-blue focus:border-cornflower-blue sm:text-sm" 
              required 
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Sex */}
        <div>
          <label htmlFor="sex" className="block text-sm font-medium text-charcoal-grey">
            Sex <span className="text-coral-red">*</span>
          </label>
          <select 
            id="sex" 
            value={sex} 
            onChange={(e) => setSex(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-cornflower-blue rounded-md shadow-sm focus:outline-none focus:ring-cornflower-blue focus:border-cornflower-blue sm:text-sm" 
            required
            disabled={isSubmitting}
          >
            <option value="">Select Sex</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Address */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-charcoal-grey">Address</label>
          <textarea 
            id="address" 
            value={address} 
            onChange={(e) => setAddress(e.target.value)} 
            rows="3"
            className="mt-1 block w-full px-3 py-2 bg-white border border-cornflower-blue rounded-md shadow-sm focus:outline-none focus:ring-cornflower-blue focus:border-cornflower-blue sm:text-sm"
            disabled={isSubmitting}
          ></textarea>
        </div>

        {/* Phone Number */}
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-charcoal-grey">
            Phone Number <span className="text-coral-red">*</span>
          </label>
          <input 
            type="tel" 
            id="phoneNumber" 
            value={phoneNumber} 
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-cornflower-blue rounded-md shadow-sm focus:outline-none focus:ring-cornflower-blue focus:border-cornflower-blue sm:text-sm" 
            required 
            disabled={isSubmitting}
          />
        </div>
        
        {/* Submit Button */}
        <div className="pt-4 flex gap-4">
          <button 
            type="submit"
            disabled={isSubmitting || isLoading}
            className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cornflower-blue hover:bg-opacity-85 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cornflower-blue disabled:opacity-50"
          >
            {isSubmitting 
              ? (patientForEditing ? 'Updating...' : 'Registering...') 
              : (patientForEditing ? 'Update Patient' : 'Register Patient')
            }
          </button>
          
          {patientForEditing && (
            <button 
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cornflower-blue disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default NewOPDPage;