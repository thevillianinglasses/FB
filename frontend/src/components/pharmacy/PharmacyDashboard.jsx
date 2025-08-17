// src/components/pharmacy/PharmacyDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { pharmacyAPI } from '../../api';
import { formatCurrency } from '../../utils/gst';
import PurchaseManagement from './PurchaseManagement';
import SalesBilling from './SalesBilling';
import ProductsInventory from './ProductsInventory';
import ReturnsRefunds from './ReturnsRefunds';
import NearExpiryManagement from './NearExpiryManagement';
import DisposalManagement from './DisposalManagement';
import AnalyticsReports from './AnalyticsReports';

export default function PharmacyDashboard({ onLogout, userName }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Fetch dashboard data
  const { data: inventory } = useQuery({
    queryKey: ['pharmacy', 'inventory', 'valuation'],
    queryFn: () => pharmacyAPI.getInventoryValuation(),
    refetchInterval: 30000 // Refresh every 30 seconds
  });
  
  const { data: nearExpiry } = useQuery({
    queryKey: ['pharmacy', 'inventory', 'near-expiry'],
    queryFn: () => pharmacyAPI.getNearExpiryItems(),
  });
  
  const { data: recentSales } = useQuery({
    queryKey: ['pharmacy', 'sales', 'recent'],
    queryFn: () => pharmacyAPI.getRecentSales(),
  });

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'products', label: 'Products & Inventory', icon: '💊' },
    { id: 'purchases', label: 'Purchase Management', icon: '📋' },
    { id: 'sales', label: 'Sales & Billing', icon: '💰' },
    { id: 'returns', label: 'Returns & Refunds', icon: '↩️' },
    { id: 'near-expiry', label: 'Near Expiry', icon: '⚠️' },
    { id: 'disposals', label: 'Disposals', icon: '🗑️' },
    { id: 'analytics', label: 'Analytics & Reports', icon: '📈' },
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Pharmacy Dashboard</h2>
        
        {/* Navigation Links */}
        <div className="flex items-center space-x-4">
          <a 
            href="/admin" 
            className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
          >
            👨‍💼 Admin
          </a>
          <a 
            href="/reception" 
            className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
          >
            🏥 Reception
          </a>
          <a 
            href="/laboratory" 
            className="px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
          >
            🔬 Laboratory
          </a>
          <a 
            href="/nursing" 
            className="px-3 py-2 text-sm bg-pink-100 text-pink-700 rounded-md hover:bg-pink-200 transition-colors"
          >
            👩‍⚕️ Nursing
          </a>
          <a 
            href="/doctor" 
            className="px-3 py-2 text-sm bg-teal-100 text-teal-700 rounded-md hover:bg-teal-200 transition-colors"
          >
            👨‍⚕️ Doctor
          </a>
          <button
            onClick={onLogout}
            className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
          >
            🚪 Logout
          </button>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">💊</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Inventory Value</p>
              <p className="text-2xl font-semibold text-gray-900">
                {inventory ? formatCurrency(inventory.total_cost_value) : '₹0.00'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">💰</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">MRP Value</p>
              <p className="text-2xl font-semibold text-gray-900">
                {inventory ? formatCurrency(inventory.total_mrp_value) : '₹0.00'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">⚠️</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Near Expiry Items</p>
              <p className="text-2xl font-semibold text-gray-900">
                {nearExpiry ? nearExpiry.length : 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">📦</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Items</p>
              <p className="text-2xl font-semibold text-gray-900">
                {inventory ? inventory.total_items : 0}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => setActiveTab('sales')}
            className="p-4 text-center border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="text-2xl mb-2">💊</div>
            <div className="text-sm font-medium text-gray-700">New Sale</div>
          </button>
          
          <button 
            onClick={() => setActiveTab('purchases')}
            className="p-4 text-center border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <div className="text-2xl mb-2">📋</div>
            <div className="text-sm font-medium text-gray-700">New Purchase</div>
          </button>
          
          <button 
            onClick={() => setActiveTab('products')}
            className="p-4 text-center border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
          >
            <div className="text-2xl mb-2">➕</div>
            <div className="text-sm font-medium text-gray-700">Add Product</div>
          </button>
          
          <button 
            onClick={() => setActiveTab('near-expiry')}
            className="p-4 text-center border-2 border-dashed border-gray-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors"
          >
            <div className="text-2xl mb-2">⚠️</div>
            <div className="text-sm font-medium text-gray-700">Check Expiry</div>
          </button>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Today's Sales</h3>
            <button 
              onClick={() => setActiveTab('sales')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View All →
            </button>
          </div>
          {recentSales && recentSales.length > 0 ? (
            <div className="space-y-3">
              {recentSales.slice(0, 5).map((sale, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">{sale.bill_no}</p>
                    <p className="text-sm text-gray-500">{sale.patient.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(sale.totals.net)}</p>
                    <p className="text-sm text-gray-500">{new Date(sale.date_time).toLocaleDateString()}</p>
                    <button className="text-xs text-blue-600 hover:text-blue-800">Edit</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent sales</p>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Near Expiry Alert</h3>
          {nearExpiry && nearExpiry.length > 0 ? (
            <div className="space-y-3">
              {nearExpiry.slice(0, 5).map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">{item.product_name}</p>
                    <p className="text-sm text-gray-500">Batch: {item.batch_no}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${item.expiry_color === 'red' ? 'text-red-600' : item.expiry_color === 'orange' ? 'text-orange-600' : 'text-yellow-600'}`}>
                      {item.expiry}
                    </p>
                    <p className="text-sm text-gray-500">{item.current_stock} units</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No items near expiry</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'products':
        return <ProductsInventory />;
      case 'purchases':
        return <PurchaseManagement />;
      case 'sales':
        return <SalesBilling />;
      case 'returns':
        return <ReturnsRefunds />;
      case 'near-expiry':
        return <NearExpiryManagement />;
      case 'disposals':
        return <DisposalManagement />;
      case 'analytics':
        return <AnalyticsReports />;
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-800">Pharmacy Management</h1>
          <p className="text-sm text-gray-600 mt-1">Welcome, {userName}</p>
        </div>
        
        <nav className="mt-6">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-6 py-3 text-left transition-colors ${
                activeTab === item.id
                  ? 'bg-blue-50 border-r-2 border-blue-500 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        
        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={onLogout}
            className="w-full flex items-center px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <span className="mr-3">🚪</span>
            Logout
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}