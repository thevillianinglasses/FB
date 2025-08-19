// src/components/pharmacy/ProductsInventory.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pharmacyAPI } from '../../api';
import { formatCurrency } from '../../utils/gst';
import { toast } from 'react-hot-toast';
import ScheduleChip from './ScheduleChip';

export default function ProductsInventory() {
  const [activeTab, setActiveTab] = useState('inventory');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [filters, setFilters] = useState({
    rack: '',
    schedule: '',
    search: ''
  });

  const queryClient = useQueryClient();

  // Fetch current stock
  const { data: stock, isLoading } = useQuery({
    queryKey: ['pharmacy', 'inventory', 'stock', filters],
    queryFn: () => pharmacyAPI.getCurrentStock(filters),
  });

  // Fetch products
  const { data: products } = useQuery({
    queryKey: ['pharmacy', 'products'],
    queryFn: () => pharmacyAPI.getProducts(),
  });

  // Fetch racks
  const { data: racks } = useQuery({
    queryKey: ['pharmacy', 'racks'],
    queryFn: () => pharmacyAPI.getRacks(),
  });

  const renderInventoryView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-800">Current Inventory</h3>
        <button
          onClick={() => setShowAddProduct(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          + Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search by brand or chemical name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rack</label>
            <select
              value={filters.rack}
              onChange={(e) => setFilters({ ...filters, rack: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Racks</option>
              {racks?.map((rack) => (
                <option key={rack.id} value={rack.id}>{rack.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Schedule</label>
            <select
              value={filters.schedule}
              onChange={(e) => setFilters({ ...filters, schedule: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Schedules</option>
              <option value="NONE">NONE</option>
              <option value="G">G - General</option>
              <option value="K">K - Ayurvedic</option>
              <option value="H">H - Schedule H</option>
              <option value="N">N - Narcotic</option>
              <option value="H1">H1 - Schedule H1</option>
              <option value="X">X - Psychotropic</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ rack: '', schedule: '', search: '' })}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Tree */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b border-gray-200">
          <h4 className="text-lg font-medium text-gray-800">Inventory Tree (Product → Batches)</h4>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Batch Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pricing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stock?.length > 0 ? (
                stock.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <div className="text-sm font-medium text-gray-900">
                            {item.product_name}
                          </div>
                          <ScheduleChip symbol={item.schedule_symbol} />
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.chemical_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.company_name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          Batch: {item.batch_no}
                        </div>
                        <div className={`text-sm ${
                          item.expiry_color === 'red' ? 'text-red-600' :
                          item.expiry_color === 'orange' ? 'text-orange-600' :
                          item.expiry_color === 'yellow' ? 'text-yellow-600' :
                          'text-gray-500'
                        }`}>
                          Exp: {item.expiry}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.current_stock} units
                        </div>
                        <div className="text-sm text-gray-500">
                          GST: {item.gst_rate}%
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          MRP: {formatCurrency(item.mrp)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Cost: {formatCurrency(item.effective_cost_per_unit)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {item.rack_id || 'Unassigned'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          Move
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          History
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <div className="text-3xl mb-2">📦</div>
                      <div>No inventory items found</div>
                      <div className="text-sm mt-1">Try adjusting your filters or add some products</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderProductsView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-800">Product Master</h3>
        <button
          onClick={() => setShowAddProduct(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          + Add New Product
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Packaging
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Levels
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products?.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {product.brand_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {product.chemical_name} {product.strength}
                      </div>
                      <div className="text-sm text-gray-500">
                        {product.form} • HSN: {product.hsn}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {product.pack_size} {product.pack_type}
                    </div>
                    <div className="text-sm text-gray-500">
                      {product.company_name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <ScheduleChip symbol={product.schedule_symbol} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      Current: {product.current_stock || 0}
                    </div>
                    <div className="text-sm text-gray-500">
                      Min: {product.min_level || 0} | Max: {product.max_level || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">Edit</button>
                      <button className="text-green-600 hover:text-green-900">Schedule</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderRacksView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-800">Rack Management</h3>
        <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
          + Add Rack
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {racks?.map((rack) => (
          <div key={rack.id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-medium text-gray-800">{rack.name}</h4>
                <p className="text-sm text-gray-500">{rack.location_note}</p>
              </div>
              <div className="flex space-x-2">
                <button className="text-blue-600 hover:text-blue-900 text-sm">Edit</button>
                <button className="text-red-600 hover:text-red-900 text-sm">Delete</button>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              Items stored: Loading...
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading inventory...</div>;
  }

  return (
    <div>
      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'inventory', label: 'Current Inventory', icon: '📦' },
              { id: 'products', label: 'Product Master', icon: '💊' },
              { id: 'racks', label: 'Rack Management', icon: '🏪' },
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

      {/* Tab Content */}
      {activeTab === 'inventory' && renderInventoryView()}
      {activeTab === 'products' && renderProductsView()}
      {activeTab === 'racks' && renderRacksView()}

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-800">Add New Product</h3>
              <button
                onClick={() => setShowAddProduct(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Brand Name *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Dolo 650"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chemical Name *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Paracetamol"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Strength *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 650mg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Form *</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Form</option>
                  <option value="Tablet">Tablet</option>
                  <option value="Capsule">Capsule</option>
                  <option value="Syrup">Syrup</option>
                  <option value="Injection">Injection</option>
                  <option value="Cream">Cream</option>
                  <option value="Ointment">Ointment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">HSN Code *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 30049099"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Symbol *</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="NONE">NONE</option>
                  <option value="G">G - General</option>
                  <option value="K">K - Ayurvedic</option>
                  <option value="H">H - Schedule H</option>
                  <option value="N">N - Narcotic</option>
                  <option value="H1">H1 - Schedule H1</option>
                  <option value="X">X - Psychotropic</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowAddProduct(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Add Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}