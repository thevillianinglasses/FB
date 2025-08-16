import React, { useState, useEffect } from 'react';
import { useAppContext } from './AppContext';
import DoctorEditor from './DoctorEditor';

function DoctorsDirectory({ onBack }) {
  const { doctors, loadDoctors, deleteDoctor } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDoctorEditor, setShowDoctorEditor] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    loadDoctorsData();
  }, []);

  const loadDoctorsData = async () => {
    setIsLoading(true);
    try {
      await loadDoctors();
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading doctors:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Group doctors by department
    const grouped = doctors.reduce((acc, doctor) => {
      const department = doctor.specialty || 'UNASSIGNED';
      if (!acc[department]) {
        acc[department] = [];
      }
      acc[department].push(doctor);
      return acc;
    }, {});

    setDepartments(Object.keys(grouped).map(dept => ({
      name: dept,
      doctors: grouped[dept]
    })));
  }, [doctors]);

  // Filter doctors based on search query
  const filteredDepartments = departments.map(dept => ({
    ...dept,
    doctors: dept.doctors.filter(doctor =>
      doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doctor.qualification || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doctor.phone || '').includes(searchQuery)
    )
  })).filter(dept => dept.doctors.length > 0 || searchQuery === '');

  const handleEditDoctor = (doctor) => {
    setEditingDoctor(doctor);
    setShowDoctorEditor(true);
  };

  const handleAddNewDoctor = () => {
    setEditingDoctor(null);
    setShowDoctorEditor(true);
  };

  const handleDeleteDoctor = async (doctor) => {
    const confirmText = `Delete Dr ${doctor.name}? This cannot be undone.`;
    
    if (window.confirm(confirmText)) {
      // Additional confirmation by typing doctor's name
      const typedName = prompt(`Type the doctor's name "${doctor.name}" to confirm deletion:`);
      
      if (typedName === doctor.name) {
        try {
          await deleteDoctor(doctor.id);
          await loadDoctorsData(); // Reload data
          alert(`✅ Dr ${doctor.name} has been deleted successfully.`);
        } catch (error) {
          alert(`❌ Error deleting doctor: ${error.message}`);
        }
      } else if (typedName !== null) {
        alert('❌ Name doesn\'t match. Deletion cancelled.');
      }
    }
  };

  const handleDoctorSaved = () => {
    setShowDoctorEditor(false);
    setEditingDoctor(null);
    loadDoctorsData(); // Reload data
  };

  // Loading skeletons
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded-md mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded-md"></div>
              <div className="h-4 bg-gray-200 rounded-md w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded-md w-1/2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (showDoctorEditor) {
    return (
      <DoctorEditor
        doctor={editingDoctor}
        onClose={() => setShowDoctorEditor(false)}
        onSave={handleDoctorSaved}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Breadcrumbs */}
            <nav className="flex items-center space-x-2 text-sm">
              <button 
                onClick={onBack}
                className="text-cornflower-blue hover:text-blue-700 font-medium"
              >
                Admin Dashboard
              </button>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-gray-600 font-medium">Doctors</span>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title and Sub-toolbar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-charcoal-grey">Doctors</h1>
            <p className="text-gray-600 mt-1">Manage doctor profiles and departments</p>
          </div>
          
          {/* Sub-toolbar */}
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-cornflower-blue focus:border-cornflower-blue"
                placeholder="Search by name, degree, or phone"
              />
            </div>
            
            {/* Add Doctor Button */}
            <button
              onClick={handleAddNewDoctor}
              className="bg-cornflower-blue hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add Doctor</span>
            </button>
          </div>
        </div>

        {/* Content Grid */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDepartments.map((department) => (
              <div 
                key={department.name}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Department Header */}
                <div className="bg-cornflower-blue text-white px-6 py-4">
                  <h3 className="text-lg font-semibold">{department.name}</h3>
                  <p className="text-blue-100 text-sm">
                    {department.doctors.length} doctor{department.doctors.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Doctors List */}
                <div className="p-6">
                  {department.doctors.length === 0 ? (
                    // Empty Department State
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <div className="text-gray-400 text-4xl mb-2">👨‍⚕️</div>
                      <p className="text-gray-500 text-sm mb-3">No doctors yet</p>
                      <button
                        onClick={handleAddNewDoctor}
                        className="text-cornflower-blue hover:text-blue-700 text-sm font-medium"
                      >
                        Add Doctor
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {department.doctors.slice(0, 3).map((doctor) => (
                        <div 
                          key={doctor.id}
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                          {/* Doctor Tile Content */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <button
                                onClick={() => handleEditDoctor(doctor)}
                                className="text-left hover:text-cornflower-blue transition-colors"
                              >
                                <h4 className="font-semibold text-gray-900 text-lg">
                                  Dr {doctor.name}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  {doctor.qualification || 'Qualification not specified'} – {doctor.specialty}
                                </p>
                                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                  <span>Fee: ₹{doctor.default_fee}</span>
                                  {doctor.phone && <span>📞 {doctor.phone}</span>}
                                </div>
                              </button>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex items-center space-x-3 ml-4">
                              <button
                                onClick={() => handleEditDoctor(doctor)}
                                className="text-cornflower-blue hover:text-blue-700 text-sm font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteDoctor(doctor)}
                                className="text-red-600 hover:text-red-700 text-sm font-medium"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Show more if there are additional doctors */}
                      {department.doctors.length > 3 && (
                        <div className="text-center pt-2">
                          <span className="text-sm text-gray-500">
                            +{department.doctors.length - 3} more doctor{department.doctors.length - 3 !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State for Search */}
        {!isLoading && searchQuery && filteredDepartments.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
            <p className="text-gray-500">
              No doctors match your search for "{searchQuery}". Try adjusting your search terms.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 text-cornflower-blue hover:text-blue-700 font-medium"
            >
              Clear search
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default DoctorsDirectory;