import React, { createContext, useState, useContext, useEffect } from 'react';
import { patientsAPI, doctorsAPI, authAPI } from './api';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patientForEditing, setPatientForEditing] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Only load data if user is authenticated
  const loadInitialData = async () => {
    if (!authAPI.isAuthenticated()) {
      return; // Don't load data if not authenticated
    }
    
    try {
      setIsLoading(true);
      setError(null);
      await Promise.all([loadDoctors(), loadPatients()]);
      setIsDataLoaded(true);
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Failed to load initial data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDoctors = async () => {
    try {
      const doctorsData = await doctorsAPI.getAll();
      setDoctors(doctorsData);
    } catch (error) {
      console.error('Error loading doctors:', error);
      // Don't set error state here since this might be called before auth
      if (error.response?.status !== 403 && error.response?.status !== 401) {
        throw error;
      }
    }
  };

  const loadPatients = async () => {
    try {
      const patientsData = await patientsAPI.getAll();
      setPatients(patientsData);
    } catch (error) {
      console.error('Error loading patients:', error);
      // Don't set error state here since this might be called before auth
      if (error.response?.status !== 403 && error.response?.status !== 401) {
        throw error;
      }
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

  // Clear error function
  const clearError = () => {
    setError(null);
  };

  const contextValue = {
    patients,
    doctors,
    patientForEditing,
    setPatientForEditing,
    isLoading,
    error,
    isDataLoaded,
    addPatient,
    updatePatient,
    deletePatient,
    addDoctor,
    loadPatients,
    loadDoctors,
    loadInitialData,
    clearError
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};