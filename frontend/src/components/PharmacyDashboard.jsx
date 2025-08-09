import React, { useState, useEffect } from 'react';
import { pharmacyAPI, patientsAPI, doctorsAPI } from '../api';

function PharmacyDashboard({ onLogout, userName }) {
  const [activeTab, setActiveTab] = useState('prescriptions');
  const [medications, setMedications] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewMedication, setShowNewMedication] = useState(false);
  const [newMedication, setNewMedication] = useState({
    name: '',
    generic_name: '',
    strength: '',
    form: 'Tablet',
    mrp: 0,
    selling_price: 0,
    stock_quantity: 0,
    min_stock_level: 10,
    category: ''
  });

  const tabs = [
    { id: 'prescriptions', name: 'Prescriptions', icon: '💊' },
    { id: 'inventory', name: 'Inventory', icon: '📦' },
    { id: 'dispensing', name: 'Dispensing', icon: '🏪' },
    { id: 'reports', name: 'Reports', icon: '📊' }
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'prescriptions') {
      loadPrescriptions();
    } else if (activeTab === 'inventory') {
      loadMedications();
    }
  }, [activeTab]);

  const loadInitialData = async () => {
    try {
      const [patientsData, doctorsData, medicationsData] = await Promise.all([
        patientsAPI.getAll(),
        doctorsAPI.getAll(),
        pharmacyAPI.getMedications()
      ]);
      setPatients(patientsData);
      setDoctors(doctorsData);
      setMedications(medicationsData);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadPrescriptions = async () => {
    try {
      setIsLoading(true);
      const prescriptionsData = await pharmacyAPI.getPrescriptions();
      setPrescriptions(prescriptionsData);
    } catch (error) {
      console.error('Error loading prescriptions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMedications = async () => {
    try {
      setIsLoading(true);
      const medicationsData = await pharmacyAPI.getMedications();
      setMedications(medicationsData);
    } catch (error) {
      console.error('Error loading medications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateMedication = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await pharmacyAPI.addMedication(newMedication);
      setNewMedication({
        name: '',
        generic_name: '',
        strength: '',
        form: 'Tablet',
        mrp: 0,
        selling_price: 0,
        stock_quantity: 0,
        min_stock_level: 10,
        category: ''
      });
      setShowNewMedication(false);
      loadMedications();
    } catch (error) {
      console.error('Error creating medication:', error);
      alert('Error creating medication. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDispensePrescription = async (prescriptionId) => {
    if (window.confirm('Are you sure you want to dispense this prescription?')) {
      try {
        await pharmacyAPI.dispensePrescription(prescriptionId);
        loadPrescriptions();
        alert('Prescription dispensed successfully!');
      } catch (error) {
        console.error('Error dispensing prescription:', error);
        alert('Error dispensing prescription. Please try again.');
      }
    }
  };

  const handleUpdateStock = async (medId, newQuantity) => {
    try {
      await pharmacyAPI.updateStock(medId, newQuantity);
      loadMedications();
    } catch (error) {
      console.error('Error updating stock:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      dispensed: 'bg-green-100 text-green-800',
      partial: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStockStatusColor = (current, min) => {
    if (current === 0) return 'bg-red-100 text-red-800';
    if (current <= min) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-charcoal-grey">Pharmacy Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {userName}</p>
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
      <nav className="bg-white border-b">
        <div className="px-6">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-cornflower-blue text-cornflower-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
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
        {activeTab === 'prescriptions' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-charcoal-grey">Prescriptions</h2>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prescription Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {prescriptions.map((prescription) => {
                    const patient = patients.find(p => p.id === prescription.patient_id);
                    const doctor = doctors.find(d => d.id === prescription.doctor_id);
                    return (
                      <tr key={prescription.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">Rx #{prescription.id.slice(-6)}</div>
                            <div className="text-sm text-gray-500">{prescription.medications.length} medications</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{patient?.patient_name}</div>
                            <div className="text-sm text-gray-500">{patient?.phone_number}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{doctor?.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">₹{prescription.total_amount}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 text-xs font-semibold rounded-full ${getStatusColor(prescription.status)}`}>
                            {prescription.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {prescription.status === 'pending' && (
                            <button
                              onClick={() => handleDispensePrescription(prescription.id)}
                              className="text-cornflower-blue hover:text-cornflower-blue/80"
                            >
                              Dispense
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-charcoal-grey">Medication Inventory</h2>
              <button
                onClick={() => setShowNewMedication(true)}
                className="bg-cornflower-blue hover:bg-opacity-90 text-white font-semibold py-2 px-4 rounded-lg"
              >
                + Add Medication
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {medications.map((medication) => (
                <div key={medication.id} className="bg-white p-6 rounded-lg shadow">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-charcoal-grey">{medication.name}</h3>
                    <span className={`inline-flex px-2 text-xs font-semibold rounded-full ${getStockStatusColor(medication.stock_quantity, medication.min_stock_level)}`}>
                      {medication.stock_quantity === 0 ? 'Out of Stock' : 
                       medication.stock_quantity <= medication.min_stock_level ? 'Low Stock' : 'In Stock'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Generic:</span> {medication.generic_name}</div>
                    <div><span className="font-medium">Strength:</span> {medication.strength}</div>
                    <div><span className="font-medium">Form:</span> {medication.form}</div>
                    <div><span className="font-medium">MRP:</span> ₹{medication.mrp}</div>
                    <div><span className="font-medium">Selling Price:</span> ₹{medication.selling_price}</div>
                    <div><span className="font-medium">Current Stock:</span> {medication.stock_quantity}</div>
                    <div><span className="font-medium">Min Level:</span> {medication.min_stock_level}</div>
                  </div>
                  
                  <div className="mt-4 flex space-x-2">
                    <input
                      type="number"
                      placeholder="New quantity"
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const newQuantity = parseInt(e.target.value);
                          if (newQuantity >= 0) {
                            handleUpdateStock(medication.id, newQuantity);
                            e.target.value = '';
                          }
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const input = e.target.parentElement.querySelector('input');
                        const newQuantity = parseInt(input.value);
                        if (newQuantity >= 0) {
                          handleUpdateStock(medication.id, newQuantity);
                          input.value = '';
                        }
                      }}
                      className="px-3 py-1 text-xs bg-cornflower-blue text-white rounded hover:bg-opacity-80"
                    >
                      Update
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'dispensing' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-charcoal-grey mb-4">Dispensing Interface</h2>
            <p className="text-gray-600">Advanced dispensing interface with barcode scanning will be implemented here.</p>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-charcoal-grey">Pharmacy Reports</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900">Total Medications</h3>
                <p className="text-2xl font-bold text-blue-700">{medications.length}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-red-900">Out of Stock</h3>
                <p className="text-2xl font-bold text-red-700">
                  {medications.filter(m => m.stock_quantity === 0).length}
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-900">Low Stock</h3>
                <p className="text-2xl font-bold text-yellow-700">
                  {medications.filter(m => m.stock_quantity > 0 && m.stock_quantity <= m.min_stock_level).length}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-green-900">Prescriptions Today</h3>
                <p className="text-2xl font-bold text-green-700">{prescriptions.length}</p>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-charcoal-grey mb-4">Stock Alerts</h3>
              <div className="space-y-2">
                {medications.filter(m => m.stock_quantity <= m.min_stock_level).map(medication => (
                  <div key={medication.id} className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <span className="font-medium">{medication.name}</span>
                      <span className="text-sm text-gray-600 ml-2">({medication.strength})</span>
                    </div>
                    <span className="text-sm font-medium text-yellow-800">
                      Stock: {medication.stock_quantity} (Min: {medication.min_stock_level})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* New Medication Modal */}
      {showNewMedication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold text-charcoal-grey mb-4">Add New Medication</h3>
            <form onSubmit={handleCreateMedication} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medication Name</label>
                <input
                  type="text"
                  value={newMedication.name}
                  onChange={(e) => setNewMedication({...newMedication, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Generic Name</label>
                <input
                  type="text"
                  value={newMedication.generic_name}
                  onChange={(e) => setNewMedication({...newMedication, generic_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Strength</label>
                <input
                  type="text"
                  value={newMedication.strength}
                  onChange={(e) => setNewMedication({...newMedication, strength: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Form</label>
                <select
                  value={newMedication.form}
                  onChange={(e) => setNewMedication({...newMedication, form: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                >
                  <option value="Tablet">Tablet</option>
                  <option value="Capsule">Capsule</option>
                  <option value="Syrup">Syrup</option>
                  <option value="Injection">Injection</option>
                  <option value="Cream">Cream</option>
                  <option value="Drops">Drops</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">MRP (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newMedication.mrp}
                  onChange={(e) => setNewMedication({...newMedication, mrp: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newMedication.selling_price}
                  onChange={(e) => setNewMedication({...newMedication, selling_price: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
                <input
                  type="number"
                  value={newMedication.stock_quantity}
                  onChange={(e) => setNewMedication({...newMedication, stock_quantity: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock Level</label>
                <input
                  type="number"
                  value={newMedication.min_stock_level}
                  onChange={(e) => setNewMedication({...newMedication, min_stock_level: parseInt(e.target.value) || 10})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={newMedication.category}
                  onChange={(e) => setNewMedication({...newMedication, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                />
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-cornflower-blue hover:bg-opacity-90 text-white font-semibold py-2 px-4 rounded-md disabled:opacity-50"
                >
                  {isLoading ? 'Adding...' : 'Add Medication'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewMedication(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PharmacyDashboard;