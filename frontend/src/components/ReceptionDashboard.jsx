import React, { useState } from 'react';
import NewOPDPageEnhanced from '../NewOPDPageEnhanced';
import PatientLogPage from '../PatientLogPage';
import AllPatientsPage from '../AllPatientsPage';
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
        return <AllPatientsPage onEditPatient={handleEditPatientRequest} />;
      case 'Appointments':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-charcoal-grey mb-4">
              Appointment Scheduling — Unicare Polyclinic (Kerala)
            </h2>
            <p className="text-coral-red italic mb-4">
              അപ്പോയിന്റ്മെന്റ് ഷെഡ്യൂളിംഗ് • Coming Soon
            </p>
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-semibold text-charcoal-grey mb-2">Appointment Scheduling</h3>
              <p className="text-gray-600">Calendar booking system under development</p>
            </div>
          </div>
        );
      case 'Billing':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-charcoal-grey mb-4">
              Billing (Products & Services) — Unicare Polyclinic (Kerala)
            </h2>
            <p className="text-coral-red italic mb-4">
              ബില്ലിംഗ് സിസ്റ്റം • INR Currency • Coming Soon
            </p>
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <div className="text-6xl mb-4">💰</div>
              <h3 className="text-xl font-semibold text-charcoal-grey mb-2">Billing System</h3>
              <p className="text-gray-600">Products & Services billing under development</p>
            </div>
          </div>
        );
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