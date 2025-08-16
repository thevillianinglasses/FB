import React, { useState } from 'react';
import { useDoctors, useDepartments, useCreateDoctor } from '../hooks/useData';
import DoctorModal from './DoctorModal';
import NewOPDPageEnhanced from '../NewOPDPageEnhanced';
import AllPatientsPageEnhanced from '../AllPatientsPageEnhanced';
import PatientLogPageFixed from '../PatientLogPageFixed';
import AppointmentSchedulingEnhanced from '../AppointmentSchedulingEnhanced';
import BillingSystem from '../BillingSystem';
import toast from 'react-hot-toast';

function EnhancedReceptionDashboard() {
  const [activeTab, setActiveTab] = useState('newOPD');
  const [showInlineDoctorForm, setShowInlineDoctorForm] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  // Data hooks
  const { data: departments = [] } = useDepartments();
  const { data: doctors = [] } = useDoctors();
  const createDoctorMutation = useCreateDoctor();

  const tabs = [
    { id: 'newOPD', name: 'New OPD Registration', icon: '➕', component: NewOPDPageEnhanced },
    { id: 'allPatients', name: 'All Patients', icon: '👥', component: AllPatientsPageEnhanced },
    { id: 'patientLog', name: '24-Hour Patient Log', icon: '📋', component: PatientLogPageFixed },
    { id: 'appointments', name: 'Appointment Scheduling', icon: '📅', component: AppointmentSchedulingEnhanced },
    { id: 'billing', name: 'Billing System', icon: '💰', component: BillingSystem }
  ];

  // Enhanced doctor selection component with inline doctor creation
  const DoctorSelectWithAdd = ({ departmentId, onDoctorSelect, selectedDoctorId }) => {
    const departmentDoctors = doctors.filter(d => d.departmentId === departmentId);
    const department = departments.find(d => d.id === departmentId);

    const handleAddDoctor = () => {
      setSelectedDepartment(department);
      setShowInlineDoctorForm(true);
    };

    const handleCreateDoctor = (doctorData) => {
      createDoctorMutation.mutate({
        ...doctorData,
        departmentId: departmentId
      }, {
        onSuccess: (newDoctor) => {
          toast.success(`Dr. ${newDoctor.name} added successfully!`);
          onDoctorSelect(newDoctor.id);
          setShowInlineDoctorForm(false);
          setSelectedDepartment(null);
        }
      });
    };

    return (
      <div className="space-y-2">
        <select
          value={selectedDoctorId || ''}
          onChange={(e) => onDoctorSelect(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
        >
          <option value="">Select a doctor</option>
          {departmentDoctors.map(doctor => (
            <option key={doctor.id} value={doctor.id}>
              Dr. {doctor.name} ({doctor.degree})
            </option>
          ))}
        </select>
        
        {departmentDoctors.length === 0 ? (
          <div className="text-center py-3 text-gray-500 text-sm">
            <p>No doctors yet — Add a doctor</p>
            <button
              onClick={handleAddDoctor}
              className="mt-2 text-cornflower-blue hover:text-blue-700 font-medium text-sm"
            >
              + Add First Doctor to {department?.name}
            </button>
          </div>
        ) : (
          <button
            onClick={handleAddDoctor}
            className="w-full text-left px-3 py-2 text-cornflower-blue hover:text-blue-700 font-medium text-sm border border-dashed border-cornflower-blue rounded-lg hover:bg-blue-50 transition-colors"
          >
            + Add New Doctor to {department?.name}
          </button>
        )}
      </div>
    );
  };

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reception Dashboard</h1>
              <p className="text-gray-600">Patient registration and management</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-IN', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  timeZone: 'Asia/Kolkata'
                })}
              </p>
              <p className="text-xs text-gray-400">
                {new Date().toLocaleTimeString('en-IN', { 
                  hour12: true,
                  timeZone: 'Asia/Kolkata'
                })} IST
              </p>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-cornflower-blue text-cornflower-blue'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {ActiveComponent && <ActiveComponent DoctorSelectWithAdd={DoctorSelectWithAdd} />}
      </main>

      {/* Inline Doctor Creation Modal */}
      {showInlineDoctorForm && selectedDepartment && (
        <DoctorModal
          doctor={{ departmentId: selectedDepartment.id }}
          departments={departments}
          onClose={() => {
            setShowInlineDoctorForm(false);
            setSelectedDepartment(null);
          }}
          onSave={handleCreateDoctor}
          isLoading={createDoctorMutation.isLoading}
        />
      )}
    </div>
  );
}

export default EnhancedReceptionDashboard;