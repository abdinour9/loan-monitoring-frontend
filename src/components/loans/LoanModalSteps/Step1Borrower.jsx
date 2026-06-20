import { UserCheck, UserPlus, Camera, Upload, CheckCircle, X, Eye, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import debounce from 'lodash/debounce';

const API_URL = "http://localhost:5000/api";

export function Step1Borrower({
  borrowerMode,
  onBorrowerModeChange,
  selectedBorrower,
  formData,
  users,
  errors,
  onExistingBorrowerChange,
  onChange,
  onFileUpload,
  removeFile,
  setPreviewFile,
  uploading,
  isEditing,
  loanData // Add this prop
}) {
  const [checkingNationalId, setCheckingNationalId] = useState(false);
  const [nationalIdExists, setNationalIdExists] = useState(false);
  const [nationalIdValid, setNationalIdValid] = useState(true);
  const [nationalIdMessage, setNationalIdMessage] = useState('');

  const idTypes = [
    { value: 'national_id', label: 'National ID' },
    { value: 'passport', label: 'Passport' },
    { value: 'drivers_license', label: "Driver's License" }
  ];

  // Determine if borrower can be changed
  // In edit mode, if there are active loans, maybe prevent changing borrower
  const canChangeBorrower = !isEditing; // Allow changing only in create mode
  // Or if you want to allow changing borrower in edit mode, set to true
  // const canChangeBorrower = true;

  // Debounced function to check national ID uniqueness
  const checkNationalIdUniqueness = debounce(async (nationalId) => {
    if (!nationalId || nationalId.length < 3) {
      setNationalIdExists(false);
      setNationalIdValid(true);
      setNationalIdMessage('');
      return;
    }

    setCheckingNationalId(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/users/check-national-id`, 
        { 
          nationalId,
          excludeUserId: selectedBorrower?._id
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setNationalIdExists(response.data.exists);
        setNationalIdValid(!response.data.exists);
        setNationalIdMessage(response.data.message);
      }
    } catch (error) {
      console.error('Error checking national ID:', error);
    } finally {
      setCheckingNationalId(false);
    }
  }, 500);

  // Handle national ID change
  const handleNationalIdChange = (e) => {
    const value = e.target.value;
    onChange(e);
    
    if (value && value.trim()) {
      checkNationalIdUniqueness(value.trim());
    } else {
      setNationalIdExists(false);
      setNationalIdValid(true);
      setNationalIdMessage('');
    }
  };

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      checkNationalIdUniqueness.cancel();
    };
  }, []);

  const getFileDisplay = (file) => {
    if (!file) return null;
    return (
      <div className="flex items-center gap-2 text-xs">
        <CheckCircle size={14} className="text-emerald-600" />
        <span className="text-gray-600 truncate">{file.name}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Borrower Type Selection - Only enabled in create mode or if allowed to change */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => onBorrowerModeChange('existing')}
          disabled={!canChangeBorrower}
          className={`p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all ${
            borrowerMode === 'existing'
              ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600'
          } ${!canChangeBorrower ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <UserCheck size={20} />
          <span className="font-medium">Existing Borrower</span>
        </button>
        <button
          type="button"
          onClick={() => onBorrowerModeChange('new')}
          disabled={!canChangeBorrower}
          className={`p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all ${
            borrowerMode === 'new'
              ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600'
          } ${!canChangeBorrower ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <UserPlus size={20} />
          <span className="font-medium">New Borrower</span>
        </button>
      </div>

      {/* Existing Borrower */}
      {borrowerMode === 'existing' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Select Borrower</label>
            <select
              value={formData.borrowerId}
              onChange={onExistingBorrowerChange}
              disabled={!canChangeBorrower} // Only disable if cannot change
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow bg-white ${
                errors.borrowerId ? 'border-red-300 bg-red-50' : 'border-gray-200'
              } ${!canChangeBorrower ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
              <option value="">Choose a borrower...</option>
              {users.filter(u => ['borrower', 'admin'].includes(u.role)).map(user => (
                <option key={user._id} value={user._id}>
                  {user.name} - {user.phone} {user.profile?.idNumber ? `(ID: ${user.profile.idNumber})` : ''}
                </option>
              ))}
            </select>
            {errors.borrowerId && (
              <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                <span>•</span> {errors.borrowerId}
              </p>
            )}
          </div>
          
          {selectedBorrower && (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 animate-slideDown">
              <h3 className="font-medium text-emerald-800 mb-3 flex items-center gap-2">
                <CheckCircle size={16} className="text-emerald-600" />
                Borrower Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-emerald-600 text-xs">Full Name</p>
                  <p className="font-medium text-gray-900">{selectedBorrower.name}</p>
                </div>
                <div>
                  <p className="text-emerald-600 text-xs">Phone Number</p>
                  <p className="text-gray-900">{selectedBorrower.phone}</p>
                </div>
                <div>
                  <p className="text-emerald-600 text-xs">Email Address</p>
                  <p className="text-gray-900 truncate">{selectedBorrower.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-emerald-600 text-xs">National ID</p>
                  {/* REPLACE THIS: */}
                  {/* <p className="text-gray-900 font-medium">
                    {selectedBorrower.profile?.idNumber || (
                      <span className="text-red-500">MISSING - Please update</span>
                    )}
                  </p> */}
                  
                  {/* WITH THIS: */}
                  <input
                    type="text"
                    name="existingBorrowerNationalId"
                    placeholder="Enter National ID"
                    value={formData.existingBorrowerNationalId || selectedBorrower.profile?.idNumber || ''}
                    onChange={onChange}
                    className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm bg-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Borrower */}
      {borrowerMode === 'new' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="newBorrower.name"
                placeholder="Enter full name"
                value={formData.newBorrower.name}
                onChange={onChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow ${
                  errors['newBorrower.name'] ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              />
              {errors['newBorrower.name'] && (
                <p className="text-sm text-red-600">{errors['newBorrower.name']}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="newBorrower.phone"
                placeholder="Enter phone number"
                value={formData.newBorrower.phone}
                onChange={onChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow ${
                  errors['newBorrower.phone'] ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              />
              {errors['newBorrower.phone'] && (
                <p className="text-sm text-red-600">{errors['newBorrower.phone']}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                name="newBorrower.email"
                placeholder="Enter email"
                value={formData.newBorrower.email}
                onChange={onChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">ID Type</label>
              <select
                name="newBorrower.idType"
                value={formData.newBorrower.idType}
                onChange={onChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
              >
                {idTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                National ID Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="newBorrower.nationalId"
                  placeholder="Enter ID number"
                  value={formData.newBorrower.nationalId}
                  onChange={handleNationalIdChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow pr-10 ${
                    errors['newBorrower.nationalId'] ? 'border-red-300 bg-red-50' : 
                    nationalIdExists ? 'border-red-300 bg-red-50' :
                    formData.newBorrower.nationalId && nationalIdValid ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200'
                  }`}
                />
                {checkingNationalId && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-500 border-t-transparent"></div>
                  </div>
                )}
              </div>
              
              {/* National ID Status Messages */}
              {nationalIdExists && (
                <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                  <AlertCircle size={14} />
                  This National ID is already registered to another person
                </p>
              )}
              {formData.newBorrower.nationalId && !nationalIdExists && !checkingNationalId && (
                <p className="text-sm text-emerald-600 flex items-center gap-1 mt-1">
                  <CheckCircle size={14} />
                  National ID is available
                </p>
              )}
              {errors['newBorrower.nationalId'] && !nationalIdExists && (
                <p className="text-sm text-red-600">{errors['newBorrower.nationalId']}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Occupation</label>
              <input
                type="text"
                name="newBorrower.occupation"
                placeholder="Enter occupation"
                value={formData.newBorrower.occupation}
                onChange={onChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Address</label>
              <input
                type="text"
                name="newBorrower.address"
                placeholder="Street address"
                value={formData.newBorrower.address}
                onChange={onChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">City</label>
              <input
                type="text"
                name="newBorrower.city"
                placeholder="City"
                value={formData.newBorrower.city}
                onChange={onChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow"
              />
            </div>
          </div>

          {/* ID Documents Section */}
          <div className="border-t border-gray-100 pt-6">
            <h4 className="font-medium text-gray-900 mb-4">ID Documents</h4>
            <div className="grid grid-cols-2 gap-6">
              {/* ID Front */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">ID Front</label>
                {formData.newBorrower.idFrontImage ? (
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Camera size={16} className="text-emerald-600" />
                      <span className="text-sm text-gray-900 truncate">{formData.newBorrower.idFrontImage.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => setPreviewFile(formData.newBorrower.idFrontImage)} 
                        className="p-1.5 hover:bg-white rounded-lg"
                        type="button"
                      >
                        <Eye size={14} className="text-blue-600" />
                      </button>
                      <button 
                        onClick={() => removeFile('newBorrower.idFrontImage')} 
                        className="p-1.5 hover:bg-white rounded-lg"
                        type="button"
                      >
                        <X size={14} className="text-red-600" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${
                    formData.newBorrower.idFrontImage 
                      ? 'border-emerald-200 bg-emerald-50' 
                      : 'border-gray-200 hover:border-emerald-200 hover:bg-gray-50'
                  }`}>
                    <input
                      type="file"
                      onChange={(e) => onFileUpload(e, 'newBorrower.idFrontImage')}
                      accept="image/*"
                      className="hidden"
                      id="idFront"
                      disabled={uploading}
                    />
                    <label htmlFor="idFront" className="cursor-pointer block">
                      <div className="space-y-2">
                        <Upload size={24} className="mx-auto text-gray-400" />
                        <p className="text-sm text-gray-600">Upload ID front</p>
                        <p className="text-xs text-gray-400">JPG, PNG (Max 10MB)</p>
                      </div>
                    </label>
                  </div>
                )}
              </div>

              {/* ID Back */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">ID Back</label>
                {formData.newBorrower.idBackImage ? (
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Camera size={16} className="text-emerald-600" />
                      <span className="text-sm text-gray-900 truncate">{formData.newBorrower.idBackImage.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => setPreviewFile(formData.newBorrower.idBackImage)} 
                        className="p-1.5 hover:bg-white rounded-lg"
                        type="button"
                      >
                        <Eye size={14} className="text-blue-600" />
                      </button>
                      <button 
                        onClick={() => removeFile('newBorrower.idBackImage')} 
                        className="p-1.5 hover:bg-white rounded-lg"
                        type="button"
                      >
                        <X size={14} className="text-red-600" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${
                    formData.newBorrower.idBackImage 
                      ? 'border-emerald-200 bg-emerald-50' 
                      : 'border-gray-200 hover:border-emerald-200 hover:bg-gray-50'
                  }`}>
                    <input
                      type="file"
                      onChange={(e) => onFileUpload(e, 'newBorrower.idBackImage')}
                      accept="image/*"
                      className="hidden"
                      id="idBack"
                      disabled={uploading}
                    />
                    <label htmlFor="idBack" className="cursor-pointer block">
                      <div className="space-y-2">
                        <Upload size={24} className="mx-auto text-gray-400" />
                        <p className="text-sm text-gray-600">Upload ID back</p>
                        <p className="text-xs text-gray-400">JPG, PNG (Max 10MB)</p>
                      </div>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warning for existing borrowers without National ID */}
      {borrowerMode === 'existing' && selectedBorrower && !selectedBorrower.profile?.idNumber && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Missing National ID</p>
              <p className="text-sm text-yellow-700 mt-1">
                This borrower doesn't have a National ID on file. Please update their profile before creating a loan.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}