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
  }, []);

  useEffect(() => {
    if (activeTab === 'vitals') {
      loadVitals();
    } else if (activeTab === 'procedures') {
      loadProcedures();
    }
  }, [activeTab]);

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
        {activeTab === 'vitals' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-charcoal-grey">Vital Signs</h2>
              <button
                onClick={() => setShowRecordVitals(true)}
                className="bg-cornflower-blue hover:bg-opacity-90 text-white font-semibold py-2 px-4 rounded-lg"
              >
                + Record Vitals
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            {vital.oxygen_saturation || 'N/A'}%
                          </span>
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

      {/* Record Vitals Modal */}
      {showRecordVitals && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold text-charcoal-grey mb-4">Record Vital Signs</h3>
            <form onSubmit={handleRecordVitals} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                <select
                  value={newVitals.patient_id}
                  onChange={(e) => setNewVitals({...newVitals, patient_id: e.target.value})}
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newVitals.temperature}
                    onChange={(e) => setNewVitals({...newVitals, temperature: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                    placeholder="98.6"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Pressure</label>
                  <input
                    type="text"
                    value={newVitals.blood_pressure}
                    onChange={(e) => setNewVitals({...newVitals, blood_pressure: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                    placeholder="120/80"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pulse Rate (bpm)</label>
                  <input
                    type="number"
                    value={newVitals.pulse_rate}
                    onChange={(e) => setNewVitals({...newVitals, pulse_rate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                    placeholder="72"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Respiratory Rate</label>
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
                    placeholder="70"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pain Scale (0-10)</label>
                  <select
                    value={newVitals.pain_scale}
                    onChange={(e) => setNewVitals({...newVitals, pain_scale: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  >
                    <option value="">Select Pain Level</option>
                    {[0,1,2,3,4,5,6,7,8,9,10].map(level => (
                      <option key={level} value={level}>{level} - {level === 0 ? 'No Pain' : level <= 3 ? 'Mild' : level <= 6 ? 'Moderate' : 'Severe'}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={newVitals.notes}
                  onChange={(e) => setNewVitals({...newVitals, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  rows="3"
                  placeholder="Additional observations..."
                />
              </div>
              
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-cornflower-blue hover:bg-opacity-90 text-white font-semibold py-2 px-4 rounded-md disabled:opacity-50"
                >
                  {isLoading ? 'Recording...' : 'Record Vitals'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRecordVitals(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-md"
                >
                  Cancel
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