import React, { useState } from 'react';
import NewOPDPageEnhanced from '../NewOPDPageEnhanced';
import PatientLogPageFixed from '../PatientLogPageFixed';
import AllPatientsPageEnhanced from '../AllPatientsPageEnhanced';
import AppointmentSchedulingEnhanced from '../AppointmentSchedulingEnhanced';
import BillingSystem from '../BillingSystem';
import { useAppContext } from '../AppContext';

const ReceptionDashboard = () => {
  const [activeTab, setActiveTab] = useState('New OPD');
  const { setPatientForEditing, clearError } = useAppContext();

  const tabs = [
    { name: 'New OPD', icon: '👤' },
    { name: 'Patient Log', icon: '📋' },
    { name: 'All Patients', icon: '👥' },
    { name: 'Appointments', icon: '📅' },
    { name: 'Billing', icon: '💰' }
  ];

  function handleEditPatientRequest(patientToEdit) {
    setPatientForEditing(patientToEdit);
    setActiveTab('New OPD');
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'New OPD':
        return <NewOPDPageEnhanced />;
      case 'Patient Log':
        return <PatientLogPageFixed />;
      case 'All Patients':
        return <AllPatientsPageEnhanced onEditPatient={handleEditPatientRequest} />;
      case 'Appointments':
        return <AppointmentSchedulingEnhanced />;
      case 'Billing':
        return <BillingSystem />;
      default:
        return <NewOPDPageEnhanced />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Reception Header */}
      <div>
        <h1 className="text-2xl font-bold text-charcoal-grey mb-2">
          Reception Dashboard
        </h1>
        <p className="text-sm text-coral-red italic">
          Unicare Polyclinic (Kerala) - Patient Management
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => {
                  if (activeTab === 'New OPD' && setPatientForEditing) {
                    setPatientForEditing(null);
                  }
                  setActiveTab(tab.name);
                  if (clearError) clearError();
                }}
                className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 transition-colors ${
                  activeTab === tab.name
                    ? 'border-coral-red text-cornflower-blue'
                    : 'border-transparent text-gray-600 hover:text-coral-red'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div>
        {renderActiveTab()}
      </div>
    </div>
  );
};

export default ReceptionDashboard;