import { 
  UserCheck, UserPlus, AlertCircle, CheckCircle, Eye, X, 
  Camera, Upload, FileText, Image, Shield, Building, Car, Package 
} from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import debounce from 'lodash/debounce';

const API_URL = "http://localhost:5000/api";

export function Step4CollateralGuarantor({
  formData,
  guarantorMode,
  onGuarantorModeChange,
  onChange,
  onFileUpload,
  onMultipleFilesUpload,
  removeFile,
  setPreviewFile,
  users,
  collateralTypes,
  uploading,
  isEditing
}) {
  
  const [checkingNationalId, setCheckingNationalId] = useState(false);
  const [nationalIdExists, setNationalIdExists] = useState(false);
  const [nationalIdMessage, setNationalIdMessage] = useState('');

  // Debounced function to check guarantor national ID uniqueness
  const checkGuarantorNationalId = debounce(async (nationalId) => {
    if (!nationalId || nationalId.length < 3 || guarantorMode !== 'new') {
      setNationalIdExists(false);
      setNationalIdMessage('');
      return;
    }

    setCheckingNationalId(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/users/check-national-id`, 
        { nationalId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setNationalIdExists(response.data.exists);
        setNationalIdMessage(response.data.message);
      }
    } catch (error) {
      console.error('Error checking guarantor national ID:', error);
    } finally {
      setCheckingNationalId(false);
    }
  }, 500);

  // Handle guarantor national ID change
  const handleGuarantorNationalIdChange = (e) => {
    const value = e.target.value;
    
    // Update form data
    onChange(e);
    
    // Check uniqueness for new guarantors only
    if (guarantorMode === 'new' && value && value.trim()) {
      checkGuarantorNationalId(value.trim());
    } else {
      setNationalIdExists(false);
      setNationalIdMessage('');
    }
  };

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      checkGuarantorNationalId.cancel();
    };
  }, []);

  const getFileIcon = (fileType) => {
    if (fileType?.startsWith('image/')) return <Image size={16} className="text-blue-500" />;
    return <FileText size={16} className="text-gray-500" />;
  };

  const getCollateralIcon = (type) => {
    switch(type) {
      case 'property': return <Building size={20} className="text-emerald-600" />;
      case 'vehicle': return <Car size={20} className="text-emerald-600" />;
      case 'equipment': return <Package size={20} className="text-emerald-600" />;
      default: return <Shield size={20} className="text-emerald-600" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Collateral Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                name="collateral.hasCollateral"
                checked={formData.collateral?.hasCollateral || false}
                onChange={onChange}
                className="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
              />
            </div>
            <span className="font-medium text-gray-900">Has Collateral</span>
          </label>
          {formData.collateral?.hasCollateral && (
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">
              {formData.collateral.ownershipDocs?.length || 0} document(s)
            </span>
          )}
        </div>

        {formData.collateral?.hasCollateral && (
          <div className="pl-8 space-y-4 animate-slideDown">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Collateral Type</label>
                <div className="relative">
                  <select
                    name="collateral.type"
                    value={formData.collateral?.type || ''}
                    onChange={onChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none appearance-none bg-white"
                  >
                    <option value="">Select type</option>
                    {collateralTypes.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    {getCollateralIcon(formData.collateral?.type)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Estimated Value</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    name="collateral.value"
                    placeholder="0.00"
                    value={formData.collateral?.value || ''}
                    onChange={onChange}
                    className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <input
                type="text"
                name="collateral.description"
                placeholder="Describe the collateral"
                value={formData.collateral?.description || ''}
                onChange={onChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            {/* Collateral Documents */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Ownership Documents</label>
              <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                uploading ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 hover:border-emerald-200 hover:bg-gray-50'
              }`}>
                <input
                  type="file"
                  onChange={(e) => onMultipleFilesUpload(e, 'collateral.ownershipDocs')}
                  multiple
                  accept="image/*,.pdf"
                  className="hidden"
                  id="collateralDocs"
                  disabled={uploading}
                />
                <label htmlFor="collateralDocs" className="cursor-pointer block">
                  <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 font-medium">Click to upload documents</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, Images (Max 10MB each)</p>
                </label>
              </div>

              {/* Document List */}
              {formData.collateral?.ownershipDocs?.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium text-gray-500">UPLOADED DOCUMENTS</p>
                  {formData.collateral.ownershipDocs.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 bg-white rounded-lg">
                          {getFileIcon(doc.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                          <p className="text-xs text-gray-500">
                            {doc.type} • {(doc.size / 1024).toFixed(0)} KB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => setPreviewFile(doc)} 
                          className="p-2 hover:bg-white rounded-lg transition-colors"
                          title="Preview"
                        >
                          <Eye size={16} className="text-blue-600" />
                        </button>
                        <button 
                          onClick={() => removeFile('collateral.ownershipDocs', index)} 
                          className="p-2 hover:bg-white rounded-lg transition-colors"
                          title="Remove"
                        >
                          <X size={16} className="text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Guarantor Section */}
      <div className="border-t border-gray-100 pt-6">
        <h3 className="font-medium text-gray-900 mb-4">Guarantor Information</h3>
        
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            type="button"
            onClick={() => onGuarantorModeChange('none')}
            className={`p-3 rounded-xl border transition-all ${
              guarantorMode === 'none'
                ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600'
            }`}
          >
            No Guarantor
          </button>
          <button
            type="button"
            onClick={() => onGuarantorModeChange('existing')}
            className={`p-3 rounded-xl border transition-all flex items-center justify-center gap-2 ${
              guarantorMode === 'existing'
                ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600'
            }`}
          >
            <UserCheck size={16} />
            <span>Existing</span>
          </button>
          <button
            type="button"
            onClick={() => onGuarantorModeChange('new')}
            className={`p-3 rounded-xl border transition-all flex items-center justify-center gap-2 ${
              guarantorMode === 'new'
                ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600'
            }`}
          >
            <UserPlus size={16} />
            <span>New</span>
          </button>
        </div>

        {guarantorMode !== 'none' && (
          <div className="space-y-4 animate-fadeIn">
            {guarantorMode === 'new' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="guarantor.name"
                    placeholder="Enter full name"
                    value={formData.guarantor?.name || ''}
                    onChange={onChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="guarantor.phone"
                    placeholder="Enter phone number"
                    value={formData.guarantor?.phone || ''}
                    onChange={onChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    National ID <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="guarantor.nationalId"
                      placeholder="Enter national ID"
                      value={formData.guarantor?.nationalId || ''}
                      onChange={handleGuarantorNationalIdChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none pr-10 ${
                        nationalIdExists ? 'border-red-300 bg-red-50' :
                        formData.guarantor?.nationalId && !nationalIdExists && !checkingNationalId ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200'
                      }`}
                    />
                    {checkingNationalId && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-500 border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                  {nationalIdExists && (
                    <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                      <AlertCircle size={14} />
                      This National ID is already registered to another person
                    </p>
                  )}
                  {formData.guarantor?.nationalId && !nationalIdExists && !checkingNationalId && (
                    <p className="text-sm text-emerald-600 flex items-center gap-1 mt-1">
                      <CheckCircle size={14} />
                      National ID is available
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Relationship <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="guarantor.relationship"
                    placeholder="e.g., Spouse, Parent"
                    value={formData.guarantor?.relationship || ''}
                    onChange={onChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Monthly Income <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      name="guarantor.income"
                      placeholder="0.00"
                      value={formData.guarantor?.income || ''}
                      onChange={onChange}
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    name="guarantor.email"
                    placeholder="Enter email (optional)"
                    value={formData.guarantor?.email || ''}
                    onChange={onChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Guarantor Documents */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              {/* ID Document */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">ID Document</label>
                {formData.guarantor?.idImage ? (
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2">
                      {getFileIcon(formData.guarantor.idImage.type)}
                      <span className="text-sm text-gray-900 truncate">{formData.guarantor.idImage.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setPreviewFile(formData.guarantor.idImage)} className="p-1.5 hover:bg-white rounded-lg">
                        <Eye size={14} className="text-blue-600" />
                      </button>
                      <button onClick={() => removeFile('guarantor.idImage')} className="p-1.5 hover:bg-white rounded-lg">
                        <X size={14} className="text-red-600" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${
                    uploading ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 hover:border-emerald-200 hover:bg-gray-50'
                  }`}>
                    <input
                      type="file"
                      onChange={(e) => onFileUpload(e, 'guarantor.idImage')}
                      accept="image/*"
                      className="hidden"
                      id="guarantorId"
                      disabled={uploading}
                    />
                    <label htmlFor="guarantorId" className="cursor-pointer block">
                      <Camera size={24} className="mx-auto text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500">Upload ID</span>
                    </label>
                  </div>
                )}
              </div>
              
              {/* Income Proof */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Income Proof</label>
                {formData.guarantor?.incomeProof ? (
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2">
                      {getFileIcon(formData.guarantor.incomeProof.type)}
                      <span className="text-sm text-gray-900 truncate">{formData.guarantor.incomeProof.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setPreviewFile(formData.guarantor.incomeProof)} className="p-1.5 hover:bg-white rounded-lg">
                        <Eye size={14} className="text-blue-600" />
                      </button>
                      <button onClick={() => removeFile('guarantor.incomeProof')} className="p-1.5 hover:bg-white rounded-lg">
                        <X size={14} className="text-red-600" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${
                    uploading ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 hover:border-emerald-200 hover:bg-gray-50'
                  }`}>
                    <input
                      type="file"
                      onChange={(e) => onFileUpload(e, 'guarantor.incomeProof')}
                      accept="image/*,.pdf"
                      className="hidden"
                      id="incomeProof"
                      disabled={uploading}
                    />
                    <label htmlFor="incomeProof" className="cursor-pointer block">
                      <Upload size={24} className="mx-auto text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500">Upload Proof</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Agreement Checkbox */}
            <label className="flex items-center gap-3 cursor-pointer mt-4 p-3 bg-gray-50 rounded-xl">
              <input
                type="checkbox"
                name="guarantor.agreementSigned"
                checked={formData.guarantor?.agreementSigned || false}
                onChange={onChange}
                className="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700">Guarantor agreement has been signed</span>
            </label>
          </div>
        )}

        {/* Guarantor Notice */}
        {guarantorMode !== 'none' && (
          <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800">Guarantor Responsibilities</p>
                <p className="text-sm text-blue-600 mt-1">
                  The guarantor will be notified about loan approval, payments, and overdue alerts.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Card */}
      <div className="border-t border-gray-100 pt-6">
        <h3 className="font-medium text-gray-900 mb-3">Application Summary</h3>
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Collateral:</span>
            {formData.collateral?.hasCollateral ? (
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle size={16} />
                Provided ({formData.collateral.ownershipDocs?.length || 0} docs)
              </span>
            ) : (
              <span className="text-gray-400">None</span>
            )}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Guarantor:</span>
            {guarantorMode === 'none' ? (
              <span className="text-gray-400">None</span>
            ) : (
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle size={16} />
                {guarantorMode === 'existing' ? 'Existing' : 'New'} Guarantor
                {formData.guarantor?.agreementSigned && ' (Signed)'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
