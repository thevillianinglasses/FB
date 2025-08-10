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

  // Only load data if user is authenticated and based on their role
  const loadInitialData = useCallback(async () => {
    if (!authAPI.isAuthenticated()) {
      return; // Don't load data if not authenticated
    }
    
    const userRole = localStorage.getItem('userRole');
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Load basic data that all roles need
      await Promise.all([loadDoctors(), loadPatients()]);
      
      // Load role-specific data
      if (userRole === 'admin') {
        await loadUsers();
      }
      
      if (userRole === 'laboratory' || userRole === 'admin') {
        await loadLabTests();
      }
      
      if (userRole === 'pharmacy' || userRole === 'doctor' || userRole === 'admin') {
        await loadMedications();
      }
      
      setIsDataLoaded(true);
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Failed to load initial data');
    } finally {
      setIsLoading(false);
    }
  }, [loadDoctors, loadPatients, loadUsers, loadLabTests, loadMedications]); // Add all dependent functions

  const loadDoctors = useCallback(async () => {
    try {
      const doctorsData = await doctorsAPI.getAll();
      setDoctors(doctorsData);
    } catch (error) {
      console.error('Error loading doctors:', error);
      if (error.response?.status !== 403 && error.response?.status !== 401) {
        throw error;
      }
    }
  }, []);

  const loadPatients = useCallback(async () => {
    try {
      const patientsData = await patientsAPI.getAll();
      setPatients(patientsData);
    } catch (error) {
      console.error('Error loading patients:', error);
      if (error.response?.status !== 403 && error.response?.status !== 401) {
        throw error;
      }
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const usersData = await usersAPI.getAll();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      if (error.response?.status !== 403 && error.response?.status !== 401) {
        throw error;
      }
    }
  }, []);

  const loadLabTests = useCallback(async () => {
    try {
      const testsData = await labAPI.getTests();
      setLabTests(testsData);
    } catch (error) {
      console.error('Error loading lab tests:', error);
      if (error.response?.status !== 403 && error.response?.status !== 401) {
        throw error;
      }
    }
  }, []);

  const loadMedications = useCallback(async () => {
    try {
      const medicationsData = await pharmacyAPI.getMedications();
      setMedications(medicationsData);
    } catch (error) {
      console.error('Error loading medications:', error);
      if (error.response?.status !== 403 && error.response?.status !== 401) {
        throw error;
      }
    }
  }, []);

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