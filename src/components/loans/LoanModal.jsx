import { useState, useEffect } from "react";
import { X, Loader, ChevronLeft, ChevronRight, Check, CheckCircle, AlertCircle  } from "lucide-react";
import { Step1Borrower } from "./LoanModalSteps/Step1Borrower";
import { Step2LoanDetails } from "./LoanModalSteps/Step2LoanDetails";
import { Step3RiskEvaluation } from "./LoanModalSteps/Step3RiskEvaluation";
import { Step4CollateralGuarantor } from "./LoanModalSteps/Step4CollateralGuarantor";
import axios from "axios";
import toast from 'react-hot-toast';

const API_URL = "http://localhost:5000/api";

export function LoanModal({ loan, users, onClose, onSave, formatCurrency }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const totalSteps = 4;
  
  // Define isEditing based on whether loan exists
  const isEditing = !!loan;
  // Initialize form data with loan data if editing
  const [formData, setFormData] = useState(() => {
    if (loan) {
      // EDIT MODE - Pre-populate all fields
      return {
        // Borrower mode
        borrowerMode: loan.borrower?.id ? 'existing' : 'new',
        borrowerId: loan.borrower?.id || '',
        
        // Loan Details
        amount: loan.amount || '',
        interestRate: loan.interestRate || '0',
        term: loan.term || '12',
        startDate: loan.startDate ? new Date(loan.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        paymentFrequency: loan.paymentFrequency || 'monthly',
        purpose: loan.purpose || 'business',
        description: loan.description || '',
        gracePeriod: loan.gracePeriod || '0',
        processingFee: loan.processingFee || '0',
        lateFee: loan.lateFee || '0',
        
        // Risk & Financial
        monthlyIncome: loan.financialInfo?.monthlyIncome || '',
        monthlyExpenses: loan.financialInfo?.monthlyExpenses || '',
        existingDebt: loan.financialInfo?.existingDebt || '',
        debtToIncomeRatio: loan.financialInfo?.debtToIncomeRatio || '0',
        riskLevel: loan.risk?.level || 'medium',
        loanOfficerNotes: loan.loanOfficerNotes || '',
        
        // New borrower fields (empty in edit mode)
        newBorrower: {
          name: '',
          phone: '',
          email: '',
          nationalId: '',
          idType: 'national_id',
          idFrontImage: null,
          idBackImage: null,
          occupation: '',
          address: '',
          city: '',
          monthlyIncome: '',
          businessName: '',
          businessType: '',
          businessRegistration: '',
          businessLicense: null
        },
        
        // Collateral - Pre-populate if exists
        collateral: {
          hasCollateral: loan.collateral?.hasCollateral || false,
          type: loan.collateral?.type || '',
          value: loan.collateral?.value || '',
          description: loan.collateral?.description || '',
          ownershipDocs: loan.collateral?.ownershipDocs || []
        },
        
        // Guarantor - Pre-populate if exists
        guarantorMode: loan.guarantor?.hasGuarantor ? (loan.guarantor.id ? 'existing' : 'new') : 'none',
        guarantor: {
          id: loan.guarantor?.id || '',
          name: loan.guarantor?.name || '',
          relationship: loan.guarantor?.relationship || '',
          phone: loan.guarantor?.phone || '',
          email: loan.guarantor?.email || '',
          income: loan.guarantor?.income || '',
          nationalId: loan.guarantor?.nationalId || '',
          idImage: loan.guarantor?.idImage || null,
          incomeProof: loan.guarantor?.incomeProof || null,
          agreementSigned: loan.guarantor?.agreementSigned || false
        }
      };
    } else {
      // CREATE MODE - Empty form
      return {
        borrowerMode: 'new',
        borrowerId: '',
        
        amount: '',
        interestRate: '0',
        term: '12',
        startDate: new Date().toISOString().split('T')[0],
        paymentFrequency: 'monthly',
        purpose: 'business',
        description: '',
        gracePeriod: '0',
        processingFee: '0',
        lateFee: '0',
        
        monthlyIncome: '',
        monthlyExpenses: '',
        existingDebt: '',
        debtToIncomeRatio: '0',
        riskLevel: 'medium',
        loanOfficerNotes: '',
        
        newBorrower: {
          name: '',
          phone: '',
          email: '',
          nationalId: '',
          idType: 'national_id',
          idFrontImage: null,
          idBackImage: null,
          occupation: '',
          address: '',
          city: '',
          monthlyIncome: '',
          businessName: '',
          businessType: '',
          businessRegistration: '',
          businessLicense: null
        },
        
        collateral: {
          hasCollateral: false,
          type: '',
          value: '',
          description: '',
          ownershipDocs: []
        },
        
        guarantorMode: 'none',
        guarantor: {
          id: '',
          name: '',
          relationship: '',
          phone: '',
          email: '',
          income: '',
          nationalId: '',
          idImage: null,
          incomeProof: null,
          agreementSigned: false
        }
      };
    }
  });

  const [borrowerMode, setBorrowerMode] = useState(() => {
    if (loan) {
      return loan.borrower?.id ? 'existing' : 'new';
    }
    return 'new';
  });
  
  const [guarantorMode, setGuarantorMode] = useState(() => {
    if (loan?.guarantor?.hasGuarantor) {
      return loan.guarantor.id ? 'existing' : 'new';
    }
    return 'none';
  });
  
  const [selectedBorrower, setSelectedBorrower] = useState(loan?.borrower || null);
  const [errors, setErrors] = useState({});

  // Update formData when borrowerMode changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, borrowerMode }));
  }, [borrowerMode]);

  // Update formData when guarantorMode changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, guarantorMode }));
  }, [guarantorMode]);

  const purposes = [
    { value: 'business', label: 'Business' },
    { value: 'personal', label: 'Personal' },
    { value: 'education', label: 'Education' },
    { value: 'agriculture', label: 'Agriculture' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'other', label: 'Other' }
  ];

  const collateralTypes = [
    { value: 'property', label: 'Property' },
    { value: 'vehicle', label: 'Vehicle' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'other', label: 'Other' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileUpload = async (e, fieldPath) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    
    try {
      const token = localStorage.getItem('token');
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('type', fieldPath);

      const response = await axios.post(`${API_URL}/upload`, formDataUpload, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        const fileData = {
          name: file.name,
          url: response.data.fileUrl,
          type: file.type,
          size: file.size,
          uploadedAt: new Date().toISOString()
        };

        if (fieldPath.includes('.')) {
          const [parent, child] = fieldPath.split('.');
          setFormData(prev => ({
            ...prev,
            [parent]: {
              ...prev[parent],
              [child]: fileData
            }
          }));
        } else {
          setFormData(prev => ({ ...prev, [fieldPath]: fileData }));
        }

        toast.success('File uploaded successfully');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleMultipleFilesUpload = async (e, fieldPath) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    
    try {
      const token = localStorage.getItem('token');
      const uploadedFiles = [];

      for (const file of files) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        formDataUpload.append('type', fieldPath);

        const response = await axios.post(`${API_URL}/upload`, formDataUpload, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.data.success) {
          uploadedFiles.push({
            name: file.name,
            url: response.data.fileUrl,
            type: file.type,
            size: file.size,
            uploadedAt: new Date().toISOString()
          });
        }
      }

      if (uploadedFiles.length > 0) {
        setFormData(prev => ({
          ...prev,
          collateral: {
            ...prev.collateral,
            ownershipDocs: [...(prev.collateral.ownershipDocs || []), ...uploadedFiles]
          }
        }));
        toast.success(`${uploadedFiles.length} files uploaded`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeFile = (fieldPath, index = null) => {
    if (index !== null) {
      const updatedDocs = [...formData.collateral.ownershipDocs];
      updatedDocs.splice(index, 1);
      setFormData(prev => ({
        ...prev,
        collateral: { ...prev.collateral, ownershipDocs: updatedDocs }
      }));
    } else {
      if (fieldPath.includes('.')) {
        const [parent, child] = fieldPath.split('.');
        setFormData(prev => ({
          ...prev,
          [parent]: { ...prev[parent], [child]: null }
        }));
      } else {
        setFormData(prev => ({ ...prev, [fieldPath]: null }));
      }
    }
    toast.success('File removed');
  };

  const handleExistingBorrowerChange = (e) => {
    const borrowerId = e.target.value;
    setFormData(prev => ({ ...prev, borrowerId }));
    const borrower = users.find(u => u._id === borrowerId);
    setSelectedBorrower(borrower || null);
  };

  const validateStep = () => {
    const newErrors = {};
    
    if (currentStep === 1) {
      if (borrowerMode === 'existing') {
        if (!formData.borrowerId) newErrors.borrowerId = 'Please select a borrower';
      } else {
        if (!formData.newBorrower.name?.trim()) newErrors['newBorrower.name'] = 'Name is required';
        if (!formData.newBorrower.phone?.trim()) newErrors['newBorrower.phone'] = 'Phone number is required';
        if (!formData.newBorrower.nationalId?.trim()) newErrors['newBorrower.nationalId'] = 'National ID is required';
      }
    } else if (currentStep === 2) {
      if (!formData.amount || parseFloat(formData.amount) < 100) {
        newErrors.amount = 'Amount must be at least 100';
      }
      if (!formData.term || parseInt(formData.term) < 1) {
        newErrors.term = 'Term must be at least 1 month';
      }
    } else if (currentStep === 3) {
      if (!formData.monthlyIncome || parseFloat(formData.monthlyIncome) <= 0) {
        newErrors.monthlyIncome = 'Monthly income is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

const handleSubmit = async () => {
  if (!validateStep()) return;

  // Add guarantor validation
  if (guarantorMode === 'new') {
    const guarantorData = formData.guarantor;
    if (!guarantorData.name?.trim()) {
      toast.error('Guarantor name is required');
      return;
    }
    if (!guarantorData.phone?.trim()) {
      toast.error('Guarantor phone is required');
      return;
    }
    if (!guarantorData.nationalId?.trim()) {
      toast.error('Guarantor national ID is required');
      return;
    }
    if (!guarantorData.relationship?.trim()) {
      toast.error('Guarantor relationship is required');
      return;
    }
    if (!guarantorData.income || parseFloat(guarantorData.income) <= 0) {
      toast.error('Guarantor income is required and must be greater than 0');
      return;
    }
  }

  setUploading(true);
  
  try {
    const submitData = {
      borrowerMode,
      ...(borrowerMode === 'existing' 
        ? { 
            borrowerId: formData.borrowerId,
            // Add the borrower national ID for existing borrowers
            borrowerNationalId: formData.existingBorrowerNationalId || null
          } 
        : { newBorrower: formData.newBorrower }
      ),
      
      amount: parseFloat(formData.amount),
      interestRate: parseFloat(formData.interestRate || 0),
      term: parseInt(formData.term),
      startDate: formData.startDate,
      paymentFrequency: formData.paymentFrequency,
      purpose: formData.purpose,
      description: formData.description,
      gracePeriod: parseInt(formData.gracePeriod || 0),
      processingFee: parseFloat(formData.processingFee || 0),
      lateFee: parseFloat(formData.lateFee || 0),
      
      monthlyIncome: parseFloat(formData.monthlyIncome || 0),
      monthlyExpenses: parseFloat(formData.monthlyExpenses || 0),
      existingDebt: parseFloat(formData.existingDebt || 0),
      loanOfficerNotes: formData.loanOfficerNotes,
      
      collateral: formData.collateral.hasCollateral ? {
        hasCollateral: true,
        type: formData.collateral.type,
        value: parseFloat(formData.collateral.value) || 0,
        description: formData.collateral.description,
        ownershipDocs: formData.collateral.ownershipDocs || []
      } : { hasCollateral: false },
      
      guarantorMode,
      guarantor: guarantorMode !== 'none' ? {
        name: formData.guarantor.name || '',
        relationship: formData.guarantor.relationship || '',
        phone: formData.guarantor.phone || '',
        email: formData.guarantor.email || '',
        income: formData.guarantor.income ? parseFloat(formData.guarantor.income) : undefined,
        nationalId: formData.guarantor.nationalId || '',
        idImage: formData.guarantor.idImage,
        incomeProof: formData.guarantor.incomeProof,
        agreementSigned: formData.guarantor.agreementSigned || false,
        ...(guarantorMode === 'existing' && formData.guarantor.id ? { id: formData.guarantor.id } : {})
      } : null
    };

    console.log('Submitting loan data:', submitData);
    await onSave(submitData);
  } catch (error) {
    console.error('Submit error:', error);
    toast.error('Failed to save loan');
  } finally {
    setUploading(false);
  }
};

  const getRiskColor = (level) => {
    switch(level) {
      case 'low': return 'bg-emerald-100 text-emerald-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const stepTitles = ['Borrower', 'Loan Details', 'Risk Assessment', 'Collateral & Guarantor'];

  return (
    <>
      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[70] p-4" onClick={() => setPreviewFile(null)}>
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="font-medium text-gray-900 truncate">{previewFile.name}</h3>
              <button onClick={() => setPreviewFile(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={18} className="text-gray-600" />
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
              {previewFile.type?.startsWith('image/') ? (
                <img src={previewFile.url} alt={previewFile.name} className="max-w-full h-auto mx-auto rounded-lg" />
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                  <a 
                    href={previewFile.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Download file
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Modal - FIXED LAYOUT */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full flex flex-col max-h-[90vh] shadow-xl">
          
          {/* Fixed Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-100 flex-shrink-0">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {loan ? 'Edit Loan' : 'Create New Loan'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Step {currentStep} of {totalSteps}: {stepTitles[currentStep - 1]}
              </p>
              {loan && (
                <p className="text-xs text-emerald-600 mt-1">
                  Loan ID: {loan.loanId}
                </p>
              )}
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={uploading}
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>

          {/* Progress Steps - Fixed */}
          <div className="flex px-6 pt-4 pb-2 bg-gray-50/50 flex-shrink-0">
            {stepTitles.map((label, i) => (
              <div key={i} className="flex-1">
                <div className="flex items-center">
                  <div className={`relative`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                      currentStep > i + 1
                        ? 'bg-emerald-600 text-white'
                        : currentStep === i + 1
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {currentStep > i + 1 ? <Check size={16} /> : i + 1}
                    </div>
                  </div>
                  <div className={`flex-1 h-0.5 mx-2 transition-all duration-300 ${
                    i < totalSteps - 1 
                      ? currentStep > i + 1 ? 'bg-emerald-600' : 'bg-gray-200'
                      : 'hidden'
                  }`} />
                </div>
                <p className={`text-xs mt-2 ${
                  currentStep === i + 1 ? 'text-emerald-600 font-medium' : 'text-gray-500'
                }`}>
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* Scrollable Content - Fixed height with overflow */}
          <div className="flex-1 overflow-y-auto min-h-0 p-6">

        {currentStep === 1 && (
          <div className="space-y-6">
            {isEditing ? (
              // EDIT MODE - Show borrower info directly without selection options
              <div className="space-y-4">
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <h3 className="font-medium text-emerald-800 mb-3 flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-600" />
                    Borrower Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-emerald-600 text-xs">Full Name</p>
                      <p className="font-medium text-gray-900">{selectedBorrower?.name || loan?.borrower?.name}</p>
                    </div>
                    <div>
                      <p className="text-emerald-600 text-xs">Phone Number</p>
                      <p className="text-gray-900">{selectedBorrower?.phone || loan?.borrower?.phone}</p>
                    </div>
                    <div>
                      <p className="text-emerald-600 text-xs">Email Address</p>
                      <p className="text-gray-900 truncate">{selectedBorrower?.email || loan?.borrower?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-emerald-600 text-xs">National ID</p>
                      <p className="text-gray-900 font-medium">
                        {(selectedBorrower?.nationalId || loan?.borrower?.nationalId) ? (
                          selectedBorrower?.nationalId || loan?.borrower?.nationalId
                        ) : (
                          <span className="text-yellow-600">Not provided</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

            {/* If National ID is missing, show warning but don't block editing */}
            {!(selectedBorrower?.nationalId || loan?.borrower?.nationalId) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">Missing National ID</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      This borrower doesn't have a National ID on file. You can still edit the loan, 
                      but consider updating the borrower's profile separately.
                    </p>
                  </div>
                </div>
              </div>
            )}
              </div>
            ) : (
              // CREATE MODE - Show borrower selection options
            <Step1Borrower
              borrowerMode={borrowerMode}
              onBorrowerModeChange={setBorrowerMode}
              selectedBorrower={selectedBorrower}
              formData={formData}
              users={users}
              errors={errors}
              onExistingBorrowerChange={handleExistingBorrowerChange}
              onChange={handleChange}
              onFileUpload={handleFileUpload}
              removeFile={removeFile}
              setPreviewFile={setPreviewFile}
              uploading={uploading}
              isEditing={!!loan}
              loanData={loan} // Pass loan data for context
            />
            )}
          </div>
        )}

            {currentStep === 2 && (
              <Step2LoanDetails
                formData={formData}
                errors={errors}
                onChange={handleChange}
                purposes={purposes}
                isEditing={!!loan} // Pass editing flag
              />
            )}

            {currentStep === 3 && (
              <Step3RiskEvaluation
                formData={formData}
                errors={errors}
                onChange={handleChange}
                getRiskColor={getRiskColor}
                isEditing={!!loan} // Pass editing flag
              />
            )}

            {currentStep === 4 && (
              <Step4CollateralGuarantor
                formData={formData}
                guarantorMode={guarantorMode}
                onGuarantorModeChange={setGuarantorMode}
                onChange={handleChange}
                onFileUpload={handleFileUpload}
                onMultipleFilesUpload={handleMultipleFilesUpload}
                removeFile={removeFile}
                setPreviewFile={setPreviewFile}
                users={users}
                collateralTypes={collateralTypes}
                uploading={uploading}
                isEditing={!!loan} // Pass editing flag
              />
            )}
          </div>

          {/* Fixed Footer with Buttons */}
          <div className="flex justify-between items-center p-6 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
            <div className="flex items-center text-sm text-gray-500">
              {uploading && (
                <>
                  <Loader className="animate-spin mr-2" size={16} />
                  <span>Uploading...</span>
                </>
              )}
            </div>
            <div className="flex gap-3">
              {/* Cancel Button - Gray */}
              <button 
                onClick={onClose} 
                className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-white transition-colors text-gray-700 font-medium"
                disabled={uploading}
              >
                Cancel
              </button>
              
              {/* Back Button - Blue (only if not first step) */}
              {currentStep > 1 && (
                <button 
                  onClick={handleBack} 
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium shadow-sm"
                  disabled={uploading}
                >
                  <ChevronLeft size={18} />
                  Back
                </button>
              )}
              
              {/* Next Button - Emerald Green (for steps 1-3) */}
              {currentStep < totalSteps && (
                <button 
                  onClick={handleNext} 
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 font-medium shadow-sm"
                  disabled={uploading}
                >
                  Next
                  <ChevronRight size={18} />
                </button>
              )}
              
              {/* Submit Button - Purple (only on last step) */}
              {currentStep === totalSteps && (
                <button 
                  onClick={handleSubmit} 
                  className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 font-medium shadow-sm disabled:opacity-50"
                  disabled={uploading}
                >
                  {uploading && <Loader className="animate-spin" size={18} />}
                  {loan ? 'Update Loan' : 'Create Loan'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}