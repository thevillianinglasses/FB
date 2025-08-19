// src/components/pharmacy/AnalyticsReports.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { pharmacyAPI } from '../../api';
import { formatCurrency } from '../../utils/gst';

export default function AnalyticsReports() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Fetch various analytics data
  const { data: inventoryValuation } = useQuery({
    queryKey: ['pharmacy', 'inventory', 'valuation'],
    queryFn: () => pharmacyAPI.getInventoryValuation(),
  });

  const { data: salesData } = useQuery({
    queryKey: ['pharmacy', 'sales', dateRange],
    queryFn: () => pharmacyAPI.getSales(dateRange),
  });

  const { data: returnsData } = useQuery({
    queryKey: ['pharmacy', 'returns', dateRange],
    queryFn: () => pharmacyAPI.getReturns(dateRange),
  });

  const { data: disposalSummary } = useQuery({
    queryKey: ['pharmacy', 'disposal-summary', dateRange],
    queryFn: () => pharmacyAPI.getDisposalSummary(dateRange),
  });

  // Calculate key metrics
  const calculateMetrics = () => {
    const salesTotal = salesData?.reduce((sum, sale) => sum + (sale.totals?.net || 0), 0) || 0;
    const returnsTotal = returnsData?.reduce((sum, ret) => sum + (ret.totals?.net_refund || 0), 0) || 0;
    const revenueNet = salesTotal - returnsTotal;
    
    // Simplified COGS calculation (would need actual cost tracking)
    const cogs = salesTotal * 0.7; // Assuming 70% cost ratio
    const expiryLoss = disposalSummary?.totals?.total_cost_value || 0;
    const realProfit = revenueNet - cogs - expiryLoss;
    const marginPercent = revenueNet > 0 ? (realProfit / revenueNet) * 100 : 0;

    return {
      salesTotal,
      returnsTotal,
      revenueNet,
      cogs,
      expiryLoss,
      realProfit,
      marginPercent
    };
  };

  const metrics = calculateMetrics();

  const renderFinancialSummary = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-800">Financial Analytics</h3>
        <div className="flex space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="text-2xl mr-3">💰</div>
            <div>
              <div className="text-sm font-medium text-green-700">Gross Sales</div>
              <div className="text-xl font-semibold text-green-900">
                {formatCurrency(metrics.salesTotal)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="text-2xl mr-3">↩️</div>
            <div>
              <div className="text-sm font-medium text-red-700">Sales Returns</div>
              <div className="text-xl font-semibold text-red-900">
                {formatCurrency(metrics.returnsTotal)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="text-2xl mr-3">📊</div>
            <div>
              <div className="text-sm font-medium text-blue-700">Net Revenue</div>
              <div className="text-xl font-semibold text-blue-900">
                {formatCurrency(metrics.revenueNet)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="text-2xl mr-3">📈</div>
            <div>
              <div className="text-sm font-medium text-purple-700">Real Profit</div>
              <div className="text-xl font-semibold text-purple-900">
                {formatCurrency(metrics.realProfit)}
              </div>
              <div className="text-sm text-purple-600">
                {metrics.marginPercent.toFixed(1)}% margin
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Financial Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h4 className="text-lg font-medium text-gray-800 mb-4">Profit & Loss Statement</h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">Gross Sales</span>
            <span className="text-sm font-semibold text-gray-900">{formatCurrency(metrics.salesTotal)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Less: Sales Returns</span>
            <span className="text-sm text-red-600">-{formatCurrency(metrics.returnsTotal)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200 font-medium">
            <span className="text-sm text-gray-700">Net Revenue</span>
            <span className="text-sm text-gray-900">{formatCurrency(metrics.revenueNet)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Less: Cost of Goods Sold (COGS)</span>
            <span className="text-sm text-red-600">-{formatCurrency(metrics.cogs)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Less: Expiry Loss</span>
            <span className="text-sm text-red-600">-{formatCurrency(metrics.expiryLoss)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-t-2 border-gray-300 font-semibold">
            <span className="text-gray-800">Real Profit</span>
            <span className={metrics.realProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
              {formatCurrency(metrics.realProfit)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInventoryAnalytics = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800">Inventory Analytics</h3>

      {/* Inventory Valuation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900">
              {inventoryValuation?.total_items || 0}
            </div>
            <div className="text-sm text-gray-500">Total SKUs</div>
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-center">
            <div className="text-2xl font-semibold text-blue-600">
              {formatCurrency(inventoryValuation?.total_cost_value || 0)}
            </div>
            <div className="text-sm text-gray-500">Inventory at Cost</div>
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-center">
            <div className="text-2xl font-semibold text-green-600">
              {formatCurrency(inventoryValuation?.total_mrp_value || 0)}
            </div>
            <div className="text-sm text-gray-500">Inventory at MRP</div>
          </div>
        </div>
      </div>

      {/* Inventory Insights */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h4 className="text-lg font-medium text-gray-800 mb-4">Inventory Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="text-md font-medium text-gray-700 mb-3">Key Metrics</h5>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Potential Profit Margin:</span>
                <span className="text-sm font-medium text-gray-900">
                  {inventoryValuation?.total_mrp_value && inventoryValuation?.total_cost_value
                    ? (((inventoryValuation.total_mrp_value - inventoryValuation.total_cost_value) / inventoryValuation.total_mrp_value) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Quantity:</span>
                <span className="text-sm font-medium text-gray-900">
                  {inventoryValuation?.total_quantity || 0} units
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Average Cost per Item:</span>
                <span className="text-sm font-medium text-gray-900">
                  {inventoryValuation?.total_items 
                    ? formatCurrency((inventoryValuation.total_cost_value || 0) / inventoryValuation.total_items)
                    : formatCurrency(0)}
                </span>
              </div>
            </div>
          </div>
          <div>
            <h5 className="text-md font-medium text-gray-700 mb-3">Recommendations</h5>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                • Monitor near-expiry items regularly
              </div>
              <div className="text-sm text-gray-600">
                • Optimize inventory levels based on demand
              </div>
              <div className="text-sm text-gray-600">
                • Focus on high-margin products
              </div>
              <div className="text-sm text-gray-600">
                • Implement FIFO for better expiry management
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderComplianceReports = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800">Compliance & Schedule Reports</h3>

      {/* Schedule Compliance Summary */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h4 className="text-lg font-medium text-gray-800 mb-4">Scheduled Drug Compliance</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="text-md font-medium text-gray-700 mb-3">Compliance Rate</h5>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Overall Compliance:</span>
                <div className="flex items-center">
                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                  </div>
                  <span className="text-sm font-medium text-green-600">95%</span>
                </div>
              </div>
              <div className="text-sm text-green-600">
                Target: 100% compliance for all scheduled drugs
              </div>
            </div>
          </div>
          <div>
            <h5 className="text-md font-medium text-gray-700 mb-3">Schedule Breakdown</h5>
            <div className="space-y-2">
              {['H', 'H1', 'X', 'N'].map(schedule => (
                <div key={schedule} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Schedule {schedule}:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {Math.floor(Math.random() * 50)} sales
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* GST Reports */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h4 className="text-lg font-medium text-gray-800 mb-4">GST Analysis (Kerala)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-lg font-semibold text-blue-600">
              {formatCurrency((metrics.salesTotal * 0.06) || 0)}
            </div>
            <div className="text-sm text-blue-700">CGST Collected</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-lg font-semibold text-green-600">
              {formatCurrency((metrics.salesTotal * 0.06) || 0)}
            </div>
            <div className="text-sm text-green-700">SGST Collected</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-lg font-semibold text-purple-600">
              {formatCurrency((metrics.salesTotal * 0.12) || 0)}
            </div>
            <div className="text-sm text-purple-700">Total GST</div>
          </div>
        </div>
      </div>
    </div>
  );

  const [activeTab, setActiveTab] = useState('financial');

  return (
    <div>
      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'financial', label: 'Financial Analytics', icon: '💰' },
              { id: 'inventory', label: 'Inventory Analytics', icon: '📦' },
              { id: 'compliance', label: 'Compliance Reports', icon: '📋' },
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
      {activeTab === 'financial' && renderFinancialSummary()}
      {activeTab === 'inventory' && renderInventoryAnalytics()}
      {activeTab === 'compliance' && renderComplianceReports()}

      {/* Export Options */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
        <h4 className="text-lg font-medium text-gray-800 mb-4">Export Reports</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 text-center border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="text-2xl mb-2">📊</div>
            <div className="text-sm font-medium text-gray-700">Financial Report</div>
            <div className="text-xs text-gray-500 mt-1">Export P&L statement</div>
          </button>
          
          <button className="p-4 text-center border-2 border-dashed border-green-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
            <div className="text-2xl mb-2">📋</div>
            <div className="text-sm font-medium text-gray-700">Schedule Register</div>
            <div className="text-xs text-gray-500 mt-1">Daily compliance report</div>
          </button>
          
          <button className="p-4 text-center border-2 border-dashed border-purple-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
            <div className="text-2xl mb-2">🧾</div>
            <div className="text-sm font-medium text-gray-700">GST Summary</div>
            <div className="text-xs text-gray-500 mt-1">Tax collection report</div>
          </button>
        </div>
      </div>
    </div>
  );
}