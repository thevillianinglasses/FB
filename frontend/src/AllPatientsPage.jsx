import React, { useState, useEffect } from 'react';
import { useAppContext } from './AppContext';

function AllPatientsPage({ onEditPatient }) {
  const { patients, deletePatient, loadPatients, isLoading } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [isDeleting, setIsDeleting] = useState(null);

  // Filter patients based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredPatients(patients);
    } else {
      const filtered = patients.filter(patient =>
        patient.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone_number?.includes(searchTerm) ||
        patient.opd_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.token_number?.includes(searchTerm)
      );
      setFilteredPatients(filtered);
    }
  }, [patients, searchTerm]);

  const handleDeletePatient = async (patient) => {
    if (window.confirm(`Are you sure you want to delete patient ${patient.patient_name}?`)) {
      try {
        setIsDeleting(patient.id);
        await deletePatient(patient.id);
        // Patient list will be updated automatically via context
      } catch (error) {
        console.error('Error deleting patient:', error);
        alert('Failed to delete patient. Please try again.');
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const handleRefresh = () => {
    loadPatients();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-charcoal-grey">All Patients</h2>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="bg-cornflower-blue hover:bg-opacity-80 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <label htmlFor="search" className="block text-sm font-medium text-charcoal-grey mb-2">
          Search Patients
        </label>
        <input
          type="text"
          id="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-cornflower-blue rounded-md shadow-sm focus:outline-none focus:ring-cornflower-blue focus:border-cornflower-blue"
          placeholder="Search by name, phone, OPD number, or token number..."
        />
      </div>

      {/* Patients Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing {filteredPatients.length} of {patients.length} patients
        </p>
      </div>

      {/* Loading State */}
      {isLoading && patients.length === 0 && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cornflower-blue mx-auto"></div>
          <p className="mt-4 text-charcoal-grey">Loading patients...</p>
        </div>
      )}

      {/* No Patients */}
      {!isLoading && patients.length === 0 && (
        <div className="text-center py-8">
          <p className="text-charcoal-grey">No patients found. Start by adding a new patient.</p>
        </div>
      )}

      {/* No Search Results */}
      {!isLoading && patients.length > 0 && filteredPatients.length === 0 && (
        <div className="text-center py-8">
          <p className="text-charcoal-grey">No patients match your search criteria.</p>
          <button
            onClick={() => setSearchTerm('')}
            className="mt-2 text-cornflower-blue hover:underline"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Patients Table */}
      {filteredPatients.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  OPD / Token
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registration Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      OPD: {patient.opd_number || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      Token: {patient.token_number || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {patient.patient_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {patient.age} years, {patient.sex}
                    </div>
                    {patient.dob && (
                      <div className="text-xs text-gray-400">
                        DOB: {formatDate(patient.dob)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{patient.phone_number}</div>
                    {patient.address && (
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {patient.address}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(patient.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => onEditPatient(patient)}
                      className="text-cornflower-blue hover:text-cornflower-blue/80"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePatient(patient)}
                      disabled={isDeleting === patient.id}
                      className="text-coral-red hover:text-coral-red/80 disabled:opacity-50"
                    >
                      {isDeleting === patient.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AllPatientsPage;