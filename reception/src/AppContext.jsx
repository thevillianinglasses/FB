import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [patients, setPatients] = useState([]); // Array to store patient objects
  const [doctors, setDoctors] = useState([ // Initial doctors list
    { id: 'doc1', name: 'Dr. Emily Carter', defaultFee: 150 },
    { id: 'doc2', name: 'Dr. John Adebayo', defaultFee: 200 },
  ]);
  const [opdSequence, setOpdSequence] = useState({ currentYear: new Date().getFullYear(), count: 0 }); // For OPD number NNN/YY
  const [tokenSequence, setTokenSequence] = useState(0); // For daily token number

  // Function to add a new patient
  const addPatient = (patientData) => {
    setPatients(prevPatients => [...prevPatients, patientData]);
    // Later, add logic for Unique ID, OPD number, Token number generation here or in NewOPDPage
  };

  // Function to add a new doctor
  const addDoctor = (doctorData) => {
    setDoctors(prevDoctors => [...prevDoctors, { ...doctorData, id: `doc${prevDoctors.length + 1}` }]);
  };
  
  // Function to get next OPD number string
  const getNextOpdNumber = () => {
    const year = new Date().getFullYear();
    let nextCount = opdSequence.count + 1;
    if (year !== opdSequence.currentYear) {
      nextCount = 1;
      setOpdSequence({ currentYear: year, count: nextCount });
    } else {
      setOpdSequence(prev => ({ ...prev, count: nextCount }));
    }
    return `${String(nextCount).padStart(3, '0')}/${String(year).slice(-2)}`;
  };

  // Function to get next Token number
  const getNextTokenNumber = () => {
    // This needs to be reset daily. For now, a simple increment.
    // Daily reset logic will be added when handling dates/timestamps more thoroughly.
    setTokenSequence(prev => prev + 1);
    return tokenSequence + 1; 
  };
  
  // Function to reset token sequence (e.g., to be called at the start of a new day)
  // Placeholder for now, actual daily reset needs a more robust mechanism
  const resetTokenSequence = () => {
    setTokenSequence(0);
  };


  const contextValue = {
    patients,
    addPatient,
    doctors,
    addDoctor,
    getNextOpdNumber,
    opdSequence, // Exposing for potential display or other logic
    setOpdSequence, // To allow reverting OPD number on cancellation
    getNextTokenNumber,
    tokenSequence, // Exposing for display
    resetTokenSequence 
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};
