import React, { useState, useEffect } from 'react';
import { labAPI, patientsAPI, doctorsAPI } from '../api';

function LaboratoryDashboard({ onLogout, userName }) {
  const [activeTab, setActiveTab] = useState('orders');
  const [labTests, setLabTests] = useState([]);
  const [labOrders, setLabOrders] = useState([]);
  const [labResults, setLabResults] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [showNewTest, setShowNewTest] = useState(false);
  const [newOrder, setNewOrder] = useState({
    patient_id: '',
    doctor_id: '',
    tests: [],
    priority: 'routine',
    clinical_notes: ''
  });
  const [newTest, setNewTest] = useState({
    test_name: '',
    test_code: '',
    category: '',
    sample_type: '',
    price: 0,
    tat_hours: 24,
    preparation_notes: ''
  });

  const tabs = [
    { id: 'orders', name: 'Lab Orders', icon: '🧪' },
    { id: 'results', name: 'Results', icon: '📊' },
    { id: 'tests', name: 'Test Catalog', icon: '📋' },
    { id: 'samples', name: 'Sample Tracking', icon: '🧬' }
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'orders') {
      loadLabOrders();
    } else if (activeTab === 'results') {
      loadLabResults();
    } else if (activeTab === 'tests') {
      loadLabTests();
    }
  }, [activeTab]);

  const loadInitialData = async () => {
    try {
      const [patientsData, doctorsData, testsData] = await Promise.all([
        patientsAPI.getAll(),
        doctorsAPI.getAll(),
        labAPI.getTests()
      ]);
      setPatients(patientsData);
      setDoctors(doctorsData);
      setLabTests(testsData);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadLabOrders = async () => {
    try {
      setIsLoading(true);
      const ordersData = await labAPI.getOrders();
      setLabOrders(ordersData);
    } catch (error) {
      console.error('Error loading lab orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLabResults = async () => {
    try {
      setIsLoading(true);
      const resultsData = await labAPI.getResults();
      setLabResults(resultsData);
    } catch (error) {
      console.error('Error loading lab results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLabTests = async () => {
    try {
      setIsLoading(true);
      const testsData = await labAPI.getTests();
      setLabTests(testsData);
    } catch (error) {
      console.error('Error loading lab tests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await labAPI.createOrder(newOrder);
      setNewOrder({
        patient_id: '',
        doctor_id: '',
        tests: [],
        priority: 'routine',
        clinical_notes: ''
      });
      setShowNewOrder(false);
      loadLabOrders();
    } catch (error) {
      console.error('Error creating lab order:', error);
      alert('Error creating lab order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTest = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await labAPI.addTest(newTest);
      setNewTest({
        test_name: '',
        test_code: '',
        category: '',
        sample_type: '',
        price: 0,
        tat_hours: 24,
        preparation_notes: ''
      });
      setShowNewTest(false);
      loadLabTests();
    } catch (error) {
      console.error('Error creating lab test:', error);
      alert('Error creating lab test. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, status) => {
    try {
      await labAPI.updateOrderStatus(orderId, status);
      loadLabOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      collected: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      reported: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      routine: 'bg-green-100 text-green-800',
      urgent: 'bg-orange-100 text-orange-800',
      stat: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-charcoal-grey">Laboratory Dashboard</h1>
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
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-charcoal-grey">Lab Orders</h2>
              <button
                onClick={() => setShowNewOrder(true)}
                className="bg-cornflower-blue hover:bg-opacity-90 text-white font-semibold py-2 px-4 rounded-lg"
              >
                + New Order
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tests
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
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
                  {labOrders.map((order) => {
                    const patient = patients.find(p => p.id === order.patient_id);
                    return (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">Order #{order.id.slice(-6)}</div>
                            <div className="text-sm text-gray-500">₹{order.total_amount}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{patient?.patient_name}</div>
                            <div className="text-sm text-gray-500">{patient?.phone_number}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{order.tests.length} tests</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 text-xs font-semibold rounded-full ${getPriorityColor(order.priority)}`}>
                            {order.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                            className="text-sm border rounded px-2 py-1"
                          >
                            <option value="pending">Pending</option>
                            <option value="collected">Collected</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="reported">Reported</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'tests' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-charcoal-grey">Test Catalog</h2>
              <button
                onClick={() => setShowNewTest(true)}
                className="bg-cornflower-blue hover:bg-opacity-90 text-white font-semibold py-2 px-4 rounded-lg"
              >
                + Add Test
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {labTests.map((test) => (
                <div key={test.id} className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-charcoal-grey">{test.test_name}</h3>
                  <p className="text-sm text-gray-600 mb-2">Code: {test.test_code}</p>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Category:</span> {test.category}</div>
                    <div><span className="font-medium">Sample:</span> {test.sample_type}</div>
                    <div><span className="font-medium">Price:</span> ₹{test.price}</div>
                    <div><span className="font-medium">TAT:</span> {test.tat_hours} hours</div>
                  </div>
                  {test.preparation_notes && (
                    <div className="mt-3 p-2 bg-yellow-50 rounded text-xs">
                      <span className="font-medium">Note:</span> {test.preparation_notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-charcoal-grey mb-4">Lab Results</h2>
            <p className="text-gray-600">Results management interface will be implemented here.</p>
          </div>
        )}

        {activeTab === 'samples' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-charcoal-grey mb-4">Sample Tracking</h2>
            <p className="text-gray-600">Sample tracking interface will be implemented here.</p>
          </div>
        )}
      </main>

      {/* New Order Modal */}
      {showNewOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-charcoal-grey mb-4">Create New Lab Order</h3>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                <select
                  value={newOrder.patient_id}
                  onChange={(e) => setNewOrder({...newOrder, patient_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  required
                >
                  <option value="">Select Patient</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.patient_name} - {patient.phone_number}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
                <select
                  value={newOrder.doctor_id}
                  onChange={(e) => setNewOrder({...newOrder, doctor_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                >
                  <option value="">Select Doctor</option>
                  {doctors.map(doctor => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={newOrder.priority}
                  onChange={(e) => setNewOrder({...newOrder, priority: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                >
                  <option value="routine">Routine</option>
                  <option value="urgent">Urgent</option>
                  <option value="stat">STAT</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Notes</label>
                <textarea
                  value={newOrder.clinical_notes}
                  onChange={(e) => setNewOrder({...newOrder, clinical_notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  rows="3"
                />
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-cornflower-blue hover:bg-opacity-90 text-white font-semibold py-2 px-4 rounded-md disabled:opacity-50"
                >
                  {isLoading ? 'Creating...' : 'Create Order'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewOrder(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Test Modal */}
      {showNewTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-charcoal-grey mb-4">Add New Test</h3>
            <form onSubmit={handleCreateTest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Test Name</label>
                <input
                  type="text"
                  value={newTest.test_name}
                  onChange={(e) => setNewTest({...newTest, test_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Test Code</label>
                <input
                  type="text"
                  value={newTest.test_code}
                  onChange={(e) => setNewTest({...newTest, test_code: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={newTest.category}
                  onChange={(e) => setNewTest({...newTest, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sample Type</label>
                <input
                  type="text"
                  value={newTest.sample_type}
                  onChange={(e) => setNewTest({...newTest, sample_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                <input
                  type="number"
                  value={newTest.price}
                  onChange={(e) => setNewTest({...newTest, price: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TAT (Hours)</label>
                <input
                  type="number"
                  value={newTest.tat_hours}
                  onChange={(e) => setNewTest({...newTest, tat_hours: parseInt(e.target.value) || 24})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  required
                />
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-cornflower-blue hover:bg-opacity-90 text-white font-semibold py-2 px-4 rounded-md disabled:opacity-50"
                >
                  {isLoading ? 'Adding...' : 'Add Test'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewTest(false)}
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

export default LaboratoryDashboard;