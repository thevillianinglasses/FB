import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { patientsAPI, doctorsAPI, authAPI, usersAPI, labAPI, pharmacyAPI, nursingAPI, emrAPI } from './api';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [users, setUsers] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [medications, setMedications] = useState([]);
  const [patientForEditing, setPatientForEditing] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Simple, direct loading functions without useCallback to prevent infinite loops
  const loadDoctors = async () => {
    try {
      const doctorsData = await doctorsAPI.getAll();
      setDoctors(doctorsData);
      return doctorsData;
    } catch (error) {
      console.error('Error loading doctors:', error);
      throw error;
    }
  };

  const loadPatients = async () => {
    try {
      const patientsData = await patientsAPI.getAll();
      setPatients(patientsData);
      return patientsData;
    } catch (error) {
      console.error('Error loading patients:', error);
      throw error;
    }
  };

  const loadUsers = async () => {
    try {
      const usersData = await usersAPI.getAll();
      setUsers(usersData);
      return usersData;
    } catch (error) {
      console.error('Error loading users:', error);
      throw error;
    }
  };

  const loadLabTests = async () => {
    try {
      const testsData = await labAPI.getTests();
      setLabTests(testsData);
      return testsData;
    } catch (error) {
      console.error('Error loading lab tests:', error);
      throw error;
    }
  };

  const loadMedications = async () => {
    try {
      const medicationsData = await pharmacyAPI.getMedications();
      setMedications(medicationsData);
      return medicationsData;
    } catch (error) {
      console.error('Error loading medications:', error);
      throw error;
    }
  };

  // Simplified loadInitialData - only call when explicitly needed
  const loadInitialData = async () => {
    console.log('🔄 Starting initial data load...');
    
    if (!authAPI.isAuthenticated()) {
      console.log('❌ User not authenticated, skipping data load');
      return;
    }
    
    // Prevent multiple simultaneous loads
    if (isLoading) {
      console.log('⚠️ Already loading, skipping duplicate request');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const userRole = localStorage.getItem('userRole');
      console.log('📋 Loading data for role:', userRole);
      
      // Only load essential data to prevent overwhelming the API
      await loadDoctors();
      console.log('✅ Doctors loaded');
      
      await loadPatients();
      console.log('✅ Patients loaded');
      
      // Load role-specific data only if needed
      if (userRole === 'admin') {
        await loadUsers();
        console.log('✅ Users loaded for admin');
      }
      
      setIsDataLoaded(true);
      console.log('🎉 All initial data loaded successfully');
      
    } catch (error) {
      console.error('💥 Error loading initial data:', error);
      setError(`Failed to load data: ${error.message || 'Please refresh the page'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to add a new patient
  const addPatient = async (patientData) => {
    try {
      setIsLoading(true);
      const newPatient = await patientsAPI.create(patientData);
      setPatients(prevPatients => [newPatient, ...prevPatients]);
      return newPatient;
    } catch (error) {
      console.error('Error adding patient:', error);
      setError('Failed to add patient');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to update a patient
  const updatePatient = async (patientId, patientData) => {
    try {
      setIsLoading(true);
      const updatedPatient = await patientsAPI.update(patientId, patientData);
      setPatients(prevPatients => 
        prevPatients.map(p => p.id === patientId ? updatedPatient : p)
      );
      return updatedPatient;
    } catch (error) {
      console.error('Error updating patient:', error);
      setError('Failed to update patient');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to delete a patient
  const deletePatient = async (patientId) => {
    try {
      setIsLoading(true);
      await patientsAPI.delete(patientId);
      setPatients(prevPatients => prevPatients.filter(p => p.id !== patientId));
    } catch (error) {
      console.error('Error deleting patient:', error);
      setError('Failed to delete patient');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to add a new doctor
  const addDoctor = async (doctorData) => {
    try {
      setIsLoading(true);
      const newDoctor = await doctorsAPI.create(doctorData);
      setDoctors(prevDoctors => [...prevDoctors, newDoctor]);
      return newDoctor;
    } catch (error) {
      console.error('Error adding doctor:', error);
      setError('Failed to add doctor');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to add a new user (admin only)
  const addUser = async (userData) => {
    try {
      setIsLoading(true);
      const newUser = await usersAPI.create(userData);
      setUsers(prevUsers => [...prevUsers, newUser]);
      return newUser;
    } catch (error) {
      console.error('Error adding user:', error);
      setError('Failed to add user');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Clear error function
  const clearError = () => {
    setError(null);
  };

  const contextValue = {
    patients,
    doctors,
    users,
    labTests,
    medications,
    patientForEditing,
    setPatientForEditing,
    isLoading,
    error,
    isDataLoaded,
    addPatient,
    updatePatient,
    deletePatient,
    addDoctor,
    addUser,
    loadPatients,
    loadDoctors,
    loadUsers,
    loadLabTests,
    loadMedications,
    loadInitialData,
    clearError
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};