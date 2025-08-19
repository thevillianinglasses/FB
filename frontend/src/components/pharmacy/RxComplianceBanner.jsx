// src/components/pharmacy/RxComplianceBanner.jsx
import React, { useState } from 'react';

export default function RxComplianceBanner({ required, symbol, onAttach }) {
  const [rxNumber, setRxNumber] = useState('');
  const [regNo, setRegNo] = useState('');
  const [files, setFiles] = useState([]);
  const [showUpload, setShowUpload] = useState(false);

  if (!required) return null;

  const handleAttach = () => {
    if (onAttach) {
      onAttach({ rxNumber, regNo, files });
    }
    setShowUpload(false);
  };

  return (
    <div className="border-2 border-red-500 bg-red-50 p-4 rounded-lg mb-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-red-700 flex items-center">
            <span className="mr-2">⚠️</span>
            Schedule {symbol} — Prescription Required
          </div>
          <div className="text-sm text-red-700 mt-1">
            Upload scan/photo of prescription. Enter Rx Number & Prescriber Registration No.
            {(symbol === 'X' || symbol === 'N') && ' Patient ID proof required for Schedule X/N.'}
          </div>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
        >
          {showUpload ? 'Cancel' : '📎 Attach Prescription'}
        </button>
      </div>

      {showUpload && (
        <div className="mt-4 pt-4 border-t border-red-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-red-700 mb-2">
                Prescription Number *
              </label>
              <input
                type="text"
                value={rxNumber}
                onChange={(e) => setRxNumber(e.target.value)}
                className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Enter Rx number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-red-700 mb-2">
                Prescriber Registration No *
              </label>
              <input
                type="text"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Doctor's registration number"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-red-700 mb-2">
              Prescription Documents *
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={(e) => setFiles([...e.target.files])}
                className="hidden"
                id="rx-upload"
              />
              <label
                htmlFor="rx-upload"
                className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
              >
                📁 Choose Files
              </label>
              <button
                type="button"
                className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors"
              >
                📷 Take Photo
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors"
              >
                📄 Scan Document
              </button>
            </div>
            {files.length > 0 && (
              <div className="mt-2 text-sm text-red-700">
                {files.length} file(s) selected: {Array.from(files).map(f => f.name).join(', ')}
              </div>
            )}
          </div>

          {(symbol === 'X' || symbol === 'N') && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-red-700 mb-2">
                Patient ID Proof * (Required for Schedule X/N)
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          )}

          <div className="flex items-center space-x-4">
            <button
              onClick={handleAttach}
              disabled={!rxNumber || !regNo || files.length === 0}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              ✅ Attach & Continue
            </button>
            <div className="text-sm text-red-600">
              All fields marked with * are required for scheduled drugs
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 text-xs text-red-600 bg-red-100 p-2 rounded">
        <strong>Legal Notice:</strong> Schedule {symbol} drug — To be sold by retail on the prescription of a Registered Medical Practitioner only. 
        Prescription must be retained for {symbol === 'G' || symbol === 'K' ? '0' : '5'} years as per Drug Rules.
      </div>
    </div>
  );
}