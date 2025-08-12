import React, { useState, useEffect } from 'react';
import { useAppContext } from './AppContext';

function BillingSystem() {
  const { patients, loadPatients, doctors, loadDoctors, isLoading } = useAppContext();
  
  // State management
  const [activeTab, setActiveTab] = useState('new-bill'); // 'new-bill', 'pending-bills', 'completed-bills', 'products'
  const [bills, setBills] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [currentBill, setCurrentBill] = useState({
    patientId: '',
    patientName: '',
    phoneNumber: '',
    doctorId: '',
    items: [],
    subtotal: 0,
    discount: 0,
    tax: 0,
    total: 0,
    paymentMethod: 'Cash',
    status: 'Pending',
    notes: ''
  });

  // State for product management
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showDailyCollection, setShowDailyCollection] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Consultation',
    price: '',
    taxable: true,
    doctorId: '',
    department: 'General Medicine'
  });

  // Edit product functionality
  const editProduct = (product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      taxable: product.taxable,
      doctorId: product.doctorId || '',
      department: product.department
    });
    setShowEditProduct(true);
  };

  // Update product
  const updateProduct = () => {
    if (!newProduct.name.trim() || !newProduct.price || parseFloat(newProduct.price) <= 0) {
      alert('Please enter valid product name and price');
      return;
    }

    const updatedProducts = products.map(p => 
      p.id === editingProduct.id 
        ? {
            ...p,
            name: newProduct.name.trim(),
            category: newProduct.category,
            price: parseFloat(newProduct.price),
            taxable: newProduct.taxable,
            doctorId: newProduct.doctorId,
            department: newProduct.department
          }
        : p
    );

    setProducts(updatedProducts);
    
    // Reset form
    setNewProduct({
      name: '',
      category: 'Consultation',
      price: '',
      taxable: true,
      doctorId: '',
      department: 'General Medicine'
    });
    
    setShowEditProduct(false);
    setEditingProduct(null);
    alert(`Product "${newProduct.name}" updated successfully!`);
  };

  // Delete product
  const deleteProduct = (product) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${product.name}"?\n\n` +
      `This action cannot be undone.`
    );
    
    if (confirmDelete) {
      setProducts(prev => prev.filter(p => p.id !== product.id));
      alert(`Product "${product.name}" deleted successfully!`);
    }
  };

  // Add new product
  const addNewProduct = () => {
    if (!newProduct.name.trim() || !newProduct.price || parseFloat(newProduct.price) <= 0) {
      alert('Please enter valid product name and price');
      return;
    }

    const product = {
      id: `custom-${Date.now()}`,
      name: newProduct.name.trim(),
      category: newProduct.category,
      price: parseFloat(newProduct.price),
      taxable: newProduct.taxable,
      department: newProduct.department
    };

    setProducts(prev => [...prev, product]);
    
    // Reset form
    setNewProduct({
      name: '',
      category: 'Consultation',
      price: '',
      taxable: true,
      department: 'General Medicine'
    });
    
    setShowAddProduct(false);
    alert(`Product "${product.name}" added successfully!`);
  };

  // Default products/services - Most commonly used first
  const defaultProducts = [
    {
      id: '1',
      name: 'General Consultation',
      category: 'Consultation',
      price: 500,
      taxable: true,
      department: 'General Medicine',
      usage_count: 50 // Most used
    },
    {
      id: '2',
      name: 'Blood Pressure Check',
      category: 'Procedure',
      price: 100,
      taxable: false,
      department: 'Nursing',
      usage_count: 45
    },
    {
      id: '7',
      name: 'Paracetamol 500mg (10 tablets)',
      category: 'Medication',
      price: 25,
      taxable: false,
      department: 'Pharmacy',
      usage_count: 40
    },
    {
      id: '5',
      name: 'Blood Test - Basic',
      category: 'Laboratory',
      price: 250,
      taxable: true,
      department: 'Laboratory',
      usage_count: 35
    },
    {
      id: '3',
      name: 'Cardiology Consultation',
      category: 'Consultation', 
      price: 800,
      taxable: true,
      department: 'Cardiology',
      usage_count: 30
    },
    {
      id: '4',
      name: 'ECG',
      category: 'Procedure',
      price: 300,
      taxable: true,
      department: 'Cardiology',
      usage_count: 25
    },
    {
      id: '6',
      name: 'X-Ray - Chest',
      category: 'Imaging',
      price: 400,
      taxable: true,
      department: 'Radiology',
      usage_count: 20
    },
    {
      id: '8',
      name: 'Amoxicillin 250mg (10 capsules)',
      category: 'Medication',
      price: 80,
      taxable: false,
      department: 'Pharmacy',
      usage_count: 15
    }
  ];

  // Sample bills for demonstration
  const sampleBills = [
    {
      id: 'BILL-001',
      billNumber: 'B001/25',
      patientName: 'Arjun Menon',
      phoneNumber: '9876543210',
      doctorName: 'Dr. Emily Carter',
      items: [
        { name: 'General Consultation', quantity: 1, price: 500, total: 500 },
        { name: 'Blood Pressure Check', quantity: 1, price: 100, total: 100 }
      ],
      subtotal: 600,
      discount: 50,
      tax: 55,
      total: 605,
      paymentMethod: 'Cash',
      status: 'Completed',
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString()
    },
    {
      id: 'BILL-002',
      billNumber: 'B002/25',
      patientName: 'Priya Nair',
      phoneNumber: '9876543211',
      doctorName: 'Dr. John Adebayo',
      items: [
        { name: 'Cardiology Consultation', quantity: 1, price: 800, total: 800 },
        { name: 'ECG', quantity: 1, price: 300, total: 300 }
      ],
      subtotal: 1100,
      discount: 0,
      tax: 110,
      total: 1210,
      paymentMethod: 'UPI',
      status: 'Pending',
      createdAt: new Date().toISOString()
    }
  ];

  useEffect(() => {
    loadPatients();
    loadDoctors();
    setProducts(defaultProducts);
    setBills(sampleBills);
  }, []);

  // State for patient search
  const [showPatientSelector, setShowPatientSelector] = useState(false);
  const [matchingPatients, setMatchingPatients] = useState([]);

  // Handle patient search and selection
  const handlePatientSearch = (searchTerm) => {
    setCurrentBill(prev => ({ ...prev, patientName: searchTerm }));
    
    if (searchTerm.length === 10 && /^\d+$/.test(searchTerm)) {
      // Phone number search
      const matches = patients.filter(p => p.phone_number === searchTerm);
      if (matches.length > 0) {
        if (matches.length === 1) {
          selectPatient(matches[0]);
        } else {
          setMatchingPatients(matches);
          setShowPatientSelector(true);
        }
      }
    } else if (searchTerm.length > 2) {
      // Name search
      const matches = patients.filter(p => 
        p.patient_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (matches.length > 0) {
        setMatchingPatients(matches);
        setShowPatientSelector(true);
      } else {
        setShowPatientSelector(false);
      }
    } else {
      setShowPatientSelector(false);
    }
  };

  // Select patient for billing
  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setCurrentBill(prev => ({
      ...prev,
      patientId: patient.id,
      patientName: patient.patient_name,
      phoneNumber: patient.phone_number,
      doctorId: patient.assigned_doctor || ''
    }));
  };

  // Add item to bill
  const addItemToBill = (product, quantity = 1) => {
    const existingItemIndex = currentBill.items.findIndex(item => item.id === product.id);
    
    let updatedItems;
    if (existingItemIndex >= 0) {
      // Update existing item quantity
      updatedItems = currentBill.items.map((item, index) => 
        index === existingItemIndex 
          ? { ...item, quantity: item.quantity + quantity, total: (item.quantity + quantity) * item.price }
          : item
      );
    } else {
      // Add new item
      const newItem = {
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        quantity: quantity,
        total: product.price * quantity,
        taxable: product.taxable
      };
      updatedItems = [...currentBill.items, newItem];
    }
    
    setCurrentBill(prev => ({
      ...prev,
      items: updatedItems
    }));
    
    calculateTotals(updatedItems, currentBill.discount);
  };

  // Remove item from bill
  const removeItemFromBill = (itemId) => {
    const updatedItems = currentBill.items.filter(item => item.id !== itemId);
    setCurrentBill(prev => ({
      ...prev,
      items: updatedItems
    }));
    calculateTotals(updatedItems, currentBill.discount);
  };

  // Update item quantity
  const updateItemQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItemFromBill(itemId);
      return;
    }
    
    const updatedItems = currentBill.items.map(item => 
      item.id === itemId 
        ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
        : item
    );
    
    setCurrentBill(prev => ({
      ...prev,
      items: updatedItems
    }));
    
    calculateTotals(updatedItems, currentBill.discount);
  };

  // Calculate totals
  const calculateTotals = (items, discount = 0) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = (subtotal * discount) / 100;
    const taxableAmount = items
      .filter(item => item.taxable)
      .reduce((sum, item) => sum + item.total, 0);
    const tax = ((taxableAmount - (taxableAmount * discount / 100)) * 10) / 100; // 10% tax on taxable items
    const total = subtotal - discountAmount + tax;
    
    setCurrentBill(prev => ({
      ...prev,
      subtotal: subtotal,
      discount: discountAmount,
      tax: tax,
      total: total
    }));
  };

  // Handle discount change
  const handleDiscountChange = (discountPercent) => {
    calculateTotals(currentBill.items, discountPercent);
  };

  // Generate bill number
  const generateBillNumber = () => {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const billCount = bills.length + 1;
    return `B${billCount.toString().padStart(3, '0')}/${year}`;
  };

  // Save bill
  const saveBill = () => {
    if (!selectedPatient || currentBill.items.length === 0) {
      alert('Please select a patient and add items to the bill');
      return;
    }

    const newBill = {
      ...currentBill,
      id: `BILL-${Date.now()}`,
      billNumber: generateBillNumber(),
      doctorName: getDoctorName(currentBill.doctorId),
      createdAt: new Date().toISOString(),
      status: 'Pending'
    };

    setBills(prev => [...prev, newBill]);
    
    // Reset form
    resetBillForm();
    
    alert(`Bill ${newBill.billNumber} created successfully!`);
  };

  // Mark bill as paid
  const markBillAsPaid = (billId) => {
    setBills(prev => 
      prev.map(bill => 
        bill.id === billId 
          ? { ...bill, status: 'Completed', paidAt: new Date().toISOString() }
          : bill
      )
    );
  };

  // Handle refund
  const handleRefund = (bill) => {
    const confirmRefund = window.confirm(
      `Issue refund for ${bill.patientName}?\n\n` +
      `Bill: ${bill.billNumber}\n` +
      `Amount: ${formatCurrency(bill.total)}\n\n` +
      `This will change the status back to "Refunded" and reverse the payment.`
    );
    
    if (confirmRefund) {
      setBills(prev => 
        prev.map(b => 
          b.id === bill.id 
            ? { ...b, status: 'Refunded', refundedAt: new Date().toISOString() }
            : b
        )
      );
      alert(`Refund of ${formatCurrency(bill.total)} processed for ${bill.patientName}`);
    }
  };

  // Reset bill form
  const resetBillForm = () => {
    setSelectedPatient(null);
    setCurrentBill({
      patientId: '',
      patientName: '',
      phoneNumber: '',
      doctorId: '',
      items: [],
      subtotal: 0,
      discount: 0,
      tax: 0,
      total: 0,
      paymentMethod: 'Cash',
      status: 'Pending',
      notes: ''
    });
  };

  // Get doctor name
  const getDoctorName = (doctorId) => {
    const doctor = doctors.find(d => d.id === doctorId);
    return doctor ? `Dr. ${doctor.name}` : 'Unassigned';
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `₹${amount.toFixed(2)}`;
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata'
    });
  };

  // Print bill
  const printBill = (bill) => {
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${bill.billNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; margin: 0; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #2c5aa0; padding-bottom: 15px; margin-bottom: 20px; }
          .clinic-name { font-size: 20px; font-weight: bold; color: #2c5aa0; }
          .invoice-info { display: flex; justify-content: space-between; margin: 20px 0; }
          .patient-info { margin: 15px 0; }
          .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .items-table th { background-color: #f8f9fa; }
          .totals { margin-top: 20px; text-align: right; }
          .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
          .final-total { font-weight: bold; font-size: 16px; border-top: 2px solid #2c5aa0; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="clinic-name">UNICARE POLYCLINIC</div>
          <div>Electronic Health Record System • Kerala, India</div>
        </div>

        <div class="invoice-info">
          <div>
            <strong>Invoice No:</strong> ${bill.billNumber}<br>
            <strong>Date:</strong> ${formatDate(bill.createdAt)}<br>
            <strong>Payment:</strong> ${bill.paymentMethod}
          </div>
          <div>
            <strong>Status:</strong> ${bill.status}<br>
            ${bill.paidAt ? `<strong>Paid:</strong> ${formatDate(bill.paidAt)}` : ''}
          </div>
        </div>

        <div class="patient-info">
          <strong>Patient:</strong> ${bill.patientName}<br>
          <strong>Phone:</strong> ${bill.phoneNumber}<br>
          <strong>Doctor:</strong> ${bill.doctorName}
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Item/Service</th>
              <th>Category</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${bill.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td>${item.quantity}</td>
                <td>₹${item.price.toFixed(2)}</td>
                <td>₹${item.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>₹${bill.subtotal.toFixed(2)}</span>
          </div>
          ${bill.discount > 0 ? `
          <div class="total-row">
            <span>Discount:</span>
            <span>-₹${bill.discount.toFixed(2)}</span>
          </div>
          ` : ''}
          <div class="total-row">
            <span>Tax (10%):</span>
            <span>₹${bill.tax.toFixed(2)}</span>
          </div>
          <div class="total-row final-total">
            <span>Total Amount:</span>
            <span>₹${bill.total.toFixed(2)}</span>
          </div>
        </div>

        <div style="margin-top: 30px; text-align: center; font-size: 11px; color: #666;">
          <p>Thank you for choosing Unicare Polyclinic</p>
          <p>Kerala, India • Asia/Kolkata</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // Filter bills
  const getFilteredBills = (status) => {
    return bills.filter(bill => status === 'all' || bill.status === status);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-charcoal-grey">Products & Billing</h2>
              <p className="text-sm text-coral-red italic mt-1">
                Add/Edit Products • Generate Invoices • Audit Trails • Income Stratification • Unicare Polyclinic • Kerala
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'new-bill', label: 'New Bill', icon: '📄' },
              { id: 'pending-bills', label: 'Pending Bills', icon: '⏳' },
              { id: 'completed-bills', label: 'Completed Bills', icon: '✅' },
              { id: 'products', label: 'Products & Services', icon: '🛒' },
              { id: 'daily-collection', label: 'Daily Collection', icon: '💰' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-cornflower-blue text-cornflower-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'new-bill' && (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Side - Patient & Items */}
              <div className="space-y-6">
                {/* Patient Selection */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Information</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Patient Name
                      </label>
                      <input
                        type="text"
                        value={currentBill.patientName}
                        onChange={(e) => handlePatientSearch(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
                        placeholder="Enter patient name or phone"
                      />
                      
                      {/* Floating Patient Selector */}
                      {showPatientSelector && matchingPatients.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          <div className="p-2 bg-gray-50 border-b">
                            <span className="text-sm font-medium text-gray-700">
                              Select Patient ({matchingPatients.length} found):
                            </span>
                          </div>
                          {matchingPatients.map((patient, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => {
                                selectPatient(patient);
                                setShowPatientSelector(false);
                              }}
                              className="w-full text-left p-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">{patient.patient_name}</div>
                              <div className="text-sm text-gray-600">
                                {patient.phone_number} • {patient.age} years, {patient.sex}
                              </div>
                              <div className="text-xs text-gray-500">{patient.address}</div>
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setShowPatientSelector(false)}
                            className="w-full text-left p-3 bg-green-50 text-green-700 hover:bg-green-100"
                          >
                            + Create new patient: "{currentBill.patientName}"
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={currentBill.phoneNumber}
                        onChange={(e) => {
                          setCurrentBill(prev => ({ ...prev, phoneNumber: e.target.value }));
                          handlePatientSearch(e.target.value);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
                        placeholder="10-digit mobile number"
                      />
                    </div>
                  </div>

                  {selectedPatient && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-900">
                            {selectedPatient.patient_name} • {selectedPatient.age} years, {selectedPatient.sex}
                          </p>
                          <p className="text-sm text-blue-700">
                            {selectedPatient.phone_number} • OPD: {selectedPatient.opd_number || 'Not assigned'}
                          </p>
                          <p className="text-xs text-blue-600">
                            Address: {selectedPatient.address || 'Not provided'}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedPatient(null);
                            setCurrentBill(prev => ({ ...prev, patientName: '', phoneNumber: '', patientId: '' }));
                            setShowPatientSelector(false);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Products/Services */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Add Products/Services</h3>
                  
                  <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                    {products.map(product => (
                      <div key={product.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-500">{product.category} • {product.department}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-cornflower-blue">{formatCurrency(product.price)}</span>
                          <button
                            onClick={() => addItemToBill(product)}
                            className="bg-cornflower-blue text-white px-3 py-1 rounded text-sm hover:bg-opacity-80"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Side - Bill Summary */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Bill Summary</h3>
                
                {currentBill.items.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No items added to bill</p>
                ) : (
                  <div className="space-y-4">
                    {/* Bill Items */}
                    <div className="space-y-2">
                      {currentBill.items.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded border">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.name}</p>
                            <p className="text-sm text-gray-500">{formatCurrency(item.price)} each</p>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                              className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded text-sm hover:bg-gray-100"
                            >
                              -
                            </button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded text-sm hover:bg-gray-100"
                            >
                              +
                            </button>
                            <span className="w-16 text-right font-medium">{formatCurrency(item.total)}</span>
                            <button
                              onClick={() => removeItemFromBill(item.id)}
                              className="text-red-600 hover:text-red-800 ml-2"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Discount */}
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">Discount (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={currentBill.discount > 0 ? (currentBill.discount / currentBill.subtotal * 100).toFixed(0) : '0'}
                          onChange={(e) => handleDiscountChange(parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                    </div>

                    {/* Totals */}
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(currentBill.subtotal)}</span>
                      </div>
                      {currentBill.discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount:</span>
                          <span>-{formatCurrency(currentBill.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Tax (10%):</span>
                        <span>{formatCurrency(currentBill.tax)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold text-cornflower-blue border-t pt-2">
                        <span>Total:</span>
                        <span>{formatCurrency(currentBill.total)}</span>
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="border-t pt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Method
                      </label>
                      <select
                        value={currentBill.paymentMethod}
                        onChange={(e) => setCurrentBill(prev => ({ ...prev, paymentMethod: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="UPI">UPI</option>
                        <option value="Net Banking">Net Banking</option>
                        <option value="Insurance">Insurance</option>
                      </select>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes
                      </label>
                      <textarea
                        value={currentBill.notes}
                        onChange={(e) => setCurrentBill(prev => ({ ...prev, notes: e.target.value }))}
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
                        placeholder="Additional notes..."
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-4 pt-4">
                      <button
                        onClick={saveBill}
                        className="flex-1 bg-cornflower-blue text-white py-2 px-4 rounded-lg hover:bg-opacity-80"
                      >
                        Save Bill
                      </button>
                      <button
                        onClick={resetBillForm}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'pending-bills' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Bills</h3>
              
              <div className="space-y-4">
                {getFilteredBills('Pending').map(bill => (
                  <div key={bill.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{bill.billNumber} - {bill.patientName}</p>
                        <p className="text-sm text-gray-500">{bill.phoneNumber} • {formatDate(bill.createdAt)} • {bill.doctorName}</p>
                        <p className="text-lg font-bold text-cornflower-blue">{formatCurrency(bill.total)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => printBill(bill)}
                          className="px-3 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                        >
                          Print
                        </button>
                        <button
                          onClick={() => markBillAsPaid(bill.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Mark Paid
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {getFilteredBills('Pending').length === 0 && (
                  <p className="text-gray-500 text-center py-8">No pending bills</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'completed-bills' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Completed Bills</h3>
              
              <div className="space-y-4">
                {getFilteredBills('Completed').map(bill => (
                  <div key={bill.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{bill.billNumber} - {bill.patientName}</p>
                        <p className="text-sm text-gray-500">{bill.phoneNumber} • Paid: {formatDate(bill.paidAt || bill.createdAt)}</p>
                        <p className="text-lg font-bold text-green-600">{formatCurrency(bill.total)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          bill.status === 'Refunded' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {bill.status === 'Refunded' ? 'Refunded' : 'Paid'}
                        </span>
                        <button
                          onClick={() => printBill(bill)}
                          className="px-3 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                        >
                          Print
                        </button>
                        {bill.status === 'Completed' && (
                          <button
                            onClick={() => handleRefund(bill)}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Refund
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {getFilteredBills('Completed').length === 0 && (
                  <p className="text-gray-500 text-center py-8">No completed bills</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Products & Services</h3>
                <button 
                  onClick={() => setShowAddProduct(true)}
                  className="bg-cornflower-blue text-white px-4 py-2 rounded-lg hover:bg-opacity-80"
                >
                  Add Product
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(product => (
                  <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">{product.category}</p>
                        <p className="text-sm text-gray-500">
                          {getDoctorName(product.doctorId) || product.department}
                        </p>
                        <p className="text-lg font-bold text-cornflower-blue">{formatCurrency(product.price)}</p>
                        <p className="text-xs text-gray-400">{product.taxable ? 'Taxable' : 'Non-taxable'}</p>
                      </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => editProduct(product)}
                            className="text-cornflower-blue hover:text-opacity-80 text-sm"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => deleteProduct(product)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'daily-collection' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Collection Report</h3>
              
              {/* Date Range Filters */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                    <input
                      type="date"
                      defaultValue={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-cornflower-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                    <input
                      type="date"
                      defaultValue={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-cornflower-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-cornflower-blue">
                      <option value="">All Doctors</option>
                      {doctors.map(doctor => (
                        <option key={doctor.id} value={doctor.id}>
                          Dr. {doctor.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button className="w-full bg-cornflower-blue text-white px-4 py-2 rounded-lg hover:bg-opacity-80">
                      Generate Report
                    </button>
                  </div>
                </div>
              </div>

              {/* Collection Summary */}
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">₹12,450</div>
                  <div className="text-sm text-gray-600">Today's Collection</div>
                </div>
                <div className="bg-white border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">₹8,200</div>
                  <div className="text-sm text-gray-600">Consultations</div>
                </div>
                <div className="bg-white border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">₹2,800</div>
                  <div className="text-sm text-gray-600">Procedures</div>
                </div>
                <div className="bg-white border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">₹1,450</div>
                  <div className="text-sm text-gray-600">Medications</div>
                </div>
              </div>

              {/* Doctor Collection Breakdown */}
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b">
                  <h4 className="text-lg font-medium text-gray-900">Doctor-wise Collection</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patients</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Collections</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Average</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">Dr. Emily Carter</div>
                          <div className="text-sm text-gray-500">General Medicine</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">15</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">₹7,500</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹500</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">Dr. John Adebayo</div>
                          <div className="text-sm text-gray-500">Cardiology</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">6</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">₹4,800</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹800</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md m-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add New Product/Service
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product/Service Name *
                </label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
                  placeholder="Enter product/service name"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
                  >
                    <option value="Consultation">Consultation</option>
                    <option value="Procedure">Procedure</option>
                    <option value="Laboratory">Laboratory</option>
                    <option value="Imaging">Imaging</option>
                    <option value="Medication">Medication</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    value={newProduct.department}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
                  >
                    <option value="General Medicine">General Medicine</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Laboratory">Laboratory</option>
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="Nursing">Nursing</option>
                    <option value="Radiology">Radiology</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cornflower-blue focus:border-cornflower-blue"
                  placeholder="Enter price"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="taxable"
                  checked={newProduct.taxable}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, taxable: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="taxable" className="text-sm text-gray-700">
                  Taxable (10% tax will be applied)
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  setShowAddProduct(false);
                  setNewProduct({
                    name: '',
                    category: 'Consultation',
                    price: '',
                    taxable: true,
                    department: 'General Medicine'
                  });
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={addNewProduct}
                className="px-4 py-2 bg-cornflower-blue text-white rounded-lg hover:bg-opacity-80"
              >
                Add Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BillingSystem;