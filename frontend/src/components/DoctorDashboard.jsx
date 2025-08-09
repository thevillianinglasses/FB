import React, { useState, useEffect } from 'react';
import { emrAPI, pharmacyAPI, patientsAPI, labAPI } from '../api';

function DoctorDashboard({ onLogout, userName }) {
  const [activeTab, setActiveTab] = useState('consultations');
  const [consultations, setConsultations] = useState([]);
  const [patients, setPatients] = useState([]);
  const [medications, setMedications] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewConsultation, setShowNewConsultation] = useState(false);
  const [showPrescription, setShowPrescription] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [newConsultation, setNewConsultation] = useState({
    patient_id: '',
    chief_complaint: '',
    history_present_illness: '',
    physical_examination: '',
    diagnosis: '',
    treatment_plan: '',
    follow_up_instructions: '',
    next_visit_date: '',
    consultation_fee: 500
  });
  const [newPrescription, setNewPrescription] = useState({
    patient_id: '',
    medications: [],
    diagnosis: '',
    notes: ''
  });

  const tabs = [
    { id: 'consultations', name: 'Consultations', icon: '👨‍⚕️' },
    { id: 'prescriptions', name: 'Prescriptions', icon: '💊' },
    { id: 'emr', name: 'Patient EMR', icon: '📋' },
    { id: 'schedule', name: 'Schedule', icon: '📅' }
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'consultations') {
      loadConsultations();
    }
  }, [activeTab]);

  const loadInitialData = async () => {
    try {
      const [patientsData, medicationsData, labTestsData] = await Promise.all([
        patientsAPI.getAll(),
        pharmacyAPI.getMedications(),
        labAPI.getTests()
      ]);
      setPatients(patientsData);
      setMedications(medicationsData);
      setLabTests(labTestsData);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadConsultations = async () => {
    try {
      setIsLoading(true);
      const consultationsData = await emrAPI.getConsultations();
      setConsultations(consultationsData);
    } catch (error) {
      console.error('Error loading consultations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateConsultation = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await emrAPI.createConsultation(newConsultation);
      setNewConsultation({
        patient_id: '',
        chief_complaint: '',
        history_present_illness: '',
        physical_examination: '',
        diagnosis: '',
        treatment_plan: '',
        follow_up_instructions: '',
        next_visit_date: '',
        consultation_fee: 500
      });
      setShowNewConsultation(false);
      loadConsultations();
    } catch (error) {
      console.error('Error creating consultation:', error);
      alert('Error creating consultation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePrescription = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await pharmacyAPI.createPrescription(newPrescription);
      setNewPrescription({
        patient_id: '',
        medications: [],
        diagnosis: '',
        notes: ''
      });
      setShowPrescription(false);
      alert('Prescription created successfully!');
    } catch (error) {
      console.error('Error creating prescription:', error);
      alert('Error creating prescription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const addMedication = () => {
    setNewPrescription({
      ...newPrescription,
      medications: [
        ...newPrescription.medications,
        {
          medication_id: '',
          dosage: '',
          frequency: '',
          duration: '',
          instructions: '',
          quantity: 1
        }
      ]
    });
  };

  const updateMedication = (index, field, value) => {
    const updatedMedications = [...newPrescription.medications];
    updatedMedications[index][field] = value;
    setNewPrescription({
      ...newPrescription,
      medications: updatedMedications
    });
  };

  const removeMedication = (index) => {
    const updatedMedications = newPrescription.medications.filter((_, i) => i !== index);
    setNewPrescription({
      ...newPrescription,
      medications: updatedMedications
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-charcoal-grey">Doctor Dashboard</h1>
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
        {activeTab === 'consultations' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-charcoal-grey">Consultations</h2>
              <button
                onClick={() => setShowNewConsultation(true)}
                className="bg-cornflower-blue hover:bg-opacity-90 text-white font-semibold py-2 px-4 rounded-lg"
              >
                + New Consultation
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
                      Chief Complaint
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Diagnosis
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {consultations.map((consultation) => {
                    const patient = patients.find(p => p.id === consultation.patient_id);
                    return (
                      <tr key={consultation.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{patient?.patient_name}</div>
                            <div className="text-sm text-gray-500">{patient?.phone_number}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {consultation.chief_complaint}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {consultation.diagnosis}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{consultation.consultation_fee}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDateTime(consultation.consultation_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedPatient(patient);
                              setNewPrescription({...newPrescription, patient_id: patient?.id || ''});
                              setShowPrescription(true);
                            }}
                            className="text-cornflower-blue hover:text-cornflower-blue/80"
                          >
                            Prescribe
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'prescriptions' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-charcoal-grey">Prescriptions</h2>
              <button
                onClick={() => setShowPrescription(true)}
                className="bg-cornflower-blue hover:bg-opacity-90 text-white font-semibold py-2 px-4 rounded-lg"
              >
                + New Prescription
              </button>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600">Prescription history and management interface will be implemented here.</p>
            </div>
          </div>
        )}

        {activeTab === 'emr' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-charcoal-grey">Patient EMR</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="font-semibold text-charcoal-grey mb-3">Patient List</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {patients.map((patient) => (
                      <div
                        key={patient.id}
                        onClick={() => setSelectedPatient(patient)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedPatient?.id === patient.id
                            ? 'bg-cornflower-blue text-white'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className="font-medium">{patient.patient_name}</div>
                        <div className="text-sm opacity-80">{patient.phone_number}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-2">
                {selectedPatient ? (
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-charcoal-grey mb-4">
                      EMR - {selectedPatient.patient_name}
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Age</label>
                          <p className="text-gray-900">{selectedPatient.age} years</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Sex</label>
                          <p className="text-gray-900">{selectedPatient.sex}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Phone</label>
                          <p className="text-gray-900">{selectedPatient.phone_number}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">OPD Number</label>
                          <p className="text-gray-900">{selectedPatient.opd_number}</p>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <p className="text-gray-900">{selectedPatient.address || 'Not provided'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Allergies</label>
                        <p className="text-gray-900">{selectedPatient.allergies || 'None recorded'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Medical History</label>
                        <p className="text-gray-900">{selectedPatient.medical_history || 'No history recorded'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-6 rounded-lg shadow">
                    <p className="text-gray-500 text-center">Select a patient to view their EMR</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-charcoal-grey mb-4">Doctor Schedule</h2>
            <p className="text-gray-600">Schedule management interface will be implemented here.</p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-7 gap-4">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-charcoal-grey">{day}</h3>
                  <p className="text-sm text-gray-600 mt-2">9:00 AM - 5:00 PM</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* New Consultation Modal */}
      {showNewConsultation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold text-charcoal-grey mb-4">New Consultation</h3>
            <form onSubmit={handleCreateConsultation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                <select
                  value={newConsultation.patient_id}
                  onChange={(e) => setNewConsultation({...newConsultation, patient_id: e.target.value})}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaint</label>
                <textarea
                  value={newConsultation.chief_complaint}
                  onChange={(e) => setNewConsultation({...newConsultation, chief_complaint: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  rows="2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">History of Present Illness</label>
                <textarea
                  value={newConsultation.history_present_illness}
                  onChange={(e) => setNewConsultation({...newConsultation, history_present_illness: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  rows="3"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Physical Examination</label>
                <textarea
                  value={newConsultation.physical_examination}
                  onChange={(e) => setNewConsultation({...newConsultation, physical_examination: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  rows="3"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
                <textarea
                  value={newConsultation.diagnosis}
                  onChange={(e) => setNewConsultation({...newConsultation, diagnosis: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  rows="2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Plan</label>
                <textarea
                  value={newConsultation.treatment_plan}
                  onChange={(e) => setNewConsultation({...newConsultation, treatment_plan: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  rows="3"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee (₹)</label>
                  <input
                    type="number"
                    value={newConsultation.consultation_fee}
                    onChange={(e) => setNewConsultation({...newConsultation, consultation_fee: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Next Visit Date</label>
                  <input
                    type="date"
                    value={newConsultation.next_visit_date}
                    onChange={(e) => setNewConsultation({...newConsultation, next_visit_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Instructions</label>
                <textarea
                  value={newConsultation.follow_up_instructions}
                  onChange={(e) => setNewConsultation({...newConsultation, follow_up_instructions: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  rows="2"
                />
              </div>
              
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-cornflower-blue hover:bg-opacity-90 text-white font-semibold py-2 px-4 rounded-md disabled:opacity-50"
                >
                  {isLoading ? 'Creating...' : 'Create Consultation'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewConsultation(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Prescription Modal */}
      {showPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold text-charcoal-grey mb-4">New Prescription</h3>
            <form onSubmit={handleCreatePrescription} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                <select
                  value={newPrescription.patient_id}
                  onChange={(e) => setNewPrescription({...newPrescription, patient_id: e.target.value})}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
                <input
                  type="text"
                  value={newPrescription.diagnosis}
                  onChange={(e) => setNewPrescription({...newPrescription, diagnosis: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  required
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Medications</label>
                  <button
                    type="button"
                    onClick={addMedication}
                    className="bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-1 rounded"
                  >
                    + Add Medication
                  </button>
                </div>
                
                <div className="space-y-3">
                  {newPrescription.medications.map((medication, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Medication</label>
                          <select
                            value={medication.medication_id}
                            onChange={(e) => updateMedication(index, 'medication_id', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cornflower-blue"
                            required
                          >
                            <option value="">Select Medication</option>
                            {medications.map(med => (
                              <option key={med.id} value={med.id}>
                                {med.name} - {med.strength}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Dosage</label>
                          <input
                            type="text"
                            value={medication.dosage}
                            onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cornflower-blue"
                            placeholder="e.g., 1 tablet"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Frequency</label>
                          <select
                            value={medication.frequency}
                            onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cornflower-blue"
                            required
                          >
                            <option value="">Select Frequency</option>
                            <option value="Once daily">Once daily</option>
                            <option value="Twice daily">Twice daily</option>
                            <option value="Three times daily">Three times daily</option>
                            <option value="Four times daily">Four times daily</option>
                            <option value="As needed">As needed</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Duration</label>
                          <input
                            type="text"
                            value={medication.duration}
                            onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cornflower-blue"
                            placeholder="e.g., 7 days"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                          <input
                            type="number"
                            value={medication.quantity}
                            onChange={(e) => updateMedication(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cornflower-blue"
                            min="1"
                            required
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => removeMedication(index)}
                            className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="mt-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Special Instructions</label>
                        <input
                          type="text"
                          value={medication.instructions}
                          onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cornflower-blue"
                          placeholder="e.g., Take with food"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea
                  value={newPrescription.notes}
                  onChange={(e) => setNewPrescription({...newPrescription, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  rows="3"
                />
              </div>
              
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={isLoading || newPrescription.medications.length === 0}
                  className="flex-1 bg-cornflower-blue hover:bg-opacity-90 text-white font-semibold py-2 px-4 rounded-md disabled:opacity-50"
                >
                  {isLoading ? 'Creating...' : 'Create Prescription'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrescription(false)}
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

export default DoctorDashboard;