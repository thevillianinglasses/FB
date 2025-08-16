import React, { useState, useEffect } from 'react';
import { useAppContext } from './AppContext';

function DoctorEditor({ doctor, onClose, onSave }) {
  const { addDoctor, updateDoctor } = useAppContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    degree: '',
    department: '',
    line1: '',
    locality: '',
    city: '',
    phone: '',
    email: '',
    registration_number: '',
    consultation_fee: '',
    availability_note: ''
  });

  // Form validation errors
  const [errors, setErrors] = useState({});

  // Department options - matching the specifications
  const departmentOptions = [
    'GENERAL MEDICINE',
    'PSYCHIATRY', 
    'PRIMARY CARE',
    'CARDIOLOGY',
    'DERMATOLOGY',
    'ORTHOPEDICS',
    'PEDIATRICS',
    'GYNECOLOGY',
    'ENT',
    'OPHTHALMOLOGY',
    'EMERGENCY MEDICINE'
  ];

  // Initialize form data when doctor prop changes
  useEffect(() => {
    if (doctor) {
      setFormData({
        name: doctor.name || '',
        degree: doctor.qualification || '',
        department: doctor.specialty || '',
        line1: doctor.address?.split(',')[0] || '',
        locality: doctor.address?.split(',')[1] || '',
        city: doctor.address?.split(',')[2] || '',
        phone: doctor.phone || '',
        email: doctor.email || '',
        registration_number: doctor.registration_number || '',
        consultation_fee: doctor.default_fee || '',
        availability_note: doctor.availability_note || ''
      });
    } else {
      // Reset for new doctor
      setFormData({
        name: '',
        degree: '',
        department: 'GENERAL MEDICINE',
        line1: '',
        locality: '',
        city: '',
        phone: '',
        email: '',
        registration_number: '',
        consultation_fee: '500',
        availability_note: ''
      });
    }
  }, [doctor]);

  // Validation rules
  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.degree.trim()) newErrors.degree = 'Degree is required';
    if (!formData.department.trim()) newErrors.department = 'Department is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';

    // Phone validation (10 digits)
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone must be 10 digits';
    }

    // Email validation (if provided)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Consultation fee validation
    if (formData.consultation_fee && isNaN(Number(formData.consultation_fee))) {
      newErrors.consultation_fee = 'Fee must be a number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle file upload
  const handleFileUpload = (e, documentType) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('❌ Invalid file type. Please upload PDF, JPG, or PNG files only.');
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      alert('❌ File size exceeds 5MB limit. Please choose a smaller file.');
      return;
    }

    // Add file to uploaded files list
    const newFile = {
      id: Date.now().toString(),
      name: file.name,
      type: documentType,
      file: file,
      uploadedAt: new Date().toISOString()
    };

    setUploadedFiles(prev => [...prev, newFile]);
  };

  // Remove uploaded file
  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      alert('❌ Please correct the errors before saving.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Combine address fields
      const addressParts = [formData.line1, formData.locality, formData.city]
        .filter(part => part.trim());
      const fullAddress = addressParts.join(', ');

      // Prepare doctor data according to backend API expectations
      const doctorData = {
        name: formData.name.trim(),
        specialty: formData.department,
        qualification: formData.degree.trim(),
        default_fee: formData.consultation_fee || '500',
        phone: formData.phone.trim(),
        email: formData.email.trim()
      };

      // Add optional fields only if they have values
      if (formData.registration_number.trim()) {
        doctorData.registration_number = formData.registration_number.trim();
      }
      if (fullAddress) {
        doctorData.address = fullAddress;
      }

      console.log('🔄 Saving doctor with data:', doctorData);

      let savedDoctor;
      if (doctor?.id) {
        // Update existing doctor
        savedDoctor = await updateDoctor(doctor.id, doctorData);
      } else {
        // Add new doctor (backend will generate UUID)
        savedDoctor = await addDoctor(doctorData);
      }

      // Show success toast
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);

      // Call onSave callback after short delay
      setTimeout(() => {
        onSave && onSave(savedDoctor);
      }, 1000);

    } catch (error) {
      console.error('Error saving doctor:', error);
      alert(`❌ Error saving doctor: ${error.message || 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle print
  const handlePrint = () => {
    if (!formData.name) {
      alert('❌ Please fill in doctor details before printing.');
      return;
    }

    // Create print content
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>UNICARE POLYCLINIC - Doctor Profile</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #6495ED; margin: 0; }
          .header p { color: #36454F; margin: 5px 0; }
          .section { margin-bottom: 20px; }
          .section h3 { color: #36454F; border-bottom: 2px solid #6495ED; padding-bottom: 5px; }
          .field { margin-bottom: 10px; }
          .field strong { color: #36454F; }
          .documents { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 15px; }
          .footer { text-align: center; margin-top: 40px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>UNICARE POLYCLINIC</h1>
          <p>Doctor Profile Report</p>
          <p>Generated on: ${new Date().toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Kolkata'
          })} IST</p>
        </div>

        <div class="section">
          <h3>Basic Information</h3>
          <div class="field"><strong>Name:</strong> Dr. ${formData.name}</div>
          <div class="field"><strong>Degree:</strong> ${formData.degree}</div>
          <div class="field"><strong>Department:</strong> ${formData.department}</div>
          <div class="field"><strong>Registration No:</strong> ${formData.registration_number}</div>
        </div>

        <div class="section">
          <h3>Contact Information</h3>
          <div class="field"><strong>Phone:</strong> ${formData.phone}</div>
          <div class="field"><strong>Email:</strong> ${formData.email}</div>
          <div class="field"><strong>Address:</strong> ${[formData.line1, formData.locality, formData.city].filter(Boolean).join(', ')}</div>
        </div>

        <div class="section">
          <h3>Professional Details</h3>
          <div class="field"><strong>Consultation Fee:</strong> ₹${formData.consultation_fee}</div>
          <div class="field"><strong>Availability Note:</strong> ${formData.availability_note || 'Not specified'}</div>
        </div>

        ${uploadedFiles.length > 0 ? `
        <div class="section">
          <h3>Uploaded Documents</h3>
          <div class="documents">
            ${uploadedFiles.map(file => `
              <div class="field">• ${file.type}: ${file.name} (Uploaded: ${new Date(file.uploadedAt).toLocaleDateString()})</div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <div class="footer">
          <p>This is a computer-generated document from Unicare Polyclinic EHR System</p>
          <p>Address: Unicare Polyclinic, Kerala, India</p>
        </div>
      </body>
      </html>
    `;

    // Open print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Success Toast */}
        {showSuccessToast && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-60 flex items-center space-x-2">
            <span className="text-lg">✅</span>
            <span>Doctor saved successfully!</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="bg-cornflower-blue text-white px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {doctor ? `Edit Dr. ${doctor.name}` : 'Add New Doctor'}
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-charcoal-grey border-b border-gray-200 pb-2">
              Basic Information *
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name* <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cornflower-blue ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter doctor's full name"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Degree* <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="degree"
                  value={formData.degree}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cornflower-blue ${
                    errors.degree ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., MBBS, MD, MS"
                />
                {errors.degree && <p className="text-red-500 text-xs mt-1">{errors.degree}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department* <span className="text-red-500">*</span>
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cornflower-blue ${
                    errors.department ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  {departmentOptions.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-charcoal-grey border-b border-gray-200 pb-2">
              Address Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                <input
                  type="text"
                  name="line1"
                  value={formData.line1}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  placeholder="House/Building number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Locality</label>
                <input
                  type="text"
                  name="locality"
                  value={formData.locality}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  placeholder="Area/Locality"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  placeholder="City"
                />
              </div>
            </div>
          </div>

          {/* Contact & Professional Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-charcoal-grey border-b border-gray-200 pb-2">
              Contact & Professional Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone* <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cornflower-blue ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="10-digit phone number"
                  maxLength="10"
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cornflower-blue ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="doctor@example.com"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration No</label>
                <input
                  type="text"
                  name="registration_number"
                  value={formData.registration_number}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                  placeholder="Medical council registration"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee (₹)</label>
                <input
                  type="number"
                  name="consultation_fee"
                  value={formData.consultation_fee}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cornflower-blue ${
                    errors.consultation_fee ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="500"
                  min="0"
                />
                {errors.consultation_fee && <p className="text-red-500 text-xs mt-1">{errors.consultation_fee}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Availability Note</label>
              <textarea
                name="availability_note"
                value={formData.availability_note}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cornflower-blue"
                rows="3"
                placeholder="e.g., Mon-Sat 9AM-5PM, Emergency on-call available"
              />
            </div>
          </div>

          {/* Document Upload Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-charcoal-grey border-b border-gray-200 pb-2">
              Upload Documents
              <span className="text-sm font-normal text-gray-600 ml-2">
                (PDF, JPG, PNG • Max 5MB each)
              </span>
            </h3>
            
            {/* Quick Upload Buttons */}
            <div className="flex flex-wrap gap-3">
              <div>
                <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors inline-block">
                  + Aadhar Card
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'Aadhar Card')}
                  />
                </label>
              </div>
              <div>
                <label className="cursor-pointer bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors inline-block">
                  + TCMC Registration
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'TCMC Registration')}
                  />
                </label>
              </div>
              <div>
                <label className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors inline-block">
                  + Postgraduate Certificate
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'Postgraduate Certificate')}
                  />
                </label>
              </div>
              <div>
                <label className="cursor-pointer bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors inline-block">
                  + Other Document
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'Other Document')}
                  />
                </label>
              </div>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 ? (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700">Uploaded Documents ({uploadedFiles.length})</h4>
                <div className="space-y-2">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-xl border">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-cornflower-blue rounded-lg flex items-center justify-center text-white text-sm font-medium">
                          📄
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{file.type}</p>
                          <p className="text-sm text-gray-600">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            Uploaded: {new Date(file.uploadedAt).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="text-red-600 hover:text-red-700 text-lg font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <div className="text-4xl text-gray-400 mb-2">📄</div>
                <p className="text-gray-500">No documents uploaded yet</p>
                <p className="text-sm text-gray-400 mt-1">Use the buttons above to upload certificates</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 px-6 py-4 bg-gray-50 rounded-b-xl border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            disabled={isSubmitting}
            className="px-6 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-colors flex items-center space-x-2"
          >
            <span>🖨️</span>
            <span>Print</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-6 py-2 bg-cornflower-blue text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-cornflower-blue disabled:opacity-50 transition-colors flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DoctorEditor;