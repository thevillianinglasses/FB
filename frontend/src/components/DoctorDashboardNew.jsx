import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

// Doctor API functions
const doctorAPI = {
  // Patient operations
  getPatients: async () => {
    const backendUrl = import.meta.env.REACT_APP_BACKEND_URL;
    const response = await fetch(`${backendUrl}/api/patients`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch patients');
    return response.json();
  },

  // Vitals operations
  getPatientVitals: async (patientId) => {
    const backendUrl = import.meta.env.REACT_APP_BACKEND_URL;
    const response = await fetch(`${backendUrl}/api/patients/${patientId}/vitals`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch vitals');
    return response.json();
  },

  // Encounters
  createEncounter: async (encounterData) => {
    const backendUrl = import.meta.env.REACT_APP_BACKEND_URL;
    const response = await fetch(`${backendUrl}/api/encounters`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(encounterData),
    });
    if (!response.ok) throw new Error('Failed to create encounter');
    return response.json();
  },

  updateEncounter: async (encounterId, encounterData) => {
    const backendUrl = import.meta.env.REACT_APP_BACKEND_URL;
    const response = await fetch(`${backendUrl}/api/encounters/${encounterId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(encounterData),
    });
    if (!response.ok) throw new Error('Failed to update encounter');
    return response.json();
  }
};

// Brief Encounter Component (Fast capture)
const BriefEncounter = ({ patient, encounter, onSave, onShowDetailed }) => {
  const [briefData, setBriefData] = useState({
    presenting_complaints: encounter?.brief?.presenting_complaints || [''],
    hopc: encounter?.brief?.hopc || '',
    past_history: encounter?.brief?.past_history || [''],
    examination: encounter?.brief?.examination || '',
    diagnosis: encounter?.brief?.diagnosis || [''],
    plan: encounter?.brief?.plan || [''],
    treatment: encounter?.brief?.treatment || [''],
    follow_up_date: encounter?.brief?.follow_up_date || ''
  });

  const [showPreviousDiagnoses, setShowPreviousDiagnoses] = useState(true);

  // Mock data for previous diagnoses (would come from API)
  const previousDiagnoses = [
    { date: '2025-01-10', diagnosis: 'Hypertension, Essential' },
    { date: '2025-01-05', diagnosis: 'Type 2 Diabetes Mellitus' }
  ];

  const handleArrayFieldChange = (field, index, value) => {
    const newArray = [...briefData[field]];
    newArray[index] = value;
    setBriefData({ ...briefData, [field]: newArray });
  };

  const addArrayField = (field) => {
    setBriefData({ ...briefData, [field]: [...briefData[field], ''] });
  };

  const removeArrayField = (field, index) => {
    const newArray = briefData[field].filter((_, i) => i !== index);
    setBriefData({ ...briefData, [field]: newArray });
  };

  const handleSave = () => {
    onSave('brief', briefData);
  };

  return (
    <div className="flex h-full">
      {/* Left Column - Main Form */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="space-y-6">
          {/* Presenting Complaints with Autosuggest */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Presenting Complaints
            </label>
            {briefData.presenting_complaints.map((complaint, index) => (
              <div key={index} className="flex items-center mb-2">
                <input
                  type="text"
                  value={complaint}
                  onChange={(e) => handleArrayFieldChange('presenting_complaints', index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Chest pain, fever, headache"
                />
                {index > 0 && (
                  <button
                    onClick={() => removeArrayField('presenting_complaints', index)}
                    className="ml-2 text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => addArrayField('presenting_complaints')}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              + Add complaint
            </button>
          </div>

          {/* HOPC Summary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              History of Presenting Complaint (HOPC)
            </label>
            <textarea
              value={briefData.hopc}
              onChange={(e) => setBriefData({ ...briefData, hopc: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Brief summary of the presenting complaint history"
            />
          </div>

          {/* Past History */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Past History
            </label>
            {briefData.past_history.map((history, index) => (
              <div key={index} className="flex items-center mb-2">
                <input
                  type="text"
                  value={history}
                  onChange={(e) => handleArrayFieldChange('past_history', index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., HTN, DM, Previous surgery"
                />
                {index > 0 && (
                  <button
                    onClick={() => removeArrayField('past_history', index)}
                    className="ml-2 text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => addArrayField('past_history')}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              + Add history
            </button>
          </div>

          {/* Examination */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Examination
            </label>
            <textarea
              value={briefData.examination}
              onChange={(e) => setBriefData({ ...briefData, examination: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="General examination and specific system examination"
            />
          </div>

          {/* Diagnosis with ICD Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Diagnosis
            </label>
            {briefData.diagnosis.map((diag, index) => (
              <div key={index} className="flex items-center mb-2">
                <input
                  type="text"
                  value={diag}
                  onChange={(e) => handleArrayFieldChange('diagnosis', index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search ICD codes or type diagnosis"
                />
                {index > 0 && (
                  <button
                    onClick={() => removeArrayField('diagnosis', index)}
                    className="ml-2 text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => addArrayField('diagnosis')}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              + Add diagnosis
            </button>
          </div>

          {/* Plan Chips */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plan
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {['OPD', 'Observation', 'Admission', 'Procedure'].map((planType) => (
                <button
                  key={planType}
                  onClick={() => {
                    if (!briefData.plan.includes(planType)) {
                      setBriefData({ ...briefData, plan: [...briefData.plan, planType] });
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-sm ${
                    briefData.plan.includes(planType)
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {planType}
                </button>
              ))}
            </div>
            {briefData.plan.map((plan, index) => (
              <div key={index} className="flex items-center mb-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm mr-2">
                  {plan}
                </span>
                <button
                  onClick={() => removeArrayField('plan', index)}
                  className="text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Treatment Quick-add */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Treatment
            </label>
            {briefData.treatment.map((treat, index) => (
              <div key={index} className="flex items-center mb-2">
                <input
                  type="text"
                  value={treat}
                  onChange={(e) => handleArrayFieldChange('treatment', index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Tab Paracetamol 500mg TID"
                />
                {index > 0 && (
                  <button
                    onClick={() => removeArrayField('treatment', index)}
                    className="ml-2 text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => addArrayField('treatment')}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              + Add treatment
            </button>
          </div>

          {/* Follow-up Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Follow-up Date
            </label>
            <input
              type="date"
              value={briefData.follow_up_date}
              onChange={(e) => setBriefData({ ...briefData, follow_up_date: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Save Brief
            </button>
            <button
              onClick={onShowDetailed}
              className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700"
            >
              Detailed History
            </button>
          </div>
        </div>
      </div>

      {/* Right Column - Previous History and Allergies */}
      <div className="w-80 bg-gray-50 p-4 border-l overflow-auto">
        {/* Allergies Banner */}
        {patient.allergies && patient.allergies.length > 0 && (
          <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-500">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Allergies
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc list-inside">
                    {patient.allergies.map((allergy, index) => (
                      <li key={index}>{allergy}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Previous Diagnoses */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Previous Diagnoses</h3>
            <button
              onClick={() => setShowPreviousDiagnoses(!showPreviousDiagnoses)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {showPreviousDiagnoses ? 'Hide' : 'Show'}
            </button>
          </div>
          
          {showPreviousDiagnoses && (
            <div className="space-y-2">
              {previousDiagnoses.map((prev, index) => (
                <div key={index} className="bg-white p-3 rounded-md shadow-sm">
                  <div className="text-xs text-gray-500">{prev.date}</div>
                  <div className="text-sm text-gray-900">{prev.diagnosis}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Detailed History Component (Specialty-specific tabs)
const DetailedHistory = ({ patient, encounter, onSave, onShowBrief }) => {
  const [activeSpecialty, setActiveSpecialty] = useState('general_medicine');
  const [detailedData, setDetailedData] = useState(
    encounter?.detailed || {
      cardiology: {},
      respiratory: {},
      ent: {},
      ophthalmology: {},
      gastroenterology: {},
      general_medicine: {},
      psychiatry: {},
      gynecology: {},
      pediatrics: {},
      emergency: {},
      surgery: {},
      rheumatology: {},
      oncology: {},
      neurology: {},
      orthopedics: {},
      dermatology: {},
      anesthesiology: {}
    }
  );

  const specialties = [
    { id: 'general_medicine', name: 'General Medicine', icon: '🏥' },
    { id: 'cardiology', name: 'Cardiology', icon: '❤️' },
    { id: 'respiratory', name: 'Respiratory', icon: '🫁' },
    { id: 'ent', name: 'ENT', icon: '👂' },
    { id: 'ophthalmology', name: 'Ophthalmology', icon: '👁️' },
    { id: 'gastroenterology', name: 'Gastroenterology', icon: '🫄' },
    { id: 'psychiatry', name: 'Psychiatry', icon: '🧠' },
    { id: 'gynecology', name: 'Gynecology', icon: '🤱' },
    { id: 'pediatrics', name: 'Pediatrics', icon: '👶' },
    { id: 'emergency', name: 'Emergency', icon: '🚨' },
    { id: 'surgery', name: 'Surgery', icon: '🔪' },
    { id: 'rheumatology', name: 'Rheumatology', icon: '🦴' },
    { id: 'oncology', name: 'Oncology', icon: '🎗️' },
    { id: 'neurology', name: 'Neurology', icon: '🧠' },
    { id: 'orthopedics', name: 'Orthopedics', icon: '🦴' },
    { id: 'dermatology', name: 'Dermatology', icon: '🧴' },
    { id: 'anesthesiology', name: 'Anesthesiology', icon: '😴' }
  ];

  const handleSpecialtyDataChange = (field, value) => {
    setDetailedData({
      ...detailedData,
      [activeSpecialty]: {
        ...detailedData[activeSpecialty],
        [field]: value
      }
    });
  };

  const handleSave = () => {
    onSave('detailed', detailedData);
  };

  // Render specialty-specific form
  const renderSpecialtyForm = () => {
    const currentData = detailedData[activeSpecialty] || {};
    
    // General Medicine form as example
    if (activeSpecialty === 'general_medicine') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chief Complaint Duration
            </label>
            <input
              type="text"
              value={currentData.chief_complaint_duration || ''}
              onChange={(e) => handleSpecialtyDataChange('chief_complaint_duration', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 3 days, 2 weeks"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Associated Symptoms
            </label>
            <textarea
              value={currentData.associated_symptoms || ''}
              onChange={(e) => handleSpecialtyDataChange('associated_symptoms', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Associated symptoms"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Family History
            </label>
            <textarea
              value={currentData.family_history || ''}
              onChange={(e) => handleSpecialtyDataChange('family_history', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Relevant family history"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Social History
            </label>
            <textarea
              value={currentData.social_history || ''}
              onChange={(e) => handleSpecialtyDataChange('social_history', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Smoking, alcohol, occupation, etc."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review of Systems
            </label>
            <textarea
              value={currentData.review_of_systems || ''}
              onChange={(e) => handleSpecialtyDataChange('review_of_systems', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Systematic review of systems"
            />
          </div>
        </div>
      );
    }
    
    // Cardiology form
    if (activeSpecialty === 'cardiology') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chest Pain Character
            </label>
            <select
              value={currentData.chest_pain_character || ''}
              onChange={(e) => handleSpecialtyDataChange('chest_pain_character', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select character</option>
              <option value="crushing">Crushing</option>
              <option value="stabbing">Stabbing</option>
              <option value="burning">Burning</option>
              <option value="pressure">Pressure</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Radiation
            </label>
            <input
              type="text"
              value={currentData.radiation || ''}
              onChange={(e) => handleSpecialtyDataChange('radiation', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Left arm, jaw, back"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exercise Tolerance
            </label>
            <textarea
              value={currentData.exercise_tolerance || ''}
              onChange={(e) => handleSpecialtyDataChange('exercise_tolerance', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Exercise capacity and limitations"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Palpitations
            </label>
            <textarea
              value={currentData.palpitations || ''}
              onChange={(e) => handleSpecialtyDataChange('palpitations', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Character, triggers, duration"
            />
          </div>
        </div>
      );
    }
    
    // Default form for other specialties
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium text-gray-700">
          {specialties.find(s => s.id === activeSpecialty)?.name} History
        </h3>
        <p className="text-gray-500 mt-2">
          Specialty-specific form coming soon...
        </p>
        <div className="mt-4">
          <textarea
            value={currentData.notes || ''}
            onChange={(e) => handleSpecialtyDataChange('notes', e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Clinical notes specific to this specialty"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full">
      {/* Specialty Tabs */}
      <div className="w-64 bg-gray-50 border-r overflow-auto">
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Specialties</h3>
          <div className="space-y-1">
            {specialties.map((specialty) => (
              <button
                key={specialty.id}
                onClick={() => setActiveSpecialty(specialty.id)}
                className={`w-full flex items-center px-3 py-2 text-left text-sm rounded-md transition-colors ${
                  activeSpecialty === specialty.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">{specialty.icon}</span>
                {specialty.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Specialty Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">
              {specialties.find(s => s.id === activeSpecialty)?.name} History
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={onShowBrief}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Back to Brief
              </button>
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Save Detailed
              </button>
            </div>
          </div>
        </div>

        {renderSpecialtyForm()}
      </div>
    </div>
  );
};

// Main Doctor Dashboard Component
function DoctorDashboardNew({ onLogout, userName }) {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [currentEncounter, setCurrentEncounter] = useState(null);
  const [encounterMode, setEncounterMode] = useState('brief'); // 'brief' or 'detailed'
  const [vitals, setVitals] = useState(null);

  const queryClient = useQueryClient();

  // Get patients list
  const { data: patients = [], isLoading: patientsLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: doctorAPI.getPatients,
  });

  // Get vitals for selected patient
  const { data: patientVitals } = useQuery({
    queryKey: ['vitals', selectedPatient?.id],
    queryFn: () => doctorAPI.getPatientVitals(selectedPatient.id),
    enabled: !!selectedPatient?.id
  });

  // Create encounter mutation
  const createEncounterMutation = useMutation({
    mutationFn: doctorAPI.createEncounter,
    onSuccess: (data) => {
      setCurrentEncounter(data);
      toast.success('Encounter created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create encounter: ${error.message}`);
    }
  });

  // Update encounter mutation
  const updateEncounterMutation = useMutation({
    mutationFn: ({ id, data }) => doctorAPI.updateEncounter(id, data),
    onSuccess: () => {
      toast.success('Encounter saved successfully');
    },
    onError: (error) => {
      toast.error(`Failed to save encounter: ${error.message}`);
    }
  });

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setCurrentEncounter(null);
    setEncounterMode('brief');
    
    // Create new encounter for this patient
    createEncounterMutation.mutate({
      patient_id: patient.id,
      department_id: 'dept_general_medicine', // This should come from logged-in doctor's department
      mode: 'brief'
    });
  };

  const handleEncounterSave = (mode, data) => {
    if (!currentEncounter) return;
    
    const updateData = {
      mode,
      [mode]: data
    };
    
    updateEncounterMutation.mutate({
      id: currentEncounter.id,
      data: updateData
    });
  };

  const handleShowDetailed = () => {
    setEncounterMode('detailed');
    if (currentEncounter) {
      updateEncounterMutation.mutate({
        id: currentEncounter.id,
        data: { mode: 'detailed' }
      });
    }
  };

  const handleShowBrief = () => {
    setEncounterMode('brief');
    if (currentEncounter) {
      updateEncounterMutation.mutate({
        id: currentEncounter.id,
        data: { mode: 'brief' }
      });
    }
  };

  // Patient Header Component
  const PatientHeader = () => {
    if (!selectedPatient) return null;

    return (
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedPatient.patient_name || selectedPatient.name}
              </h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>OPD: {selectedPatient.opd_number || selectedPatient.opd_no || 'N/A'}</span>
                <span>Age: {selectedPatient.age}</span>
                <span>Sex: {selectedPatient.sex}</span>
                <span>Phone: {selectedPatient.phone_number || selectedPatient.phone || 'N/A'}</span>
              </div>
            </div>
            
            {/* Latest Vitals */}
            {patientVitals && patientVitals.length > 0 && (
              <div className="bg-blue-50 p-3 rounded-md">
                <div className="text-xs text-blue-600 font-medium">Latest Vitals</div>
                <div className="text-sm text-blue-900 mt-1">
                  {patientVitals[0].temperature && (
                    <span className="mr-4">Temp: {patientVitals[0].temperature}°F</span>
                  )}
                  {patientVitals[0].systolic_bp && (
                    <span className="mr-4">
                      BP: {patientVitals[0].systolic_bp}/{patientVitals[0].diastolic_bp} mmHg
                      {patientVitals[0].bp_position && ` (${patientVitals[0].bp_position})`}
                    </span>
                  )}
                  {patientVitals[0].pulse && (
                    <span className="mr-4">HR: {patientVitals[0].pulse} bpm</span>
                  )}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Recorded: {new Date(patientVitals[0].recorded_at).toLocaleString()}
                </div>
              </div>
            )}
          </div>
          
          {/* Allergies Alert */}
          {selectedPatient.allergies && (
            <div className="bg-red-100 border border-red-300 px-3 py-2 rounded-md">
              <div className="text-xs text-red-600 font-medium">⚠️ ALLERGIES</div>
              <div className="text-sm text-red-800">{selectedPatient.allergies}</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - Patient List */}
      <div className="w-80 bg-white border-r overflow-auto">
        <div className="p-4 border-b">
          <h1 className="text-lg font-semibold text-gray-900">Doctor Dashboard</h1>
          <p className="text-sm text-gray-600">Welcome, {userName}</p>
        </div>
        
        <div className="p-4">
          <h2 className="text-sm font-medium text-gray-900 mb-4">Today's Patients</h2>
          
          {patientsLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-2">
              {patients.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => handlePatientSelect(patient)}
                  className={`w-full text-left p-3 rounded-md border transition-colors ${
                    selectedPatient?.id === patient.id
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-medium text-gray-900">
                    {patient.patient_name || patient.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {patient.age} • {patient.sex}
                  </div>
                  <div className="text-xs text-gray-500">
                    OPD: {patient.opd_number || patient.opd_no || 'N/A'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={onLogout}
            className="w-full flex items-center px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <span className="mr-3">🚪</span>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <PatientHeader />
        
        {selectedPatient ? (
          <div className="flex-1 overflow-hidden">
            {encounterMode === 'brief' ? (
              <BriefEncounter
                patient={selectedPatient}
                encounter={currentEncounter}
                onSave={handleEncounterSave}
                onShowDetailed={handleShowDetailed}
              />
            ) : (
              <DetailedHistory
                patient={selectedPatient}
                encounter={currentEncounter}
                onSave={handleEncounterSave}
                onShowBrief={handleShowBrief}
              />
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <h3 className="text-lg font-medium">Select a Patient</h3>
              <p className="mt-2">Choose a patient from the sidebar to begin consultation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DoctorDashboardNew;