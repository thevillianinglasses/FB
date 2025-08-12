import React, { useState } from 'react';
import NewOPDPageEnhanced from '../NewOPDPageEnhanced';
import PatientLogPage from '../PatientLogPage';
import AllPatientsPageEnhanced from '../AllPatientsPageEnhanced';
import AppointmentScheduling from '../AppointmentScheduling';
import BillingSystem from '../BillingSystem';
import { useAppContext } from '../AppContext';

function ReceptionDashboard({ onLogout, userName }) {
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
        return <PatientLogPage />;
      case 'All Patients':
        return <AllPatientsPageEnhanced onEditPatient={handleEditPatientRequest} />;
      case 'Appointments':
        return <AppointmentScheduling />;
      case 'Billing':
        return <BillingSystem />;
      default:
        return <NewOPDPageEnhanced />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-charcoal-grey">Reception Dashboard</h1>
              <p className="text-sm text-coral-red italic">Unicare Polyclinic (Kerala) - Patient Management</p>
              <p className="text-xs text-gray-600 mt-1">Welcome back, {userName} • Asia/Kolkata</p>
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
      <nav className="bg-charcoal-grey shadow-sm">
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
                className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                  activeTab === tab.name
                    ? 'border-coral-red text-cornflower-blue'
                    : 'border-transparent text-white hover:text-coral-red'
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
        {renderActiveTab()}
      </main>
    </div>
  );
}

export default ReceptionDashboard;