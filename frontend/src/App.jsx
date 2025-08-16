import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-blue-600">Unicare Polyclinic EHR System</h1>
      <p className="text-gray-700 mt-4">🏥 Welcome to the preview! The system is now working.</p>
      
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
        <div className="space-y-2">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">Admin Dashboard</button>
          <p className="text-sm text-gray-600">Login: admin / admin_007</p>
        </div>
      </div>
    </div>
  );
}

export default App;