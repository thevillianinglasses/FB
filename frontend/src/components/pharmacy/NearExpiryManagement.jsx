// src/components/pharmacy/NearExpiryManagement.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { pharmacyAPI } from '../../api';
import { formatCurrency } from '../../utils/gst';
import ScheduleChip from './ScheduleChip';

export default function NearExpiryManagement() {
  const [filters, setFilters] = useState({
    months: 6,
    rack: '',
    schedule: ''
  });

  // Fetch near-expiry items
  const { data: nearExpiryItems, isLoading } = useQuery({
    queryKey: ['pharmacy', 'near-expiry', filters],
    queryFn: () => pharmacyAPI.getNearExpiryItems(filters),
    refetchInterval: 60000 // Refresh every minute
  });

  // Fetch racks for filtering
  const { data: racks } = useQuery({
    queryKey: ['pharmacy', 'racks'],
    queryFn: () => pharmacyAPI.getRacks(),
  });

  const getExpiryColorClass = (color) => {
    switch (color) {
      case 'red':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'orange':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getExpiryIcon = (color) => {
    switch (color) {
      case 'red':
        return '🚨';
      case 'orange':
        return '⚠️';
      case 'yellow':
        return '🟡';
      default:
        return '✅';
    }
  };

  const getTotalValue = (items) => {
    return items?.reduce((total, item) => total + (item.cost_value || 0), 0) || 0;
  };

  const getMRPValue = (items) => {
    return items?.reduce((total, item) => total + (item.mrp_value || 0), 0) || 0;
  };

  const exportToCSV = () => {
    if (!nearExpiryItems || nearExpiryItems.length === 0) {
      return;
    }

    const headers = [
      'Product Name',
      'Chemical Name',
      'Batch No',
      'Expiry Date',
      'Days to Expiry',
      'Current Stock',
      'MRP per Unit',
      'Cost per Unit',
      'Total Cost Value',
      'Total MRP Value',
      'Schedule',
      'Rack Location',
      'Company'
    ];

    const csvContent = [
      headers.join(','),
      ...nearExpiryItems.map(item => [
        `"${item.product_name}"`,
        `"${item.chemical_name}"`,
        `"${item.batch_no}"`,
        item.expiry,
        item.days_to_expiry,
        item.current_stock,
        item.mrp,
        item.cost_per_unit,
        item.cost_value,
        item.mrp_value,
        item.schedule_symbol,
        `"${item.rack_id || 'Unassigned'}"`,
        `"${item.company_name || 'N/A'}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `near-expiry-report-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading near-expiry items...</div>;
  }

  // Group items by expiry color
  const groupedItems = nearExpiryItems?.reduce((groups, item) => {
    const color = item.expiry_color || 'ok';
    if (!groups[color]) groups[color] = [];
    groups[color].push(item);
    return groups;
  }, {}) || {};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-800">Near Expiry Management</h3>
        <button
          onClick={exportToCSV}
          disabled={!nearExpiryItems || nearExpiryItems.length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          📊 Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="text-2xl mr-3">🚨</div>
            <div>
              <div className="text-sm font-medium text-red-700">Critical (≤3 months)</div>
              <div className="text-xl font-semibold text-red-900">
                {groupedItems.red?.length || 0} items
              </div>
              <div className="text-sm text-red-600">
                {formatCurrency(getTotalValue(groupedItems.red))} value
              </div>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="text-2xl mr-3">⚠️</div>
            <div>
              <div className="text-sm font-medium text-orange-700">Warning (3-6 months)</div>
              <div className="text-xl font-semibold text-orange-900">
                {groupedItems.orange?.length || 0} items
              </div>
              <div className="text-sm text-orange-600">
                {formatCurrency(getTotalValue(groupedItems.orange))} value
              </div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="text-2xl mr-3">🟡</div>
            <div>
              <div className="text-sm font-medium text-yellow-700">Caution (6-12 months)</div>
              <div className="text-xl font-semibold text-yellow-900">
                {groupedItems.yellow?.length || 0} items
              </div>
              <div className="text-sm text-yellow-600">
                {formatCurrency(getTotalValue(groupedItems.yellow))} value
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="text-2xl mr-3">💰</div>
            <div>
              <div className="text-sm font-medium text-blue-700">Total at Risk</div>
              <div className="text-xl font-semibold text-blue-900">
                {nearExpiryItems?.length || 0} items
              </div>
              <div className="text-sm text-blue-600">
                {formatCurrency(getTotalValue(nearExpiryItems))} cost value
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Range
            </label>
            <select
              value={filters.months}
              onChange={(e) => setFilters({ ...filters, months: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={3}>Next 3 months</option>
              <option value={6}>Next 6 months</option>
              <option value={12}>Next 12 months</option>
              <option value={24}>Next 24 months</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rack Filter
            </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Schedule Filter
            </label>
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
              onClick={() => setFilters({ months: 6, rack: '', schedule: '' })}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Near Expiry Items Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-medium text-gray-800">
              Near Expiry Items ({nearExpiryItems?.length || 0})
            </h4>
            <div className="text-sm text-gray-600">
              Total Value at Risk: {formatCurrency(getTotalValue(nearExpiryItems))} (Cost) | {formatCurrency(getMRPValue(nearExpiryItems))} (MRP)
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry Status
                </th>
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
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {nearExpiryItems?.length > 0 ? (
                nearExpiryItems.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-xl mr-2">{getExpiryIcon(item.expiry_color)}</span>
                        <div>
                          <div className={`px-2 py-1 text-xs font-medium rounded-full border ${getExpiryColorClass(item.expiry_color)}`}>
                            {item.days_to_expiry > 0 ? `${item.days_to_expiry} days` : 'Expired'}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {item.expiry_color === 'red' ? '≤3 months' :
                             item.expiry_color === 'orange' ? '3-6 months' :
                             item.expiry_color === 'yellow' ? '6-12 months' : '>12 months'}
                          </div>
                        </div>
                      </div>
                    </td>
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          Batch: {item.batch_no}
                        </div>
                        <div className="text-sm text-gray-500">
                          Expires: {item.expiry}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.current_stock} units
                        </div>
                        <div className="text-sm text-gray-500">
                          Cost: {formatCurrency(item.cost_value)}
                        </div>
                        <div className="text-sm text-gray-500">
                          MRP: {formatCurrency(item.mrp_value)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.rack_id || 'Unassigned'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          Move
                        </button>
                        <button className="text-orange-600 hover:text-orange-900">
                          Discount
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          Dispose
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <div className="text-3xl mb-2">✅</div>
                      <div>No items nearing expiry found</div>
                      <div className="text-sm mt-1">All items are within safe expiry ranges</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h4 className="text-lg font-medium text-gray-800 mb-4">Quick Actions</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 text-center border-2 border-dashed border-red-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors">
            <div className="text-2xl mb-2">🚨</div>
            <div className="text-sm font-medium text-gray-700">Bulk Dispose Critical Items</div>
            <div className="text-xs text-gray-500 mt-1">Items expiring in ≤3 months</div>
          </button>
          
          <button className="p-4 text-center border-2 border-dashed border-orange-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors">
            <div className="text-2xl mb-2">🏷️</div>
            <div className="text-sm font-medium text-gray-700">Apply Discount Pricing</div>
            <div className="text-xs text-gray-500 mt-1">Quick sale for near-expiry items</div>
          </button>
          
          <button className="p-4 text-center border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="text-2xl mb-2">📧</div>
            <div className="text-sm font-medium text-gray-700">Generate Report</div>
            <div className="text-xs text-gray-500 mt-1">Email summary to management</div>
          </button>
        </div>
      </div>
    </div>
  );
}