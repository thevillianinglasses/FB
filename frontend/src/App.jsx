import React, { useState, useEffect } from 'react';
import { AppProvider, useAppContext } from './AppContext';
import { authAPI } from './api';
import LoginPage from './LoginPage';
import NewOPDPage from './NewOPDPage';
import PatientLogPage from './PatientLogPage';
import AllPatientsPage from './AllPatientsPage';
import CancelledPage from './CancelledPage';
import AppointmentSchedulingPage from './AppointmentSchedulingPage';
import FinalBillingPage from './FinalBillingPage';
import ProceduresServicesPage from './ProceduresServicesPage';

const tabs = [
  { name: 'New OPD', component: <NewOPDPage /> },
  { name: 'Patient Log', component: <PatientLogPage /> },
  { name: 'All Patients', component: <AllPatientsPage /> },
  { name: 'Cancelled', component: <CancelledPage /> },
  { name: 'Appointment Scheduling', component: <AppointmentSchedulingPage /> },
  { name: 'Final Billing', component: <FinalBillingPage /> },
  { name: 'Procedures & Services', component: <ProceduresServicesPage /> },
];

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState(tabs[0].name);
  const { setPatientForEditing, error, clearError, loadInitialData } = useAppContext();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if user is already authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const isAuthenticated = authAPI.isAuthenticated();
      setIsLoggedIn(isAuthenticated);
      
      // Load data if already authenticated
      if (isAuthenticated) {
        await loadInitialData();
      }
      
      setIsCheckingAuth(false);
    };
    
    checkAuth();
  }, [loadInitialData]);

  const handleLoginSuccess = async () => {
    setIsLoggedIn(true);
    // Load initial data after successful login
    await loadInitialData();
  };

  const handleLogout = () => {
    authAPI.logout();
    if (setPatientForEditing) setPatientForEditing(null);
    setIsLoggedIn(false);
    setActiveTab(tabs[0].name);
  };

  const handleEditPatientRequest = (patientToEdit) => {
    setPatientForEditing(patientToEdit);
    setActiveTab('New OPD');
  };

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cornflower-blue mx-auto"></div>
          <p className="mt-4 text-charcoal-grey">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Global Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <button
            onClick={clearError}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Header */}
      <header className="bg-white text-charcoal-grey p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-charcoal-grey">Unicare Polyclinic</h1>
            <p className="text-sm text-coral-red italic">care crafted for you</p>
          </div>
          <button
            onClick={handleLogout}
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
                if (activeTab === 'New OPD' && setPatientForEditing) {
                  setPatientForEditing(null);
                }
                setActiveTab(tab.name);
                if (clearError) clearError();
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

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;