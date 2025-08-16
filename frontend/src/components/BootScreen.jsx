import React from 'react';

function BootScreen({ message = "Unicare is loading…" }) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Unicare Polyclinic</h2>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}

export default BootScreen;