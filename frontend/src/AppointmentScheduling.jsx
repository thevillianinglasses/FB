import React, { useState, useEffect } from 'react';
import { useAppContext } from './AppContext';

function AppointmentScheduling() {
  const { patients, loadPatients, doctors, loadDoctors, isLoading } = useAppContext();
  
  // State management
  const [view, setView] = useState('day'); // 'day', 'week', 'month'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState([]);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  
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
    status: 'Scheduled'
  });

  // Time slots for appointments (9 AM to 6 PM)
  const timeSlots = [];
  for (let hour = 9; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeSlots.push(time);
    }
  }

  useEffect(() => {
    loadPatients();
    loadDoctors();
    loadAppointments();
  }, [selectedDate]);

  // Mock appointment data (in real app, this would come from backend)
  const loadAppointments = () => {
    // Generate some sample appointments for demonstration
    const sampleAppointments = [
      {
        id: '1',
        patientName: 'Arjun Menon',
        phoneNumber: '9876543210',
        doctorId: doctors.length > 0 ? doctors[0].id : '',
        appointmentDate: selectedDate,
        appointmentTime: '10:00',
        duration: '30',
        reason: 'Regular checkup',
        type: 'Consultation',
        status: 'Scheduled'
      },
      {
        id: '2',
        patientName: 'Priya Nair',
        phoneNumber: '9876543211',
        doctorId: doctors.length > 1 ? doctors[1].id : '',
        appointmentDate: selectedDate,
        appointmentTime: '14:30',
        duration: '45',
        reason: 'Follow-up consultation',
        type: 'Follow-up',
        status: 'Confirmed'
      }
    ];
    setAppointments(sampleAppointments);
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

  // Check if time slot is available
  const isTimeSlotAvailable = (date, time, doctorId) => {
    return !appointments.some(apt => 
      apt.appointmentDate === date && 
      apt.appointmentTime === time && 
      apt.doctorId === doctorId &&
      apt.status !== 'Cancelled'
    );
  };

  // Get appointments for a specific date and doctor
  const getAppointmentsForDateAndDoctor = (date, doctorId) => {
    return appointments.filter(apt => 
      apt.appointmentDate === date && 
      apt.doctorId === doctorId &&
      apt.status !== 'Cancelled'
    ).sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime));
  };

  // Handle new appointment submission
  const handleNewAppointmentSubmit = (e) => {
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

    // Add appointment
    const appointment = {
      ...newAppointment,
      id: Date.now().toString(),
      status: 'Scheduled'
    };

    setAppointments(prev => [...prev, appointment]);
    
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
      status: 'Scheduled'
    });
    
    setShowNewAppointment(false);
    alert('Appointment scheduled successfully!');
  };

  // Handle appointment status change
  const handleStatusChange = (appointmentId, newStatus) => {
    setAppointments(prev => 
      prev.map(apt => 
        apt.id === appointmentId ? { ...apt, status: newStatus } : apt
      )
    );
  };

  // Handle check-in (convert appointment to live visit)
  const handleCheckIn = (appointment) => {
    const confirmCheckIn = window.confirm(
      `Check in ${appointment.patientName} for their appointment?\n\nThis will create a new OPD visit.`
    );
    
    if (confirmCheckIn) {
      // In a real app, this would create a new patient visit
      alert(`${appointment.patientName} has been checked in. OPD visit created.`);
      handleStatusChange(appointment.id, 'Checked In');
    }
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
      weekday: 'long',
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
                Calendar Views • Doctor Availability • Booking/Rescheduling • Unicare Polyclinic • Kerala
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
          <div className="flex justify-between items-center">
            <div className="flex space-x-4">
              <div className="flex bg-white rounded-lg border">
                {['day', 'week'].map((viewType) => (
                  <button
                    key={viewType}
                    onClick={() => setView(viewType)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg ${
                      view === viewType
                        ? 'bg-cornflower-blue text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {viewType.charAt(0).toUpperCase() + viewType.slice(1)} View
                  </button>
                ))}
              </div>
              
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
              />
            </div>
            
            <div className="text-sm text-gray-600">
              {formatDate(selectedDate)}
            </div>
          </div>
        </div>

        {/* Appointments View */}
        <div className="p-6">
          {view === 'day' && (
            <div className="space-y-6">
              {doctors.map(doctor => (
                <div key={doctor.id} className="border rounded-lg">
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Dr. {doctor.name} - {doctor.specialty}
                    </h3>
                  </div>
                  
                  <div className="p-4">
                    {getAppointmentsForDateAndDoctor(selectedDate, doctor.id).length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        No appointments scheduled for this day
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {getAppointmentsForDateAndDoctor(selectedDate, doctor.id).map(appointment => (
                          <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className="text-sm font-medium text-gray-900">
                                {appointment.appointmentTime}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {appointment.patientName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {appointment.phoneNumber} • {appointment.reason}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                                {appointment.status}
                              </span>
                              
                              {appointment.status === 'Confirmed' && (
                                <button
                                  onClick={() => handleCheckIn(appointment)}
                                  className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                >
                                  Check In
                                </button>
                              )}
                              
                              <select
                                value={appointment.status}
                                onChange={(e) => handleStatusChange(appointment.id, e.target.value)}
                                className="text-xs border border-gray-300 rounded px-2 py-1"
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
                </div>
              ))}
            </div>
          )}

          {view === 'week' && (
            <div className="text-center py-12 text-gray-500">
              <p>Week view coming soon...</p>
              <p className="text-sm">Currently showing day view for selected date</p>
            </div>
          )}
        </div>
      </div>

      {/* New Appointment Modal */}
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

export default AppointmentScheduling;