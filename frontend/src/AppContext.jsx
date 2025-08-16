import React, { createContext, useState, useContext } from 'react';
import { patientsAPI, doctorsAPI, authAPI, usersAPI, appointmentsAPI } from './api';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [patientForEditing, setPatientForEditing] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Simple loading functions without infinite loops
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

  // Function to update a doctor
  const updateDoctor = async (doctorId, doctorData) => {
    try {
      setIsLoading(true);
      const updatedDoctor = await doctorsAPI.update(doctorId, doctorData);
      setDoctors(prevDoctors => 
        prevDoctors.map(d => d.id === doctorId ? updatedDoctor : d)
      );
      return updatedDoctor;
    } catch (error) {
      console.error('Error updating doctor:', error);
      setError('Failed to update doctor');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to delete a doctor
  const deleteDoctor = async (doctorId) => {
    try {
      setIsLoading(true);
      await doctorsAPI.delete(doctorId);
      setDoctors(prevDoctors => prevDoctors.filter(d => d.id !== doctorId));
    } catch (error) {
      console.error('Error deleting doctor:', error);
      setError('Failed to delete doctor');
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

  // Appointment management functions
  const loadAppointments = async (filters = {}) => {
    try {
      const appointmentsData = await appointmentsAPI.getAll(filters);
      setAppointments(appointmentsData);
      return appointmentsData;
    } catch (error) {
      console.error('Error loading appointments:', error);
      throw error;
    }
  };

  const addAppointment = async (appointmentData) => {
    try {
      setIsLoading(true);
      const newAppointment = await appointmentsAPI.create(appointmentData);
      setAppointments(prevAppointments => [newAppointment, ...prevAppointments]);
      return newAppointment;
    } catch (error) {
      console.error('Error adding appointment:', error);
      setError('Failed to add appointment');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateAppointment = async (appointmentId, appointmentData) => {
    try {
      setIsLoading(true);
      const updatedAppointment = await appointmentsAPI.update(appointmentId, appointmentData);
      setAppointments(prevAppointments => 
        prevAppointments.map(a => a.id === appointmentId ? updatedAppointment : a)
      );
      return updatedAppointment;
    } catch (error) {
      console.error('Error updating appointment:', error);
      setError('Failed to update appointment');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      setIsLoading(true);
      const updatedAppointment = await appointmentsAPI.updateStatus(appointmentId, status);
      setAppointments(prevAppointments => 
        prevAppointments.map(a => a.id === appointmentId ? updatedAppointment : a)
      );
      return updatedAppointment;
    } catch (error) {
      console.error('Error updating appointment status:', error);
      setError('Failed to update appointment status');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAppointment = async (appointmentId) => {
    try {
      setIsLoading(true);
      await appointmentsAPI.delete(appointmentId);
      setAppointments(prevAppointments => prevAppointments.filter(a => a.id !== appointmentId));
    } catch (error) {
      console.error('Error deleting appointment:', error);
      setError('Failed to delete appointment');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getTodaysAppointments = async () => {
    try {
      const todaysAppointments = await appointmentsAPI.getToday();
      return todaysAppointments;
    } catch (error) {
      console.error('Error getting today\'s appointments:', error);
      throw error;
    }
  };

  const getDoctorAppointments = async (doctorId, date = null) => {
    try {
      const doctorAppointments = await appointmentsAPI.getByDoctor(doctorId, date);
      return doctorAppointments;
    } catch (error) {
      console.error('Error getting doctor appointments:', error);
      throw error;
    }
  };

  const contextValue = {
    patients,
    doctors,
    users,
    appointments,
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
    loadAppointments,
    addAppointment,
    updateAppointment,
    updateAppointmentStatus,
    deleteAppointment,
    getTodaysAppointments,
    getDoctorAppointments,
    clearError
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};