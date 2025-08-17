// src/components/pharmacy/DisposalManagement.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pharmacyAPI } from '../../api';
import { formatCurrency } from '../../utils/gst';
import { toast } from 'react-hot-toast';

export default function DisposalManagement() {
  const [activeTab, setActiveTab] = useState('expired-batches');
  const [showDisposeModal, setShowDisposeModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [disposalData, setDisposalData] = useState({
    qty: 0,
    reason: 'expiry',
    remark: ''
  });

  const queryClient = useQueryClient();

  // Fetch expired batches
  const { data: expiredBatches, isLoading: expiredLoading } = useQuery({
    queryKey: ['pharmacy', 'expired-batches'],
    queryFn: () => pharmacyAPI.getExpiredBatches(),
  });

  // Fetch disposals
  const { data: disposals, isLoading: disposalsLoading } = useQuery({
    queryKey: ['pharmacy', 'disposals'],
    queryFn: () => pharmacyAPI.getDisposals(),
  });

  // Fetch disposal summary
  const { data: disposalSummary } = useQuery({
    queryKey: ['pharmacy', 'disposal-summary'],
    queryFn: () => pharmacyAPI.getDisposalSummary(),
  });

  // Create disposal mutation
  const createDisposalMutation = useMutation({
    mutationFn: (disposalData) => pharmacyAPI.createDisposal(disposalData),
    onSuccess: () => {
      toast.success('Disposal recorded successfully');
      queryClient.invalidateQueries(['pharmacy', 'disposals']);
      queryClient.invalidateQueries(['pharmacy', 'expired-batches']);
      queryClient.invalidateQueries(['pharmacy', 'disposal-summary']);
      queryClient.invalidateQueries(['pharmacy', 'inventory']);
      setShowDisposeModal(false);
      setSelectedBatch(null);
      setDisposalData({ qty: 0, reason: 'expiry', remark: '' });
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to record disposal');
    },
  });

  const handleDispose = (batch) => {
    setSelectedBatch(batch);
    setDisposalData({
      qty: batch.current_stock,
      reason: batch.months_expired > 0 ? 'expiry' : 'damage',
      remark: batch.months_expired > 0 ? `Expired by ${batch.months_expired} months` : ''
    });
    setShowDisposeModal(true);
  };

  const handleSubmitDisposal = () => {
    if (!selectedBatch) return;

    if (disposalData.qty <= 0 || disposalData.qty > selectedBatch.current_stock) {
      toast.error('Invalid disposal quantity');
      return;
    }

    if (!disposalData.remark.trim()) {
      toast.error('Please provide disposal remarks');
      return;
    }

    const submitData = {
      batch_id: selectedBatch.batch_id,
      qty: disposalData.qty,
      reason: disposalData.reason,
      remark: disposalData.remark,
      itc_reversal_tax: 0 // Will be calculated by backend
    };

    createDisposalMutation.mutate(submitData);
  };

  const renderExpiredBatches = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-800">Expired Batches</h3>
        <div className="text-sm text-gray-600">
          {expiredBatches?.length || 0} batches requiring disposal
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="text-2xl mr-3">⚠️</div>
            <div>
              <div className="text-sm font-medium text-red-700">Expired Items</div>
              <div className="text-xl font-semibold text-red-900">
                {expiredBatches?.length || 0}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="text-2xl mr-3">💰</div>
            <div>
              <div className="text-sm font-medium text-orange-700">Cost Value</div>
              <div className="text-xl font-semibold text-orange-900">
                {formatCurrency(expiredBatches?.reduce((total, item) => total + (item.cost_value || 0), 0) || 0)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="text-2xl mr-3">🏷️</div>
            <div>
              <div className="text-sm font-medium text-blue-700">MRP Value</div>
              <div className="text-xl font-semibold text-blue-900">
                {formatCurrency(expiredBatches?.reduce((total, item) => total + (item.mrp_value || 0), 0) || 0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expired Batches Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b border-gray-200">
          <h4 className="text-lg font-medium text-gray-800">Batches Requiring Disposal</h4>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Batch & Expiry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock & Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expired Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expiredBatches?.length > 0 ? (
                expiredBatches.map((batch, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {batch.product_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {batch.chemical_name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          Batch: {batch.batch_no}
                        </div>
                        <div className="text-sm text-red-600">
                          Expired: {batch.expiry}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {batch.current_stock} units
                        </div>
                        <div className="text-sm text-gray-500">
                          Cost: {formatCurrency(batch.cost_value)}
                        </div>
                        <div className="text-sm text-gray-500">
                          MRP: {formatCurrency(batch.mrp_value)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                        {batch.months_expired} months ago
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDispose(batch)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                      >
                        🗑️ Dispose
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <div className="text-3xl mb-2">✅</div>
                      <div>No expired batches found</div>
                      <div className="text-sm mt-1">All batches are within valid dates</div>
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

  const renderDisposalHistory = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-800">Disposal History</h3>
      </div>

      {/* Disposal Summary */}
      {disposalSummary && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h4 className="text-lg font-medium text-gray-800 mb-4">Disposal Summary</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-900">
                {disposalSummary.totals?.total_disposals || 0}
              </div>
              <div className="text-sm text-gray-500">Total Disposals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-900">
                {disposalSummary.totals?.total_qty || 0}
              </div>
              <div className="text-sm text-gray-500">Units Disposed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-red-600">
                {formatCurrency(disposalSummary.totals?.total_cost_value || 0)}
              </div>
              <div className="text-sm text-gray-500">Cost Value Lost</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-orange-600">
                {formatCurrency(disposalSummary.totals?.total_itc_reversal || 0)}
              </div>
              <div className="text-sm text-gray-500">ITC Reversal</div>
            </div>
          </div>

          {/* By Reason Breakdown */}
          {disposalSummary.by_reason && disposalSummary.by_reason.length > 0 && (
            <div>
              <h5 className="text-md font-medium text-gray-700 mb-3">Breakdown by Reason</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {disposalSummary.by_reason.map((item, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded">
                    <div className="text-sm font-medium text-gray-700 capitalize">
                      {item.reason}
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {item.qty} units
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatCurrency(item.cost_value)} value
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Disposal Records Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b border-gray-200">
          <h4 className="text-lg font-medium text-gray-800">Disposal Records</h4>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity & Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Approved By
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {disposals?.length > 0 ? (
                disposals.map((disposal) => (
                  <tr key={disposal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(disposal.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          #{disposal.id?.slice(-8)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {disposal.product_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          Batch: {disposal.batch_no}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {disposal.qty} units
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(disposal.total_cost_value)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          disposal.reason === 'expiry' ? 'bg-red-100 text-red-800' :
                          disposal.reason === 'damage' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {disposal.reason}
                        </span>
                        <div className="text-sm text-gray-500 mt-1">
                          {disposal.remark}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {disposal.approved_by}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <div className="text-3xl mb-2">📝</div>
                      <div>No disposal records found</div>
                      <div className="text-sm mt-1">Disposal records will appear here</div>
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
              { id: 'expired-batches', label: 'Expired Batches', icon: '⚠️' },
              { id: 'disposal-history', label: 'Disposal History', icon: '📋' },
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
      {activeTab === 'expired-batches' && renderExpiredBatches()}
      {activeTab === 'disposal-history' && renderDisposalHistory()}

      {/* Disposal Modal */}
      {showDisposeModal && selectedBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-800">Record Disposal</h3>
              <button
                onClick={() => setShowDisposeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-700">Product</div>
                <div className="text-gray-900">{selectedBatch.product_name}</div>
                <div className="text-sm text-gray-500">Batch: {selectedBatch.batch_no}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Disposal Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedBatch.current_stock}
                  value={disposalData.qty}
                  onChange={(e) => setDisposalData({ ...disposalData, qty: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="text-sm text-gray-500 mt-1">
                  Available: {selectedBatch.current_stock} units
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Disposal Reason *
                </label>
                <select
                  value={disposalData.reason}
                  onChange={(e) => setDisposalData({ ...disposalData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="expiry">Expiry</option>
                  <option value="damage">Damage</option>
                  <option value="recall">Recall</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarks *
                </label>
                <textarea
                  value={disposalData.remark}
                  onChange={(e) => setDisposalData({ ...disposalData, remark: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Enter disposal remarks..."
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <div className="text-sm font-medium text-yellow-800">Disposal Impact</div>
                <div className="text-sm text-yellow-700 mt-1">
                  Cost Value: {formatCurrency((selectedBatch.cost_per_unit * disposalData.qty) || 0)}
                </div>
                <div className="text-sm text-yellow-700">
                  MRP Value: {formatCurrency((selectedBatch.mrp * disposalData.qty) || 0)}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowDisposeModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitDisposal}
                disabled={createDisposalMutation.isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:bg-gray-400"
              >
                {createDisposalMutation.isLoading ? 'Recording...' : '🗑️ Record Disposal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}