import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAppContext } from './AppContext';
import { patientsAPI, doctorsAPI, departmentsAPI, appointmentsAPI } from './api';
import DepartmentDoctorSelector from './components/shared/DepartmentDoctorSelector';

function AppointmentSchedulingEnhanced() {
  const { 
    patients, loadPatients, doctors, loadDoctors, isLoading, addPatient,
    appointments, loadAppointments, addAppointment, updateAppointmentStatus,
    getTodaysAppointments
  } = useAppContext();
  
  // State management
  const [view, setView] = useState('day'); // 'day', 'week', 'today-appointments'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 days from now
  });
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showPatientDetails, setShowPatientDetails] = useState(false);
  const [showDoctorSearch, setShowDoctorSearch] = useState(false);
  const [doctorSearchTerm, setDoctorSearchTerm] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  
  // New appointment form state
  const [newAppointment, setNewAppointment] = useState({
    patientName: '',
    phoneNumber: '',
    selectedPatient: null,
    doctorId: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '',
    duration: '30',
    reason: '',
    type: 'Consultation',
    notes: ''
  });

  // Time slots for appointments (9 AM to 6 PM)
  const timeSlots = [];
  for (let hour = 9; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeSlots.push(time);
    }
  }

  // Days of the week for week view
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    loadPatients();
    loadDoctors();
    loadRealAppointments();
  }, [selectedDate, dateRange]);

  // Load real appointments from backend instead of sample data
  const loadRealAppointments = async () => {
    try {
      // Load appointments with date filter if needed
      const filters = {};
      if (view === 'day') {
        filters.date = selectedDate;
      }
      
      await loadAppointments(filters);
      // Appointments are now stored in AppContext, no need to setAppointments locally
    } catch (error) {
      console.error('Error loading appointments:', error);
      // AppContext will handle the error state
    }
  };

  // Filter appointments by doctor search
  const getFilteredAppointmentsByDoctor = () => {
    let filtered = appointments;
    
    if (selectedDoctor) {
      filtered = filtered.filter(apt => apt.doctor_id === selectedDoctor);
    }
    
    return filtered;
  };

  // Get appointments for date range
  const getAppointmentsForDateRange = () => {
    return appointments.filter(apt => 
      apt.appointment_date >= dateRange.startDate && 
      apt.appointment_date <= dateRange.endDate
    );
  };

  // Get today's appointments with contact details
  const getFilteredTodaysAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter(apt => apt.appointment_date === today)
      .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));
  };

  // Get week dates
  const getWeekDates = (startDate) => {
    const dates = [];
    const start = new Date(startDate);
    const startOfWeek = new Date(start.setDate(start.getDate() - start.getDay()));
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  // Handle patient search and auto-fill
  const handlePatientSearch = (searchTerm) => {
    if (searchTerm.length === 10 && /^\d+$/.test(searchTerm)) {
      // Phone number search
      const matchingPatients = patients.filter(p => p.phone_number === searchTerm);
      if (matchingPatients.length > 0) {
        const patient = matchingPatients[0];
        setNewAppointment(prev => ({
          ...prev,
          phoneNumber: searchTerm,
          patientName: patient.patient_name,
          selectedPatient: patient
        }));
      }
    } else if (searchTerm.length > 2) {
      // Name search
      const matchingPatients = patients.filter(p => 
        p.patient_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (matchingPatients.length === 1) {
        const patient = matchingPatients[0];
        setNewAppointment(prev => ({
          ...prev,
          patientName: patient.patient_name,
          phoneNumber: patient.phone_number,
          selectedPatient: patient
        }));
      }
    }
  };

  // Handle doctor search
  const handleDoctorSearch = (searchTerm) => {
    setDoctorSearchTerm(searchTerm);
    if (searchTerm.length > 1) {
      setShowDoctorSearch(true);
    } else {
      setShowDoctorSearch(false);
    }
  };

  // Check if time slot is available
  const isTimeSlotAvailable = (date, time, doctorId) => {
    return !appointments.some(apt => 
      apt.appointment_date === date && 
      apt.appointment_time === time && 
      apt.doctor_id === doctorId &&
      apt.status !== 'Cancelled'
    );
  };

  // Get appointments for a specific date and doctor
  const getAppointmentsForDateAndDoctor = (date, doctorId) => {
    return appointments.filter(apt => 
      apt.appointmentDate === date && 
      (doctorId ? apt.doctorId === doctorId : true) &&
      apt.status !== 'Cancelled'
    ).sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime));
  };

  // Handle appointment double click to show details
  const handleAppointmentDoubleClick = (appointment) => {
    setSelectedAppointment(appointment);
    setShowPatientDetails(true);
  };

  // Handle new appointment submission
  const handleNewAppointmentSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!newAppointment.patientName || !newAppointment.phoneNumber || !newAppointment.doctorId || !newAppointment.appointmentTime) {
      alert('Please fill in all required fields');
      return;
    }

    // Check if time slot is available
    if (!isTimeSlotAvailable(newAppointment.appointmentDate, newAppointment.appointmentTime, newAppointment.doctorId)) {
      alert('This time slot is not available. Please choose another time.');
      return;
    }

    try {
      // Create appointment data in the format expected by backend
      const appointmentData = {
        patient_name: newAppointment.patientName,
        phone_number: newAppointment.phoneNumber,
        patient_details: {
          age: newAppointment.selectedPatient?.age || '',
          sex: newAppointment.selectedPatient?.sex || '',
          address: newAppointment.selectedPatient?.address || ''
        },
        doctor_id: newAppointment.doctorId,
        appointment_date: newAppointment.appointmentDate,
        appointment_time: newAppointment.appointmentTime,
        duration: newAppointment.duration,
        reason: newAppointment.reason,
        type: newAppointment.type,
        notes: newAppointment.notes || ''
      };

      console.log('Creating appointment:', appointmentData);

      // Use AppContext addAppointment function to save to backend
      const createdAppointment = await addAppointment(appointmentData);
      
      console.log('Appointment created successfully:', createdAppointment);
      
      // Reset form
      setNewAppointment({
        patientName: '',
        phoneNumber: '',
        selectedPatient: null,
        doctorId: '',
        appointmentDate: new Date().toISOString().split('T')[0],
        appointmentTime: '',
        duration: '30',
        reason: '',
        type: 'Consultation',
        notes: ''
      });
      
      // Close the modal
      setShowNewAppointment(false);
      
      // Reload appointments to show the new one
      await loadRealAppointments();
      
      alert(`✅ Appointment scheduled successfully!\n\nPatient: ${appointmentData.patient_name}\nDate: ${appointmentData.appointment_date}\nTime: ${appointmentData.appointment_time}\nDoctor: ${getDoctorName(appointmentData.doctor_id)}`);
      
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert(`❌ Failed to create appointment: ${error.message || 'Please try again.'}`);
    }
  };

  // Handle appointment status change
  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      await updateAppointmentStatus(appointmentId, newStatus);
      // The appointment state will be updated by the updateAppointmentStatus function in AppContext
    } catch (error) {
      console.error('Error updating appointment status:', error);
      alert('Failed to update appointment status. Please try again.');
    }
  };

  // Handle check-in (convert appointment to live visit)
  const handleCheckIn = async (appointment) => {
    const confirmCheckIn = window.confirm(
      `Check in ${appointment.patientName} for their appointment?\n\n` +
      `This will:\n` +
      `• Create a new OPD visit\n` +
      `• Add them to today's Patient Log (24-hour)\n` +
      `• Generate token number\n` +
      `• Update appointment status to "Checked In"`
    );
    
    if (confirmCheckIn) {
      try {
        // Create patient record through proper backend API
        const patientData = {
          patient_name: appointment.patientName,
          phone_number: appointment.phoneNumber,
          age: appointment.patientDetails?.age?.toString() || '30',
          dob: appointment.patientDetails?.dob || '',
          sex: appointment.patientDetails?.sex || 'Male',
          address: appointment.patientDetails?.address || '',
          email: '',
          emergency_contact_name: '',
          emergency_contact_phone: '',
          allergies: '',
          medical_history: '',
          assigned_doctor: appointment.doctorId,
          visit_type: appointment.type || 'Consultation',
          patient_rating: 0
        };

        console.log('🔄 Checking in patient via backend API:', patientData);

        // Use the proper addPatient function from AppContext
        const result = await addPatient(patientData);
        
        console.log('✅ Patient checked in successfully:', result);

        // Update appointment status
        handleStatusChange(appointment.id, 'Checked In');
        
        // Reload patients to update all lists
        await loadPatients();
        
        alert(
          `✅ ${appointment.patientName} checked in successfully!\n\n` +
          `OPD Number: ${result.opd_number || 'Generated'}\n` +
          `Token Number: ${result.token_number || 'Generated'}\n` +
          `Doctor: ${getDoctorName(appointment.doctorId)}\n\n` +
          `Patient has been added to today's Patient Log.`
        );
      } catch (error) {
        console.error('❌ Error during check-in:', error);
        alert(
          `❌ Check-in failed: ${error.message || 'Please try again.'}\n\n` +
          `The appointment status has not been changed. Please contact reception.`
        );
      }
    }
  };

  // Generate OPD number for check-in
  const generateOPDNumber = () => {
    const currentYear = new Date().getFullYear();
    const yearSuffix = currentYear.toString().slice(-2);
    const randomNumber = Math.floor(Math.random() * 900) + 100; // Random 3-digit number
    return `${randomNumber}/${yearSuffix}`;
  };

  // Generate token number for check-in
  const generateTokenNumber = (doctorId) => {
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = appointments.filter(apt => 
      apt.appointmentDate === today && 
      apt.doctorId === doctorId && 
      apt.status === 'Checked In'
    );
    return todayAppointments.length + 1;
  };

  // Get doctor name
  const getDoctorName = (doctorId) => {
    const doctor = doctors.find(d => d.id === doctorId);
    return doctor ? `Dr. ${doctor.name}` : 'Unknown Doctor';
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata'
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      case 'Confirmed': return 'bg-green-100 text-green-800';
      case 'Checked In': return 'bg-purple-100 text-purple-800';
      case 'Completed': return 'bg-gray-100 text-gray-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'No Show': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-charcoal-grey">Appointment Scheduling</h2>
              <p className="text-sm text-coral-red italic mt-1">
                Enhanced Calendar Views • Doctor Search • Patient Details • Today's Appointments • Unicare Polyclinic • Kerala
              </p>
            </div>
            <button
              onClick={() => setShowNewAppointment(true)}
              className="bg-cornflower-blue hover:bg-opacity-80 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <span>+</span>
              <span>New Appointment</span>
            </button>
          </div>
        </div>

        {/* View Controls */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-4">
              <div className="flex bg-white rounded-lg border">
                {['day', 'week', 'today-appointments'].map((viewType) => (
                  <button
                    key={viewType}
                    onClick={() => setView(viewType)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg ${
                      view === viewType
                        ? 'bg-cornflower-blue text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {viewType === 'today-appointments' ? "Today's List" : 
                     viewType.charAt(0).toUpperCase() + viewType.slice(1) + ' View'}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              {view === 'day' ? formatDate(selectedDate) : 
               view === 'week' ? `Week of ${formatDate(dateRange.startDate)}` :
               `Today's Appointments - ${formatDate(new Date().toISOString().split('T')[0])}`}
            </div>
          </div>

          {/* Date and Search Controls */}
          <div className="grid md:grid-cols-4 gap-4">
            {view === 'day' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
                />
              </div>
            )}

            {view === 'week' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
                  />
                </div>
              </>
            )}

            {/* Doctor Search */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Doctor</label>
              <input
                type="text"
                value={doctorSearchTerm}
                onChange={(e) => handleDoctorSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
                placeholder="Type doctor name..."
              />
              
              {/* Doctor Search Dropdown */}
              {showDoctorSearch && doctorSearchTerm && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {doctors
                    .filter(d => d.name.toLowerCase().includes(doctorSearchTerm.toLowerCase()))
                    .map(doctor => (
                      <button
                        key={doctor.id}
                        onClick={() => {
                          setSelectedDoctor(doctor.id);
                          setDoctorSearchTerm(`Dr. ${doctor.name}`);
                          setShowDoctorSearch(false);
                        }}
                        className="w-full text-left p-3 hover:bg-blue-50 border-b last:border-b-0"
                      >
                        <div className="font-medium">Dr. {doctor.name}</div>
                        <div className="text-sm text-gray-500">{doctor.specialty}</div>
                      </button>
                    ))}
                  <button
                    onClick={() => {
                      setSelectedDoctor('');
                      setDoctorSearchTerm('');
                      setShowDoctorSearch(false);
                    }}
                    className="w-full text-left p-3 bg-gray-50 text-gray-600"
                  >
                    Clear filter - Show all doctors
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedDate(new Date().toISOString().split('T')[0]);
                  setDateRange({
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                  });
                  setSelectedDoctor('');
                  setDoctorSearchTerm('');
                }}
                className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Appointments View */}
        <div className="p-6">
          {view === 'day' && (
            <div className="space-y-6">
              {getFilteredAppointmentsByDoctor().length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No appointments scheduled for {formatDate(selectedDate)}</p>
                  {selectedDoctor && <p>Filtered by: {getDoctorName(selectedDoctor)}</p>}
                </div>
              ) : (
                <div className="space-y-4">
                  {getAppointmentsForDateAndDoctor(selectedDate, selectedDoctor).map(appointment => (
                    <div 
                      key={appointment.id} 
                      onDoubleClick={() => handleAppointmentDoubleClick(appointment)}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                      title="Double-click to view patient details"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-lg font-bold text-cornflower-blue min-w-16">
                          {appointment.appointment_time}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.patient_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {appointment.phone_number} • {getDoctorName(appointment.doctor_id)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {appointment.reason}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                        
                        {appointment.status === 'Confirmed' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCheckIn(appointment);
                            }}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                          >
                            Check In
                          </button>
                        )}
                        
                        <select
                          value={appointment.status}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleStatusChange(appointment.id, e.target.value);
                          }}
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="Scheduled">Scheduled</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Checked In">Checked In</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="No Show">No Show</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {view === 'week' && (
            <div className="overflow-x-auto">
              <div className="grid grid-cols-7 gap-2 min-w-full">
                {getWeekDates(dateRange.startDate).map((date, index) => (
                  <div key={date} className="border rounded-lg p-3">
                    <div className="text-center font-semibold text-gray-700 mb-2">
                      <div className="text-sm">{daysOfWeek[index]}</div>
                      <div className="text-lg">{new Date(date).getDate()}</div>
                    </div>
                    
                    <div className="space-y-1">
                      {getAppointmentsForDateAndDoctor(date, selectedDoctor).map(appointment => (
                        <div 
                          key={appointment.id}
                          onDoubleClick={() => handleAppointmentDoubleClick(appointment)}
                          className="p-2 bg-blue-50 hover:bg-blue-100 rounded text-xs cursor-pointer"
                          title="Double-click for details"
                        >
                          <div className="font-medium">{appointment.appointmentTime}</div>
                          <div className="text-gray-600 truncate">{appointment.patientName}</div>
                          <div className={`text-xs px-1 rounded ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'today-appointments' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Today's Appointments - Contact Details
                </h3>
                <div className="flex items-center space-x-4">
                  {/* Doctor Filter for Today's List */}
                  <div className="relative">
                    <select
                      value={selectedDoctor}
                      onChange={(e) => setSelectedDoctor(e.target.value)}
                      className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
                    >
                      <option value="">All Doctors</option>
                      {doctors.map(doctor => (
                        <option key={doctor.id} value={doctor.id}>
                          Dr. {doctor.name} - {doctor.specialty}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {getFilteredTodaysAppointments().filter(apt => selectedDoctor ? apt.doctor_id === selectedDoctor : true).length} appointments
                    {selectedDoctor && ` for ${getDoctorName(selectedDoctor)}`}
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border p-3 text-left text-sm font-medium text-gray-700">Time</th>
                      <th className="border p-3 text-left text-sm font-medium text-gray-700">Patient Name</th>
                      <th className="border p-3 text-left text-sm font-medium text-gray-700">Phone Number</th>
                      <th className="border p-3 text-left text-sm font-medium text-gray-700">Age/Sex</th>
                      <th className="border p-3 text-left text-sm font-medium text-gray-700">Address</th>
                      <th className="border p-3 text-left text-sm font-medium text-gray-700">Doctor</th>
                      <th className="border p-3 text-left text-sm font-medium text-gray-700">Status</th>
                      <th className="border p-3 text-left text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredTodaysAppointments()
                      .filter(apt => selectedDoctor ? apt.doctor_id === selectedDoctor : true)
                      .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time))
                      .map(appointment => (
                      <tr key={appointment.id} className="hover:bg-gray-50">
                        <td className="border p-3 font-medium text-cornflower-blue">
                          {appointment.appointmentTime}
                        </td>
                        <td className="border p-3 font-medium">
                          {appointment.patientName}
                        </td>
                        <td className="border p-3">
                          <a href={`tel:${appointment.phoneNumber}`} className="text-blue-600 hover:underline">
                            {appointment.phoneNumber}
                          </a>
                        </td>
                        <td className="border p-3">
                          {appointment.patientDetails?.age} / {appointment.patientDetails?.sex}
                        </td>
                        <td className="border p-3 text-sm">
                          {appointment.patientDetails?.address}
                        </td>
                        <td className="border p-3">
                          {getDoctorName(appointment.doctorId)}
                        </td>
                        <td className="border p-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </td>
                        <td className="border p-3">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleAppointmentDoubleClick(appointment)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Details
                            </button>
                            {appointment.status === 'Confirmed' && (
                              <button
                                onClick={() => handleCheckIn(appointment)}
                                className="text-green-600 hover:text-green-800 text-sm"
                              >
                                Check In
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {getFilteredTodaysAppointments().filter(apt => selectedDoctor ? apt.doctor_id === selectedDoctor : true).length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-gray-500">
                      {selectedDoctor ? 
                        `No appointments for ${getDoctorName(selectedDoctor)} today.` : 
                        'No appointments scheduled for today.'
                      }
                    </td>
                  </tr>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Patient Details Modal */}
      {showPatientDetails && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Patient Details</h3>
              <button
                onClick={() => setShowPatientDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Name:</span>
                <span>{selectedAppointment.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Phone:</span>
                <span>
                  <a href={`tel:${selectedAppointment.phoneNumber}`} className="text-blue-600 hover:underline">
                    {selectedAppointment.phoneNumber}
                  </a>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Age/Sex:</span>
                <span>{selectedAppointment.patientDetails?.age} years, {selectedAppointment.patientDetails?.sex}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Address:</span>
                <span className="text-right">{selectedAppointment.patientDetails?.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Appointment:</span>
                <span>{formatDate(selectedAppointment.appointmentDate)} at {selectedAppointment.appointmentTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Doctor:</span>
                <span>{getDoctorName(selectedAppointment.doctorId)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Reason:</span>
                <span className="text-right">{selectedAppointment.reason}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Status:</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedAppointment.status)}`}>
                  {selectedAppointment.status}
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPatientDetails(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              {selectedAppointment.status === 'Confirmed' && (
                <button
                  onClick={() => {
                    handleCheckIn(selectedAppointment);
                    setShowPatientDetails(false);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Check In Patient
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Appointment Modal - Enhanced */}
      {showNewAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl m-4 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Schedule New Appointment</h3>
              <button
                onClick={() => setShowNewAppointment(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleNewAppointmentSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    value={newAppointment.patientName}
                    onChange={(e) => {
                      setNewAppointment(prev => ({ ...prev, patientName: e.target.value }));
                      handlePatientSearch(e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
                    placeholder="Enter patient name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={newAppointment.phoneNumber}
                    onChange={(e) => {
                      setNewAppointment(prev => ({ ...prev, phoneNumber: e.target.value }));
                      handlePatientSearch(e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
                    placeholder="10-digit mobile number"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Doctor *
                  </label>
                  <select
                    value={newAppointment.doctorId}
                    onChange={(e) => setNewAppointment(prev => ({ ...prev, doctorId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
                    required
                  >
                    <option value="">Select Doctor</option>
                    {doctors.map(doctor => (
                      <option key={doctor.id} value={doctor.id}>
                        Dr. {doctor.name} - {doctor.specialty}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Appointment Type
                  </label>
                  <select
                    value={newAppointment.type}
                    onChange={(e) => setNewAppointment(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
                  >
                    <option value="Consultation">Consultation</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Check-up">Check-up</option>
                    <option value="Procedure">Procedure</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={newAppointment.appointmentDate}
                    onChange={(e) => setNewAppointment(prev => ({ ...prev, appointmentDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time *
                  </label>
                  <select
                    value={newAppointment.appointmentTime}
                    onChange={(e) => setNewAppointment(prev => ({ ...prev, appointmentTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
                    required
                  >
                    <option value="">Select Time</option>
                    {timeSlots.map(time => (
                      <option 
                        key={time} 
                        value={time}
                        disabled={!isTimeSlotAvailable(newAppointment.appointmentDate, time, newAppointment.doctorId)}
                      >
                        {time} {!isTimeSlotAvailable(newAppointment.appointmentDate, time, newAppointment.doctorId) ? '(Booked)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes)
                  </label>
                  <select
                    value={newAppointment.duration}
                    onChange={(e) => setNewAppointment(prev => ({ ...prev, duration: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Visit
                </label>
                <textarea
                  value={newAppointment.reason}
                  onChange={(e) => setNewAppointment(prev => ({ ...prev, reason: e.target.value }))}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
                  placeholder="Enter reason for appointment"
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowNewAppointment(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cornflower-blue text-white rounded-lg hover:bg-opacity-80"
                >
                  Schedule Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppointmentSchedulingEnhanced;