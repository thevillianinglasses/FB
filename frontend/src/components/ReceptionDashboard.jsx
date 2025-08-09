import React, { useState } from 'react';
import NewOPDPage from '../NewOPDPage';
import PatientLogPage from '../PatientLogPage';
import AllPatientsPage from '../AllPatientsPage';
import CancelledPage from '../CancelledPage';
import AppointmentSchedulingPage from '../AppointmentSchedulingPage';
import FinalBillingPage from '../FinalBillingPage';
import ProceduresServicesPage from '../ProceduresServicesPage';
import { useAppContext } from '../AppContext';

function ReceptionDashboard({ onLogout, userName }) {
  const [activeTab, setActiveTab] = useState('New OPD');
  const { setPatientForEditing, clearError } = useAppContext();

  const tabs = [
    { name: 'New OPD', component: <NewOPDPage />, icon: '👤' },
    { name: 'Patient Log', component: <PatientLogPage />, icon: '📋' },
    { name: 'All Patients', component: <AllPatientsPage onEditPatient={handleEditPatientRequest} />, icon: '👥' },
    { name: 'Appointments', component: <AppointmentSchedulingPage />, icon: '📅' },
    { name: 'Billing', component: <FinalBillingPage />, icon: '💰' },
    { name: 'Services', component: <ProceduresServicesPage />, icon: '🏥' }
  ];

  function handleEditPatientRequest(patientToEdit) {
    setPatientForEditing(patientToEdit);
    setActiveTab('New OPD');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-charcoal-grey">Reception Dashboard</h1>
              <p className="text-sm text-coral-red italic">Unicare Polyclinic - Patient Management</p>
              <p className="text-xs text-gray-600 mt-1">Welcome back, {userName}</p>
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
        {activeTab === 'New OPD' && <NewOPDPage />}
        {activeTab === 'Patient Log' && <PatientLogPage />}
        {activeTab === 'All Patients' && <AllPatientsPage onEditPatient={handleEditPatientRequest} />}
        {activeTab === 'Appointments' && <AppointmentSchedulingPage />}
        {activeTab === 'Billing' && <FinalBillingPage />}
        {activeTab === 'Services' && <ProceduresServicesPage />}
      </main>
    </div>
  );
}

export default ReceptionDashboard;