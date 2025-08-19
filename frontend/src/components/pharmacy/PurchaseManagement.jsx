// src/components/pharmacy/PurchaseManagement.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pharmacyAPI } from '../../api';
import { formatCurrency, generateBillNumber } from '../../utils/gst';
import { toast } from 'react-hot-toast';
import ScheduleChip from './ScheduleChip';

export default function PurchaseManagement() {
  const [activeView, setActiveView] = useState('list'); // 'list', 'create', 'approve'
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const queryClient = useQueryClient();

  // Fetch purchases
  const { data: purchases, isLoading } = useQuery({
    queryKey: ['pharmacy', 'purchases'],
    queryFn: () => pharmacyAPI.getPurchases(),
  });

  // Fetch suppliers for new purchase
  const { data: suppliers } = useQuery({
    queryKey: ['pharmacy', 'suppliers'],
    queryFn: () => pharmacyAPI.getSuppliers(),
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

  // Approve purchase mutation
  const approveMutation = useMutation({
    mutationFn: (purchaseId) => pharmacyAPI.approvePurchase(purchaseId),
    onSuccess: () => {
      toast.success('Purchase approved successfully');
      queryClient.invalidateQueries(['pharmacy', 'purchases']);
      queryClient.invalidateQueries(['pharmacy', 'inventory']);
      setActiveView('list');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to approve purchase');
    },
  });

  // Reject purchase mutation
  const rejectMutation = useMutation({
    mutationFn: ({ purchaseId, reason }) => pharmacyAPI.rejectPurchase(purchaseId, reason),
    onSuccess: () => {
      toast.success('Purchase rejected');
      queryClient.invalidateQueries(['pharmacy', 'purchases']);
      setActiveView('list');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to reject purchase');
    },
  });

  const renderPurchaseList = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-800">Purchase Management</h3>
        <button
          onClick={() => setActiveView('create')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          + New Purchase
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b border-gray-200">
          <div className="flex space-x-4">
            <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded">All</button>
            <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">Pending</button>
            <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">Approved</button>
            <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">Rejected</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
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
              {purchases?.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {purchase.invoice_no}
                      </div>
                      <div className="text-sm text-gray-500">
                        {purchase.invoice_date}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{purchase.supplier_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      purchase.type === 'CASH' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {purchase.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(purchase.totals?.net_payable || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      purchase.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      purchase.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {purchase.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedPurchase(purchase);
                          setActiveView('approve');
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      {purchase.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => approveMutation.mutate(purchase.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Reason for rejection:');
                              if (reason) {
                                rejectMutation.mutate({ purchaseId: purchase.id, reason });
                              }
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </>
                      )}
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

  const renderCreatePurchase = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-800">Create New Purchase</h3>
        <button
          onClick={() => setActiveView('list')}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          ← Back to List
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invoice Number *
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="INV/2024/001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invoice Date *
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supplier *
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select Supplier</option>
              {suppliers?.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name} ({supplier.state})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-lg font-medium text-gray-800 mb-4">Purchase Items</h4>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Batch No</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Billed Qty</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Free Qty</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">MRP</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Trade Price</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">GST %</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Schedule</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td colSpan="10" className="px-3 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <div className="text-3xl mb-2">📦</div>
                      <div>No items added yet</div>
                      <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm">
                        + Add Item
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
            Save Draft
          </button>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Submit for Approval
          </button>
        </div>
      </div>
    </div>
  );

  const renderApprovalView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-800">Purchase Approval</h3>
        <button
          onClick={() => setActiveView('list')}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          ← Back to List
        </button>
      </div>

      {selectedPurchase && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="text-lg font-medium text-gray-800 mb-4">Purchase Details</h4>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Invoice No:</dt>
                  <dd className="text-sm text-gray-900">{selectedPurchase.invoice_no}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Date:</dt>
                  <dd className="text-sm text-gray-900">{selectedPurchase.invoice_date}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Supplier:</dt>
                  <dd className="text-sm text-gray-900">{selectedPurchase.supplier_name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Type:</dt>
                  <dd className="text-sm text-gray-900">{selectedPurchase.type}</dd>
                </div>
              </dl>
            </div>
            
            <div>
              <h4 className="text-lg font-medium text-gray-800 mb-4">Financial Summary</h4>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Taxable:</dt>
                  <dd className="text-sm text-gray-900">{formatCurrency(selectedPurchase.totals?.taxable || 0)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">CGST:</dt>
                  <dd className="text-sm text-gray-900">{formatCurrency(selectedPurchase.totals?.cgst || 0)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">SGST:</dt>
                  <dd className="text-sm text-gray-900">{formatCurrency(selectedPurchase.totals?.sgst || 0)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">IGST:</dt>
                  <dd className="text-sm text-gray-900">{formatCurrency(selectedPurchase.totals?.igst || 0)}</dd>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <dt className="text-sm font-semibold text-gray-900">Net Payable:</dt>
                  <dd className="text-sm font-semibold text-gray-900">{formatCurrency(selectedPurchase.totals?.net_payable || 0)}</dd>
                </div>
              </dl>
            </div>
          </div>

          {selectedPurchase.status === 'PENDING' && (
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                onClick={() => {
                  const reason = prompt('Reason for rejection:');
                  if (reason) {
                    rejectMutation.mutate({ purchaseId: selectedPurchase.id, reason });
                  }
                }}
                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Reject Purchase
              </button>
              <button
                onClick={() => approveMutation.mutate(selectedPurchase.id)}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Approve Purchase
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div>
      {activeView === 'list' && renderPurchaseList()}
      {activeView === 'create' && renderCreatePurchase()}
      {activeView === 'approve' && renderApprovalView()}
    </div>
  );
}