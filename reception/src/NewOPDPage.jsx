import React, { useState, useEffect } from 'react';
import { useAppContext } from './AppContext'; // Assuming AppContext is in the same directory

function NewOPDPage() {
  const { addPatient, doctors, getNextOpdNumber, getNextTokenNumber } = useAppContext(); // Example usage

  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [dob, setDob] = useState('');
  const [sex, setSex] = useState(''); // e.g., 'Male', 'Female', 'Other'
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // For displaying OPD and Token numbers (will be properly generated later)
  const [currentOpd, setCurrentOpd] = useState('');
  const [currentToken, setCurrentToken] = useState('');

  useEffect(() => {
    // Simulate fetching initial OPD/Token for display when component mounts
    // In a real scenario, these might be fetched or calculated based on context state
    // For now, just to show something. Proper generation logic is in AppContext.
    // setCurrentOpd(getNextOpdNumber()); // This would advance the number on each render if not careful
    // setCurrentToken(getNextTokenNumber()); // Same here
  }, []);


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
    // Optionally clear DOB if age is manually entered, or allow both
    // For simplicity, we'll allow both for now
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Basic validation (can be expanded)
    if (!patientName || !age || !sex || !phoneNumber) {
      alert('Please fill all required fields: Name, Age, Sex, Phone Number.');
      return;
    }
    const patientData = { patientName, age, dob, sex, address, phoneNumber /*, opdNumber, tokenNumber, uniqueId etc. */ };
    // addPatient(patientData); // This will be enabled in a later step
    console.log('Form submitted (data not saved yet):', patientData);
    // Clear form or provide feedback
  };

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold text-charcoal-grey mb-6 border-b pb-3">New OPD Registration</h2>
      
      {/* Display OPD and Token numbers - for now placeholders, real values in later step */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-100 p-3 rounded-md shadow-sm">
          <label className="block text-sm font-medium text-charcoal-grey">OPD Number</label>
          <p className="text-lg text-cornflower-blue font-semibold">{currentOpd || 'Not Generated'}</p>
        </div>
        <div className="bg-gray-100 p-3 rounded-md shadow-sm">
          <label className="block text-sm font-medium text-charcoal-grey">Token Number</label>
          <p className="text-lg text-cornflower-blue font-semibold">{currentToken || 'Not Generated'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Name */}
        <div>
          <label htmlFor="patientName" className="block text-sm font-medium text-charcoal-grey">Patient Name <span className="text-coral-red">*</span></label>
          <input type="text" id="patientName" value={patientName} onChange={(e) => setPatientName(e.target.value)}
                 className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cornflower-blue focus:border-cornflower-blue sm:text-sm" required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date of Birth */}
          <div>
            <label htmlFor="dob" className="block text-sm font-medium text-charcoal-grey">Date of Birth</label>
            <input type="date" id="dob" value={dob} onChange={handleDobChange}
                   className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cornflower-blue focus:border-cornflower-blue sm:text-sm" />
          </div>
          {/* Age */}
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-charcoal-grey">Age <span className="text-coral-red">*</span></label>
            <input type="number" id="age" value={age} onChange={handleAgeChange}
                   className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cornflower-blue focus:border-cornflower-blue sm:text-sm" required />
          </div>
        </div>

        {/* Sex */}
        <div>
          <label htmlFor="sex" className="block text-sm font-medium text-charcoal-grey">Sex <span className="text-coral-red">*</span></label>
          <select id="sex" value={sex} onChange={(e) => setSex(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cornflower-blue focus:border-cornflower-blue sm:text-sm" required>
            <option value="">Select Sex</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Address */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-charcoal-grey">Address</label>
          <textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} rows="3"
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cornflower-blue focus:border-cornflower-blue sm:text-sm"></textarea>
        </div>

        {/* Phone Number */}
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-charcoal-grey">Phone Number <span className="text-coral-red">*</span></label>
          <input type="tel" id="phoneNumber" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                 className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cornflower-blue focus:border-cornflower-blue sm:text-sm" required />
        </div>
        
        {/* Submit Button - Will be enhanced later */}
        <div className="pt-4">
          <button type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cornflower-blue hover:bg-opacity-85 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cornflower-blue">
            Register Patient (Placeholder)
          </button>
        </div>
      </form>
    </div>
  );
}

export default NewOPDPage;
