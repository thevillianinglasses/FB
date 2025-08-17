// src/components/pharmacy/ReturnsRefunds.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pharmacyAPI } from '../../api';
import { formatCurrency } from '../../utils/gst';
import { toast } from 'react-hot-toast';

export default function ReturnsRefunds() {
  const [activeTab, setActiveTab] = useState('new-return');
  const [searchBillNo, setSearchBillNo] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [returnItems, setReturnItems] = useState([]);

  const queryClient = useQueryClient();

  // Fetch returns
  const { data: returns, isLoading } = useQuery({
    queryKey: ['pharmacy', 'returns'],
    queryFn: () => pharmacyAPI.getReturns(),
  });

  // Search sale mutation
  const searchSaleMutation = useMutation({
    mutationFn: (billNo) => pharmacyAPI.searchSaleForReturn(billNo),
    onSuccess: (data) => {
      setSelectedSale(data.sale);
      setReturnItems(data.items.map(item => ({ ...item, qty_returned: 0, selected: false })));
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Sale not found');
      setSelectedSale(null);
      setReturnItems([]);
    },
  });

  // Create return mutation
  const createReturnMutation = useMutation({
    mutationFn: (returnData) => pharmacyAPI.createReturn(returnData),
    onSuccess: () => {
      toast.success('Return processed successfully');
      queryClient.invalidateQueries(['pharmacy', 'returns']);
      queryClient.invalidateQueries(['pharmacy', 'inventory']);
      setActiveTab('returns-list');
      setSelectedSale(null);
      setReturnItems([]);
      setSearchBillNo('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to process return');
    },
  });

  const handleSearchSale = () => {
    if (searchBillNo.trim()) {
      searchSaleMutation.mutate(searchBillNo.trim());
    }
  };

  const handleReturnQuantityChange = (itemId, qty) => {
    setReturnItems(returnItems.map(item => 
      item.id === itemId 
        ? { ...item, qty_returned: Math.min(qty, item.available_for_return), selected: qty > 0 }
        : item
    ));
  };

  const handleProcessReturn = () => {
    const selectedItems = returnItems.filter(item => item.selected && item.qty_returned > 0);
    
    if (selectedItems.length === 0) {
      toast.error('Please select items to return');
      return;
    }

    const returnData = {
      sale_id: selectedSale.id,
      bill_no: selectedSale.bill_no,
      items: selectedItems.map(item => ({
        sale_item_id: item.id,
        batch_id: item.batch_id,
        qty_returned: item.qty_returned
      })),
      reason: 'Customer return' // Could be made dynamic
    };

    createReturnMutation.mutate(returnData);
  };

  const renderNewReturn = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-800">Process Sales Return</h3>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h4 className="text-lg font-medium text-gray-800 mb-4">Search Sale for Return</h4>
        <div className="flex space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bill Number
            </label>
            <input
              type="text"
              value={searchBillNo}
              onChange={(e) => setSearchBillNo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter bill number (e.g., 0001/FY25-26)"
              onKeyPress={(e) => e.key === 'Enter' && handleSearchSale()}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSearchSale}
              disabled={searchSaleMutation.isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {searchSaleMutation.isLoading ? 'Searching...' : '🔍 Search'}
            </button>
          </div>
        </div>
      </div>

      {/* Sale Details */}
      {selectedSale && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h4 className="text-lg font-medium text-gray-800 mb-4">Original Sale Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Bill No:</dt>
                  <dd className="text-sm text-gray-900">{selectedSale.bill_no}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Date:</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(selectedSale.date_time).toLocaleDateString()}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Patient:</dt>
                  <dd className="text-sm text-gray-900">{selectedSale.patient.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Doctor:</dt>
                  <dd className="text-sm text-gray-900">{selectedSale.doctor_name || 'N/A'}</dd>
                </div>
              </dl>
            </div>
            <div>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Total Amount:</dt>
                  <dd className="text-sm text-gray-900">{formatCurrency(selectedSale.totals.net)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Items Count:</dt>
                  <dd className="text-sm text-gray-900">{returnItems.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Payment Mode:</dt>
                  <dd className="text-sm text-gray-900">
                    {selectedSale.payments && selectedSale.payments.length > 0 ? 'Paid' : 'Unknown'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Return Items Selection */}
          <div className="border-t pt-6">
            <h5 className="text-lg font-medium text-gray-800 mb-4">Select Items for Return</h5>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Select
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sold Qty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Available for Return
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Return Qty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Refund Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {returnItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            setReturnItems(returnItems.map(ri => 
                              ri.id === item.id 
                                ? { ...ri, selected: isChecked, qty_returned: isChecked ? ri.available_for_return : 0 }
                                : ri
                            ));
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.product_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Batch: {item.batch_no || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.nos}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.available_for_return}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          max={item.available_for_return}
                          value={item.qty_returned}
                          onChange={(e) => handleReturnQuantityChange(item.id, parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.mrp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency((item.net / item.nos) * item.qty_returned)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Return Summary */}
          {returnItems.some(item => item.selected) && (
            <div className="mt-6 pt-6 border-t">
              <div className="flex justify-between items-center">
                <div>
                  <h5 className="text-lg font-medium text-gray-800">Return Summary</h5>
                  <p className="text-sm text-gray-600">
                    {returnItems.filter(item => item.selected).length} items selected for return
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900">
                    Total Refund: {formatCurrency(
                      returnItems
                        .filter(item => item.selected)
                        .reduce((total, item) => total + ((item.net / item.nos) * item.qty_returned), 0)
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setSelectedSale(null);
                    setReturnItems([]);
                    setSearchBillNo('');
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessReturn}
                  disabled={createReturnMutation.isLoading}
                  className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:bg-gray-400"
                >
                  {createReturnMutation.isLoading ? 'Processing...' : '↩️ Process Return'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderReturnsList = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-800">Returns History</h3>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Return Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Original Sale
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items Returned
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Refund Amount
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
              {returns?.length > 0 ? (
                returns.map((returnItem) => (
                  <tr key={returnItem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          Return #{returnItem.id?.slice(-8)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(returnItem.date_time).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {returnItem.bill_no}
                      </div>
                      <div className="text-sm text-gray-500">
                        {returnItem.original_sale?.patient_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {returnItem.items?.length || 0} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(returnItem.totals?.net_refund || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        returnItem.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        returnItem.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {returnItem.status || 'APPROVED'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <div className="text-3xl mb-2">↩️</div>
                      <div>No returns found</div>
                      <div className="text-sm mt-1">Returns will appear here once processed</div>
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

  return (
    <div>
      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'new-return', label: 'Process Return', icon: '↩️' },
              { id: 'returns-list', label: 'Returns History', icon: '📋' },
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
      {activeTab === 'new-return' && renderNewReturn()}
      {activeTab === 'returns-list' && renderReturnsList()}
    </div>
  );
}