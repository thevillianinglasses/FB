import React, { useState, useEffect } from 'react';
import { nursingAPI, patientsAPI } from '../api';

function NursingDashboard({ onLogout, userName }) {
  const [activeTab, setActiveTab] = useState('vitals');
  const [vitals, setVitals] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showRecordVitals, setShowRecordVitals] = useState(false);
  const [showRecordProcedure, setShowRecordProcedure] = useState(false);
  const [newVitals, setNewVitals] = useState({
    patient_id: '',
    temperature: '',
    blood_pressure: '',
    pulse_rate: '',
    respiratory_rate: '',
    oxygen_saturation: '',
    weight: '',
    height: '',
    bmi: '',
    pain_scale: '',
    notes: ''
  });
  const [newProcedure, setNewProcedure] = useState({
    patient_id: '',
    procedure_name: '',
    procedure_notes: '',
    materials_used: '',
    charges: 0
  });

  const tabs = [
    { id: 'today-patients', name: 'Today\'s Patients', icon: '👥' },
    { id: 'vitals', name: 'Vital Signs & Procedure', icon: '💓' },
    { id: 'procedures', name: 'Nursing Procedures', icon: '🏥' },
    { id: 'reports', name: 'Reports', icon: '📊' }
  ];

  // Enhanced state for 24-hour patient integration
  const [todaysPatients, setTodaysPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [opdNumber, setOpdNumber] = useState('');
  const [patientByOpd, setPatientByOpd] = useState(null);

  useEffect(() => {
    loadInitialData();
    loadTodaysPatients(); // Load today's patients for nursing
  }, []);

  useEffect(() => {
    if (activeTab === 'vitals') {
      loadVitals();
    } else if (activeTab === 'procedures') {
      loadProcedures();
    } else if (activeTab === 'today-patients') {
      loadTodaysPatients();
    }
  }, [activeTab]);

  // Load today's patients from 24-hour registration log
  const loadTodaysPatients = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.REACT_APP_BACKEND_URL}/api/nursing/patients/today`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const patientsData = await response.json();
        setTodaysPatients(patientsData);
        console.log('✅ Today\'s patients loaded for nursing:', patientsData.length);
      } else {
        console.error('Error loading today\'s patients for nursing');
      }
    } catch (error) {
      console.error('Error loading today\'s patients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get patient by OPD number
  const getPatientByOpd = async (opdNumber) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.REACT_APP_BACKEND_URL}/api/nursing/patient/by-opd/${opdNumber}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const patientData = await response.json();
        setPatientByOpd(patientData);
        setSelectedPatient(patientData);
        
        // Auto-populate vital signs form with patient data
        setNewVitals({
          ...newVitals,
          patient_id: patientData.id,
          patient_name: patientData.patient_name,
          age: patientData.age,
          opd_number: opdNumber
        });
        
        console.log('✅ Patient found by OPD:', patientData);
      } else {
        alert('❌ Patient not found with this OPD number');
        setPatientByOpd(null);
        setSelectedPatient(null);
      }
    } catch (error) {
      console.error('Error getting patient by OPD:', error);
      alert('❌ Error searching patient by OPD number');
    }
  };

  // Handle OPD number entry
  const handleOpdEntry = async () => {
    if (opdNumber.trim()) {
      await getPatientByOpd(opdNumber.trim());
    }
  };

  // Record vital signs
  const recordVitalSigns = async () => {
    try {
      const token = localStorage.getItem('token');
      const vitalsData = {
        patient_id: selectedPatient?.id,
        patient_name: selectedPatient?.patient_name,
        age: selectedPatient?.age?.toString(),
        opd_number: selectedPatient?.opd_number,
        temperature: newVitals.temperature,
        blood_pressure_systolic: newVitals.blood_pressure?.split('/')[0] || '',
        blood_pressure_diastolic: newVitals.blood_pressure?.split('/')[1] || '',
        heart_rate: newVitals.pulse_rate,
        respiratory_rate: newVitals.respiratory_rate,
        oxygen_saturation: newVitals.oxygen_saturation,
        weight: newVitals.weight,
        height: newVitals.height,
        glucose_level: newVitals.glucose_level || '',
        notes: newVitals.notes,
        recorded_by: userName || 'Nursing Staff'
      };

      const response = await fetch(`${import.meta.env.REACT_APP_BACKEND_URL}/api/nursing/vitals`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(vitalsData)
      });

      if (response.ok) {
        const savedVitals = await response.json();
        alert('✅ Vital signs recorded successfully!\n\nThe vitals are now accessible in the Doctor portal.');
        
        // Reset form
        setNewVitals({
          patient_id: '',
          temperature: '',
          blood_pressure: '',
          pulse_rate: '',
          respiratory_rate: '',
          oxygen_saturation: '',
          weight: '',
          height: '',
          bmi: '',
          pain_scale: '',
          notes: ''
        });
        
        setSelectedPatient(null);
        setPatientByOpd(null);
        setOpdNumber('');
        setShowRecordVitals(false);
        
        // Reload vitals list
        loadVitals();
        
        console.log('✅ Vital signs recorded:', savedVitals);
      } else {
        const errorData = await response.json();
        alert(`❌ Error recording vital signs: ${errorData.detail || 'Please try again'}`);
      }
    } catch (error) {
      console.error('Error recording vital signs:', error);
      alert('❌ Error recording vital signs. Please try again.');
    }
  };

  const loadInitialData = async () => {
    try {
      const patientsData = await patientsAPI.getAll();
      setPatients(patientsData);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadVitals = async () => {
    try {
      setIsLoading(true);
      const vitalsData = await nursingAPI.getVitals();
      setVitals(vitalsData);
    } catch (error) {
      console.error('Error loading vitals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProcedures = async () => {
    try {
      setIsLoading(true);
      const proceduresData = await nursingAPI.getProcedures();
      setProcedures(proceduresData);
    } catch (error) {
      console.error('Error loading procedures:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordVitals = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      // Calculate BMI if weight and height are provided
      let bmi = '';
      if (newVitals.weight && newVitals.height) {
        const weightKg = parseFloat(newVitals.weight);
        const heightM = parseFloat(newVitals.height) / 100; // Convert cm to m
        bmi = (weightKg / (heightM * heightM)).toFixed(1);
      }
      
      const vitalsData = { ...newVitals, bmi };
      await nursingAPI.recordVitals(vitalsData);
      
      setNewVitals({
        patient_id: '',
        temperature: '',
        blood_pressure: '',
        pulse_rate: '',
        respiratory_rate: '',
        oxygen_saturation: '',
        weight: '',
        height: '',
        bmi: '',
        pain_scale: '',
        notes: ''
      });
      setShowRecordVitals(false);
      loadVitals();
    } catch (error) {
      console.error('Error recording vitals:', error);
      alert('Error recording vitals. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordProcedure = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await nursingAPI.recordProcedure(newProcedure);
      setNewProcedure({
        patient_id: '',
        procedure_name: '',
        procedure_notes: '',
        materials_used: '',
        charges: 0
      });
      setShowRecordProcedure(false);
      loadProcedures();
    } catch (error) {
      console.error('Error recording procedure:', error);
      alert('Error recording procedure. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getVitalStatus = (vital, type) => {
    // Basic vital sign interpretation (simplified)
    switch (type) {
      case 'temperature':
        const temp = parseFloat(vital.temperature);
        if (temp > 100.4) return 'text-red-600'; // Fever
        if (temp < 96.8) return 'text-blue-600'; // Hypothermia
        return 'text-green-600'; // Normal
      case 'pulse':
        const pulse = parseInt(vital.pulse_rate);
        if (pulse > 100) return 'text-red-600'; // Tachycardia
        if (pulse < 60) return 'text-blue-600'; // Bradycardia
        return 'text-green-600'; // Normal
      case 'bp':
        // Simple BP parsing (systolic/diastolic)
        const bpMatch = vital.blood_pressure.match(/(\d+)\/(\d+)/);
        if (bpMatch) {
          const systolic = parseInt(bpMatch[1]);
          if (systolic > 140) return 'text-red-600'; // High
          if (systolic < 90) return 'text-blue-600'; // Low
        }
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-charcoal-grey">Nursing Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {userName}</p>
            </div>
            <button
              onClick={onLogout}
              className="bg-coral-red hover:bg-opacity-80 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="px-6">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-cornflower-blue text-cornflower-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="px-6 py-6">
        {/* Today's Patients Tab - 24-Hour Rolling Registration */}
        {activeTab === 'today-patients' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-charcoal-grey">Today's Patients - 24 Hour Log</h2>
              <div className="text-sm text-gray-600">
                Total Patients: {todaysPatients.length} | Last Updated: {new Date().toLocaleTimeString()}
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-lg text-gray-600">Loading today's patients...</div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        OPD Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Age/Sex
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Doctor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registration Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {todaysPatients.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                          <div className="text-lg mb-2">No patients registered today</div>
                          <div className="text-sm">Patients will appear here as they register through Reception</div>
                        </td>
                      </tr>
                    ) : (
                      todaysPatients.map((patient) => (
                        <tr key={patient.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-cornflower-blue">
                              {patient.opd_number}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {patient.patient_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {patient.phone_number}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {patient.age} years, {patient.sex}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {patient.assigned_doctor || 'Not assigned'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDateTime(patient.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => {
                                setSelectedPatient(patient);
                                setNewVitals({
                                  ...newVitals,
                                  patient_id: patient.id,
                                  patient_name: patient.patient_name,
                                  age: patient.age,
                                  opd_number: patient.opd_number
                                });
                                setShowRecordVitals(true);
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                            >
                              Record Vitals
                            </button>
                            <button
                              onClick={() => {
                                setSelectedPatient(patient);
                                setShowRecordProcedure(true);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                            >
                              Procedure
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Enhanced Vital Signs Tab with OPD Integration */}
        {activeTab === 'vitals' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-charcoal-grey">Vital Signs & Procedures</h2>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowRecordVitals(true)}
                  className="bg-cornflower-blue hover:bg-opacity-90 text-white font-semibold py-2 px-4 rounded-lg"
                >
                  + Record Vitals
                </button>
              </div>
            </div>

            {/* OPD Number Entry Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Access by OPD Number</h3>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={opdNumber}
                    onChange={(e) => setOpdNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                    placeholder="Enter OPD number (e.g., 025/25)..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleOpdEntry();
                      }
                    }}
                  />
                </div>
                <button
                  onClick={handleOpdEntry}
                  className="px-6 py-2 bg-cornflower-blue text-white rounded-md hover:bg-blue-700 focus:outline-none"
                >
                  Find Patient
                </button>
              </div>
              
              {patientByOpd && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-green-900">Patient Found</h4>
                      <p className="text-sm text-green-700">
                        {patientByOpd.patient_name} • {patientByOpd.age} years, {patientByOpd.sex} • OPD: {patientByOpd.opd_number}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setNewVitals({
                          ...newVitals,
                          patient_id: patientByOpd.id,
                          patient_name: patientByOpd.patient_name,
                          age: patientByOpd.age,
                          opd_number: patientByOpd.opd_number
                        });
                        setShowRecordVitals(true);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                    >
                      Record Vitals
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Existing Vital Signs Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Temperature
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Blood Pressure
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pulse Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SpO2
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recorded At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vitals.map((vital) => {
                    const patient = patients.find(p => p.id === vital.patient_id);
                    return (
                      <tr key={vital.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{patient?.patient_name}</div>
                            <div className="text-sm text-gray-500">{patient?.phone_number}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${getVitalStatus(vital, 'temperature')}`}>
                            {vital.temperature || 'N/A'}°F
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${getVitalStatus(vital, 'bp')}`}>
                            {vital.blood_pressure || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${getVitalStatus(vital, 'pulse')}`}>
                            {vital.pulse_rate || 'N/A'} bpm
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {vital.oxygen_saturation || 'N/A'}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDateTime(vital.recorded_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'procedures' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-charcoal-grey">Nursing Procedures</h2>
              <button
                onClick={() => setShowRecordProcedure(true)}
                className="bg-cornflower-blue hover:bg-opacity-90 text-white font-semibold py-2 px-4 rounded-lg"
              >
                + Record Procedure
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Procedure
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Materials Used
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Charges
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performed At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {procedures.map((procedure) => {
                    const patient = patients.find(p => p.id === procedure.patient_id);
                    return (
                      <tr key={procedure.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{patient?.patient_name}</div>
                            <div className="text-sm text-gray-500">{patient?.phone_number}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{procedure.procedure_name}</div>
                            {procedure.procedure_notes && (
                              <div className="text-sm text-gray-500">{procedure.procedure_notes}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {procedure.materials_used || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ₹{procedure.charges}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDateTime(procedure.performed_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'triage' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-charcoal-grey mb-4">Triage Assessment</h2>
            <p className="text-gray-600">Advanced triage assessment interface will be implemented here.</p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-red-50 rounded-lg">
                <h3 className="font-semibold text-red-900">Emergency</h3>
                <p className="text-red-700 text-sm">Immediate attention required</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h3 className="font-semibold text-yellow-900">Urgent</h3>
                <p className="text-yellow-700 text-sm">Care within 30 minutes</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-900">Non-Urgent</h3>
                <p className="text-green-700 text-sm">Standard appointment</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-charcoal-grey">Nursing Reports</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900">Vitals Recorded</h3>
                <p className="text-2xl font-bold text-blue-700">{vitals.length}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-green-900">Procedures Done</h3>
                <p className="text-2xl font-bold text-green-700">{procedures.length}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-900">Patients Today</h3>
                <p className="text-2xl font-bold text-yellow-700">{patients.length}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-900">Average Response Time</h3>
                <p className="text-2xl font-bold text-purple-700">5 min</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Enhanced Record Vitals Modal with OPD Integration */}
      {showRecordVitals && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold text-charcoal-grey mb-4">Record Vital Signs</h3>
            
            {/* Patient Information Display */}
            {selectedPatient && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900">Patient Information</h4>
                <div className="text-sm text-blue-700 mt-1">
                  <p><strong>Name:</strong> {selectedPatient.patient_name}</p>
                  <p><strong>Age:</strong> {selectedPatient.age} years</p>
                  <p><strong>Sex:</strong> {selectedPatient.sex}</p>
                  <p><strong>OPD Number:</strong> {selectedPatient.opd_number}</p>
                  <p><strong>Phone:</strong> {selectedPatient.phone_number}</p>
                </div>
              </div>
            )}
            
            <form onSubmit={(e) => { e.preventDefault(); recordVitalSigns(); }} className="space-y-4">
              {/* Patient Selection (if not auto-selected) */}
              {!selectedPatient && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                  <select
                    value={newVitals.patient_id}
                    onChange={(e) => {
                      const patient = patients.find(p => p.id === e.target.value);
                      setNewVitals({...newVitals, patient_id: e.target.value});
                      setSelectedPatient(patient);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                    required
                  >
                    <option value="">Select Patient</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.patient_name} - {patient.phone_number}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Vital Signs Input Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newVitals.temperature}
                    onChange={(e) => setNewVitals({...newVitals, temperature: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                    placeholder="36.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Pressure (systolic/diastolic)</label>
                  <input
                    type="text"
                    value={newVitals.blood_pressure}
                    onChange={(e) => setNewVitals({...newVitals, blood_pressure: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                    placeholder="120/80"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heart Rate (BPM)</label>
                  <input
                    type="number"
                    value={newVitals.pulse_rate}
                    onChange={(e) => setNewVitals({...newVitals, pulse_rate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                    placeholder="72"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Respiratory Rate (per min)</label>
                  <input
                    type="number"
                    value={newVitals.respiratory_rate}
                    onChange={(e) => setNewVitals({...newVitals, respiratory_rate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                    placeholder="16"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Oxygen Saturation (%)</label>
                  <input
                    type="number"
                    value={newVitals.oxygen_saturation}
                    onChange={(e) => setNewVitals({...newVitals, oxygen_saturation: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                    placeholder="98"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newVitals.weight}
                    onChange={(e) => setNewVitals({...newVitals, weight: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                    placeholder="70.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={newVitals.height}
                    onChange={(e) => setNewVitals({...newVitals, height: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                    placeholder="170"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Glucose Level (mg/dL)</label>
                  <input
                    type="number"
                    value={newVitals.glucose_level || ''}
                    onChange={(e) => setNewVitals({...newVitals, glucose_level: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                    placeholder="90"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={newVitals.notes}
                  onChange={(e) => setNewVitals({...newVitals, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  rows="3"
                  placeholder="Additional observations or notes..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowRecordVitals(false);
                    setSelectedPatient(null);
                    setPatientByOpd(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cornflower-blue text-white rounded-md hover:bg-blue-700"
                >
                  Record Vitals
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Procedure Modal */}
      {showRecordProcedure && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-charcoal-grey mb-4">Record Nursing Procedure</h3>
            <form onSubmit={handleRecordProcedure} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                <select
                  value={newProcedure.patient_id}
                  onChange={(e) => setNewProcedure({...newProcedure, patient_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  required
                >
                  <option value="">Select Patient</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.patient_name} - {patient.phone_number}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Procedure Name</label>
                <select
                  value={newProcedure.procedure_name}
                  onChange={(e) => setNewProcedure({...newProcedure, procedure_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  required
                >
                  <option value="">Select Procedure</option>
                  <option value="Injection">Injection</option>
                  <option value="Dressing">Wound Dressing</option>
                  <option value="Nebulization">Nebulization</option>
                  <option value="ECG">ECG</option>
                  <option value="IV Cannulation">IV Cannulation</option>
                  <option value="Catheterization">Catheterization</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Procedure Notes</label>
                <textarea
                  value={newProcedure.procedure_notes}
                  onChange={(e) => setNewProcedure({...newProcedure, procedure_notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Materials Used</label>
                <input
                  type="text"
                  value={newProcedure.materials_used}
                  onChange={(e) => setNewProcedure({...newProcedure, materials_used: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  placeholder="e.g., Syringe, Gauze, Antiseptic"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Charges (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newProcedure.charges}
                  onChange={(e) => setNewProcedure({...newProcedure, charges: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                />
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-cornflower-blue hover:bg-opacity-90 text-white font-semibold py-2 px-4 rounded-md disabled:opacity-50"
                >
                  {isLoading ? 'Recording...' : 'Record Procedure'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRecordProcedure(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default NursingDashboard;