import React, { useState } from 'react';
import { AppProvider, useAppContext } from './AppContext';
import LoginPage from './LoginPage';
import NewOPDPage from './NewOPDPage';
import PatientLogPage from './PatientLogPage';
import AllPatientsPage from './AllPatientsPage';
import CancelledPage from './CancelledPage';
import AppointmentSchedulingPage from './AppointmentSchedulingPage';
import FinalBillingPage from './FinalBillingPage';
import ProceduresServicesPage from './ProceduresServicesPage';

const tabs = [
  { name: 'New OPD', component: <NewOPDPage /> }, // Component property can remain for nav generation
  { name: 'Patient Log', component: <PatientLogPage /> },
  { name: 'All Patients', component: <AllPatientsPage /> }, // Will be rendered specially
  { name: 'Cancelled', component: <CancelledPage /> },
  { name: 'Appointment Scheduling', component: <AppointmentSchedulingPage /> },
  { name: 'Final Billing', component: <FinalBillingPage /> },
  { name: 'Procedures & Services', component: <ProceduresServicesPage /> },
];

function AppContent() { // Renamed original App to AppContent to use context
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState(tabs[0].name);
  const { setPatientForEditing } = useAppContext(); // Get from context

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleEditPatientRequest = (patientToEdit) => {
    setPatientForEditing(patientToEdit); // Set patient in context
    setActiveTab('New OPD'); // Switch to the New OPD tab by name
  };

  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    // AppProvider is moved to wrap AppContent in the main App export
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white text-charcoal-grey p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-charcoal-grey">Unicare Polyclinic</h1>
            <p className="text-sm text-coral-red italic">care crafted for you</p>
          </div>
          <button
            onClick={() => {
              // Also clear any patient being edited on logout
              if (setPatientForEditing) setPatientForEditing(null);
              setIsLoggedIn(false);
            }}
            className="bg-coral-red hover:bg-opacity-80 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-charcoal-grey shadow-sm">
        <div className="container mx-auto flex">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => {
                // If switching away from New OPD and a patient was being edited, clear it
                if (activeTab === 'New OPD' && setPatientForEditing) {
                  setPatientForEditing(null);
                }
                setActiveTab(tab.name);
              }}
              className={`py-4 px-6 block focus:outline-none ${
                activeTab === tab.name
                  ? 'text-cornflower-blue border-b-2 border-coral-red'
                  : 'text-white hover:text-coral-red'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </nav>

      {/* Active Tab Content */}
      <main className="container mx-auto p-4">
        {activeTab === 'New OPD' && <NewOPDPage />}
        {activeTab === 'Patient Log' && <PatientLogPage />}
        {activeTab === 'All Patients' && <AllPatientsPage onEditPatient={handleEditPatientRequest} />}
        {activeTab === 'Cancelled' && <CancelledPage />}
        {activeTab === 'Appointment Scheduling' && <AppointmentSchedulingPage />}
        {activeTab === 'Final Billing' && <FinalBillingPage />}
        {activeTab === 'Procedures & Services' && <ProceduresServicesPage />}
      </main>
    </div>
  );
}

// New main App component that includes AppProvider
function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
