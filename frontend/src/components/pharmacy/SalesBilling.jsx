// src/components/pharmacy/SalesBilling.jsx
import React, { useState } from 'react';
import { formatCurrency, generateBillNumber } from '../../utils/gst';
import ScheduleChip from './ScheduleChip';
import RxComplianceBanner from './RxComplianceBanner';

export default function SalesBilling() {
  const [activeTab, setActiveTab] = useState('new-sale');
  const [tabs, setTabs] = useState([{
    id: 'tab1',
    billNo: generateBillNumber(),
    items: [],
    patient: { name: '', age: '', sex: 'Male', phone: '' },
    compliance: null,
    payments: { cash: 0, upi: 0 },
    isActive: true
  }]);

  const renderNewSale = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-800">New Sale</h3>
        <button
          onClick={() => {
            const newTab = {
              id: `tab${Date.now()}`,
              billNo: generateBillNumber(),
              items: [],
              patient: { name: '', age: '', sex: 'Male', phone: '' },
              compliance: null,
              payments: { cash: 0, upi: 0 },
              isActive: true
            };
            setTabs([...tabs.map(t => ({ ...t, isActive: false })), newTab]);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          + New Tab
        </button>
      </div>

      {/* Tab Headers */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTabs(tabs.map(t => ({ ...t, isActive: t.id === tab.id })))}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                tab.isActive
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.billNo}
              {tab.items.length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {tab.items.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Active Tab Content */}
      {tabs.filter(tab => tab.isActive).map(activeTab => (
        <div key={activeTab.id} className="space-y-6">
          {/* Schedule Compliance Banner */}
          <RxComplianceBanner 
            required={activeTab.items.some(item => item.scheduleSymbol !== 'NONE')}
            symbol={activeTab.items.find(item => item.scheduleSymbol !== 'NONE')?.scheduleSymbol}
            onAttach={(payload) => {
              // Handle prescription attachment
              console.log('Prescription attached:', payload);
            }}
          />

          {/* Sale Header */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bill No
                </label>
                <input
                  type="text"
                  value={activeTab.billNo}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue={new Date().toISOString().slice(0, 16)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prescribed by
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Doctor name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <input type="checkbox" className="mr-2" />
                  OP Mode
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="OPD No (auto-fills patient)"
                />
              </div>
            </div>

            {/* Patient Details */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-lg font-medium text-gray-800 mb-4">Patient Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter patient name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age *
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Age"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sex *
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone (auto-suggest)
                  </label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Phone number"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-medium text-gray-800">Sale Items</h4>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Pricing Mode:</label>
                    <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                      <option value="MRP_INC">MRP Inclusive</option>
                      <option value="RATE_EX">Rate Exclusive</option>
                    </select>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm">
                    + Add Item
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">SL</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">NOS</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rate/MRP</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">GST %</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">GST Amt</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">MRP</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">% Disc</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">CGST</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">SGST</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Net</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activeTab.items.length === 0 ? (
                    <tr>
                      <td colSpan="13" className="px-3 py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <div className="text-3xl mb-2">💊</div>
                          <div>No items added yet</div>
                          <div className="text-sm mt-1">Search by brand or chemical name to add items</div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    activeTab.items.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-sm">{index + 1}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{item.name}</span>
                            <ScheduleChip symbol={item.scheduleSymbol} />
                          </div>
                        </td>
                        <td className="px-3 py-2 text-sm">{item.nos}</td>
                        <td className="px-3 py-2 text-sm">{formatCurrency(item.rate)}</td>
                        <td className="px-3 py-2 text-sm">{formatCurrency(item.amount)}</td>
                        <td className="px-3 py-2 text-sm">{item.gstRate}%</td>
                        <td className="px-3 py-2 text-sm">{formatCurrency(item.gstAmount)}</td>
                        <td className="px-3 py-2 text-sm">{formatCurrency(item.mrp)}</td>
                        <td className="px-3 py-2 text-sm">{item.discountPct}%</td>
                        <td className="px-3 py-2 text-sm">{formatCurrency(item.cgst)}</td>
                        <td className="px-3 py-2 text-sm">{formatCurrency(item.sgst)}</td>
                        <td className="px-3 py-2 text-sm font-semibold">{formatCurrency(item.net)}</td>
                        <td className="px-3 py-2">
                          <button className="text-red-600 hover:text-red-800 text-sm">Remove</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-medium text-gray-800 mb-4">Payment Details</h4>
                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                      💵 Cash
                    </button>
                    <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                      📱 UPI
                    </button>
                    <button className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                      💳 Cash + UPI
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cash Amount</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">UPI Amount</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-gray-800 mb-4">Bill Summary</h4>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">MRP Total:</dt>
                    <dd className="text-sm font-medium">₹0.00</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Discount on MRP:</dt>
                    <dd className="text-sm font-medium">₹0.00</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Taxable:</dt>
                    <dd className="text-sm font-medium">₹0.00</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">CGST:</dt>
                    <dd className="text-sm font-medium">₹0.00</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">SGST:</dt>
                    <dd className="text-sm font-medium">₹0.00</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">IGST:</dt>
                    <dd className="text-sm font-medium">₹0.00</dd>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <dt className="text-base font-semibold text-gray-900">Net Amount:</dt>
                    <dd className="text-base font-semibold text-gray-900">₹0.00</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                Save Draft
              </button>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                💾 Save & Print
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'new-sale', label: 'New Sale', icon: '💊' },
              { id: 'sales-list', label: 'Sales List', icon: '📋' },
              { id: 'edit-sales', label: 'Edit Sales', icon: '✏️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {activeTab === 'new-sale' && renderNewSale()}
      {activeTab === 'sales-list' && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Sales List</h3>
          <p className="text-gray-600">View and manage all sales transactions</p>
        </div>
      )}
      {activeTab === 'edit-sales' && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">✏️</div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Edit Sales</h3>
          <p className="text-gray-600">Edit existing sales with audit trail</p>
        </div>
      )}
    </div>
  );
}