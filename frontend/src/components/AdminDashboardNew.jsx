import React, { useState, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

// New API functions for comprehensive system
const adminAPI = {
  // Departments
  getDepartments: async (activeOnly = false) => {
    const backendUrl = import.meta.env.REACT_APP_BACKEND_URL;
    const response = await fetch(`${backendUrl}/api/admin/departments/?active_only=${activeOnly}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch departments');
    return response.json();
  },

  createDepartment: async (departmentData) => {
    const backendUrl = import.meta.env.REACT_APP_BACKEND_URL;
    const response = await fetch(`${backendUrl}/api/admin/departments/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(departmentData),
    });
    if (!response.ok) throw new Error('Failed to create department');
    return response.json();
  },

  updateDepartment: async (departmentId, departmentData) => {
    const backendUrl = import.meta.env.REACT_APP_BACKEND_URL;
    const response = await fetch(`${backendUrl}/api/admin/departments/${departmentId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(departmentData),
    });
    if (!response.ok) throw new Error('Failed to update department');
    return response.json();
  },

  deleteDepartment: async (departmentId, force = false) => {
    const backendUrl = import.meta.env.REACT_APP_BACKEND_URL;
    const response = await fetch(`${backendUrl}/api/admin/departments/${departmentId}?force=${force}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to delete department');
    return response.json();
  },

  // Users
  getUsers: async (filters = {}) => {
    const backendUrl = import.meta.env.REACT_APP_BACKEND_URL;
    const params = new URLSearchParams(filters);
    const response = await fetch(`${backendUrl}/api/admin/users/?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  createUser: async (userData) => {
    const backendUrl = import.meta.env.REACT_APP_BACKEND_URL;
    const response = await fetch(`${backendUrl}/api/admin/users/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    if (!response.ok) throw new Error('Failed to create user');
    return response.json();
  },

  updateUser: async (userId, userData) => {
    const backendUrl = import.meta.env.REACT_APP_BACKEND_URL;
    const response = await fetch(`${backendUrl}/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
  },

  getDoctors: async (departmentId = null) => {
    const backendUrl = import.meta.env.REACT_APP_BACKEND_URL;
    const params = departmentId ? `?department_id=${departmentId}` : '';
    const response = await fetch(`${backendUrl}/api/admin/users/doctors/${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch doctors');
    return response.json();
  },

  getNurses: async (departmentId = null) => {
    const backendUrl = import.meta.env.REACT_APP_BACKEND_URL;
    const params = departmentId ? `?department_id=${departmentId}` : '';
    const response = await fetch(`${backendUrl}/api/admin/users/nurses/${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch nurses');
    return response.json();
  }
};

function AdminDashboardNew({ onLogout, userName }) {
  const [activeTab, setActiveTab] = useState('departments');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [userFilters, setUserFilters] = useState({});
  
  const queryClient = useQueryClient();

  // Department queries
  const { data: departments = [], isLoading: departmentsLoading } = useQuery({
    queryKey: ['admin', 'departments'],
    queryFn: () => adminAPI.getDepartments(),
  });

  // User queries
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users', userFilters],
    queryFn: () => adminAPI.getUsers(userFilters),
    enabled: activeTab === 'staff'
  });

  // Doctor queries
  const { data: doctors = [], isLoading: doctorsLoading } = useQuery({
    queryKey: ['admin', 'doctors'],
    queryFn: () => adminAPI.getDoctors(),
    enabled: activeTab === 'doctors'
  });

  // Mutations
  const createDepartmentMutation = useMutation({
    mutationFn: adminAPI.createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'departments']);
      setShowCreateModal(false);
      toast.success('Department created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create department: ${error.message}`);
    }
  });

  const updateDepartmentMutation = useMutation({
    mutationFn: ({ id, data }) => adminAPI.updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'departments']);
      setEditingItem(null);
      toast.success('Department updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update department: ${error.message}`);
    }
  });

  const createUserMutation = useMutation({
    mutationFn: adminAPI.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'users']);
      queryClient.invalidateQueries(['admin', 'doctors']);
      setShowCreateModal(false);
      toast.success('User created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create user: ${error.message}`);
    }
  });

  // Department Management Component
  const DepartmentManagement = () => {
    const [newDepartment, setNewDepartment] = useState({ name: '', active: true });

    const handleCreateDepartment = (e) => {
      e.preventDefault();
      if (!newDepartment.name.trim()) {
        toast.error('Department name is required');
        return;
      }
      createDepartmentMutation.mutate(newDepartment);
    };

    const handleUpdateDepartment = (dept) => {
      updateDepartmentMutation.mutate({
        id: dept.id,
        data: { active: !dept.active }
      });
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Department Management</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
          >
            <span className="mr-2">+</span>
            Add Department
          </button>
        </div>

        {departmentsLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {departments.map((dept) => (
                <li key={dept.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{dept.name}</h3>
                        <p className="text-sm text-gray-500">Slug: {dept.slug}</p>
                      </div>
                      <div className="ml-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          dept.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {dept.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUpdateDepartment(dept)}
                        className={`px-3 py-1 text-sm rounded ${
                          dept.active
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {dept.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Create Department Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium">Create New Department</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleCreateDepartment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department Name
                  </label>
                  <input
                    type="text"
                    value={newDepartment.name}
                    onChange={(e) => setNewDepartment({...newDepartment, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Cardiology"
                    required
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="active"
                    checked={newDepartment.active}
                    onChange={(e) => setNewDepartment({...newDepartment, active: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="active" className="text-sm text-gray-700">
                    Active
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createDepartmentMutation.isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {createDepartmentMutation.isLoading ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Staff Management Component
  const StaffManagement = () => {
    const [newUser, setNewUser] = useState({
      username: '',
      password: '',
      full_name: '',
      roles: ['reception'],
      designation: '',
      department_ids: [],
      email: '',
      phone: ''
    });

    const handleCreateUser = (e) => {
      e.preventDefault();
      if (!newUser.username.trim() || !newUser.password.trim() || !newUser.full_name.trim()) {
        toast.error('Username, password, and full name are required');
        return;
      }
      
      createUserMutation.mutate(newUser);
    };

    const availableRoles = [
      'admin', 'reception', 'doctor', 'nursing', 
      'laboratory', 'pharmacy', 'pharmacist', 'assistant'
    ];

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Staff Management</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
          >
            <span className="mr-2">+</span>
            Add Staff Member
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Role</label>
              <select
                value={userFilters.role || ''}
                onChange={(e) => setUserFilters({...userFilters, role: e.target.value || undefined})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Roles</option>
                {availableRoles.map(role => (
                  <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Department</label>
              <select
                value={userFilters.department_id || ''}
                onChange={(e) => setUserFilters({...userFilters, department_id: e.target.value || undefined})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => setUserFilters({})}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Users List */}
        {usersLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {users.map((user) => (
                <li key={user.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900">{user.full_name}</h3>
                        <span className="ml-2 text-sm text-gray-500">@{user.username}</span>
                      </div>
                      <div className="mt-1 flex items-center space-x-4">
                        <span className="text-sm text-gray-600">{user.designation}</span>
                        <div className="flex space-x-1">
                          {user.roles.map(role => (
                            <span key={role} className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>
                      {user.departments && user.departments.length > 0 && (
                        <div className="mt-1 flex space-x-1">
                          {user.departments.map(dept => (
                            <span key={dept.id} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {dept.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.active ? 'Active' : 'Inactive'}
                      </span>
                      <button className="text-blue-600 hover:text-blue-800 text-sm">
                        Edit
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium">Create New Staff Member</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username *
                    </label>
                    <input
                      type="text"
                      value={newUser.username}
                      onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Temporary Password *
                    </label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Roles *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {availableRoles.map(role => (
                      <label key={role} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newUser.roles.includes(role)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewUser({...newUser, roles: [...newUser.roles, role]});
                            } else {
                              setNewUser({...newUser, roles: newUser.roles.filter(r => r !== role)});
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm capitalize">{role}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={newUser.designation}
                    onChange={(e) => setNewUser({...newUser, designation: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Senior Consultant, Staff Nurse"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departments
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                    {departments.filter(d => d.active).map(dept => (
                      <label key={dept.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newUser.department_ids.includes(dept.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewUser({...newUser, department_ids: [...newUser.department_ids, dept.id]});
                            } else {
                              setNewUser({...newUser, department_ids: newUser.department_ids.filter(id => id !== dept.id)});
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">{dept.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={newUser.phone}
                      onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createUserMutation.isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {createUserMutation.isLoading ? 'Creating...' : 'Create Staff Member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  const tabs = [
    { id: 'departments', name: 'Departments', icon: '🏢' },
    { id: 'staff', name: 'Staff Management', icon: '👥' },
    { id: 'doctors', name: 'Doctors', icon: '👨‍⚕️' },
    { id: 'analytics', name: 'Analytics', icon: '📊' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'departments':
        return <DepartmentManagement />;
      case 'staff':
        return <StaffManagement />;
      case 'doctors':
        return (
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold text-gray-700">Doctor Management</h2>
            <p className="text-gray-500 mt-2">Coming soon...</p>
          </div>
        );
      case 'analytics':
        return (
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold text-gray-700">Analytics Dashboard</h2>
            <p className="text-gray-500 mt-2">Coming soon...</p>
          </div>
        );
      default:
        return <DepartmentManagement />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Welcome, {userName}</p>
        </div>
        
        <nav className="mt-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center px-6 py-3 text-left transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-50 border-r-2 border-blue-500 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="mr-3">{tab.icon}</span>
              {tab.name}
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

export default AdminDashboardNew;