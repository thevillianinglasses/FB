import React, { createContext, useState, useContext, useEffect } from 'react';
import { patientsAPI, doctorsAPI } from './api';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patientForEditing, setPatientForEditing] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load initial data
  useEffect(() => {
    loadDoctors();
    loadPatients();
  }, []);

  const loadDoctors = async () => {
    try {
      setIsLoading(true);
      const doctorsData = await doctorsAPI.getAll();
      setDoctors(doctorsData);
    } catch (error) {
      console.error('Error loading doctors:', error);
      setError('Failed to load doctors');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      setIsLoading(true);
      const patientsData = await patientsAPI.getAll();
      setPatients(patientsData);
    } catch (error) {
      console.error('Error loading patients:', error);
      setError('Failed to load patients');
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
    addPatient,
    updatePatient,
    deletePatient,
    addDoctor,
    loadPatients,
    loadDoctors,
    clearError
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};