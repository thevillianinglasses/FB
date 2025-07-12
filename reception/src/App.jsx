import React, { useState } from 'react';
import LoginPage from './LoginPage';
import NewOPDPage from './NewOPDPage';
import PatientLogPage from './PatientLogPage';
import AllPatientsPage from './AllPatientsPage';
import CancelledPage from './CancelledPage';
import AppointmentSchedulingPage from './AppointmentSchedulingPage';
import FinalBillingPage from './FinalBillingPage';
import ProceduresServicesPage from './ProceduresServicesPage';
import { AppProvider } from './AppContext'; // Import AppProvider

const tabs = [
  { name: 'New OPD', component: <NewOPDPage /> },
  { name: 'Patient Log', component: <PatientLogPage /> },
  { name: 'All Patients', component: <AllPatientsPage /> },
  { name: 'Cancelled', component: <CancelledPage /> },
  { name: 'Appointment Scheduling', component: <AppointmentSchedulingPage /> },
  { name: 'Final Billing', component: <FinalBillingPage /> },
  { name: 'Procedures & Services', component: <ProceduresServicesPage /> },
];

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState(tabs[0].name); // Default to New OPD

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Wrap the logged-in view with AppProvider
  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-cornflower-blue text-charcoal-grey p-4 shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Unicare Polyclinic</h1>
              <p className="text-sm text-coral-red">care crafted for you</p>
            </div>
            <button 
              onClick={() => setIsLoggedIn(false)} 
              className="bg-coral-red hover:bg-opacity-80 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Tab Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="container mx-auto flex">
            {tabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`py-4 px-6 block hover:text-cornflower-blue focus:outline-none ${
                  activeTab === tab.name
                    ? 'border-b-2 font-medium border-cornflower-blue text-cornflower-blue'
                    : 'text-charcoal-grey hover:text-opacity-80'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </nav>

        {/* Active Tab Content */}
        <main className="container mx-auto p-4">
          {tabs.find(tab => tab.name === activeTab)?.component}
        </main>
      </div>
    </AppProvider>
  );
}

export default App;
