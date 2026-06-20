import { Plus, RefreshCw, Filter, Loader, Eye, X, FileText, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import toast from 'react-hot-toast';
import { LoanStats, LoanFilters, LoanTable, LoanModal } from "../components/loans";

const API_URL = "http://localhost:5000/api";

function Loans() {
  const [loans, setLoans] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalPaid: 0,
    totalRemaining: 0,
    activeLoans: 0,
    overdueLoans: 0,
    completedLoans: 0,
    pendingLoans: 0,
    lowRisk: 0,
    mediumRisk: 0,
    highRisk: 0,
    criticalRisk: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [editingLoan, setEditingLoan] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });

  useEffect(() => {
    fetchLoans();
    fetchUsers();
  }, [statusFilter, riskFilter, pagination.page, searchTerm]);

const fetchLoans = async () => {
  setLoading(true);
  try {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({
      page: pagination.page,
      limit: pagination.limit,
      ...(statusFilter !== 'all' && { status: statusFilter }),
      ...(riskFilter !== 'all' && { risk: riskFilter }),
      ...(searchTerm && { search: searchTerm })
    });

    // CHANGE THIS LINE - use the new endpoint
    const response = await axios.get(`${API_URL}/loans/with-progress?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.success) {
      setLoans(response.data.data);
      setStats(response.data.summary);
      setPagination(response.data.pagination);
    }
  } catch (error) {
    toast.error('Failed to load loans');
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users?role=borrower`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) setUsers(response.data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLoans();
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleCreateLoan = () => {
    setEditingLoan(null);
    setShowModal(true);
  };

  const handleEditLoan = (loan) => {
    setEditingLoan(loan);
    setShowModal(true);
  };

  const handleViewLoan = (loan) => {
    setSelectedLoan(loan);
    setShowViewModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingLoan(null);
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setSelectedLoan(null);
    setPreviewFile(null);
  };

  const handleSaveLoan = async (loanData) => {
    try {
      const token = localStorage.getItem('token');
      
      if (editingLoan) {
        const response = await axios.put(`${API_URL}/loans/${editingLoan._id}`, loanData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          toast.success('Loan updated successfully');
          fetchLoans();
          handleCloseModal();
        }
      } else {
        const response = await axios.post(`${API_URL}/loans`, loanData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          toast.success('Loan created successfully');
          fetchLoans();
          handleCloseModal();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save loan');
    }
  };

  const handleApproveLoan = async (loanId) => {
    const loan = loans.find(l => l._id === loanId);
    
    // If already approved, show confirmation
    if (loan?.status === 'approved') {
      const confirmApprove = window.confirm('This loan is already approved. Are you sure you want to approve it again?');
      if (!confirmApprove) return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/loans/${loanId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        toast.success(loan?.status === 'approved' ? 'Loan approved again' : 'Loan approved successfully');
        fetchLoans();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve loan');
    }
  };

  const handleRejectLoan = async (loanId) => {
    const loan = loans.find(l => l._id === loanId);
    
    // Show warning with confirmation for deletion
    const confirmReject = window.confirm(
      `⚠️ WARNING: Rejecting this loan will permanently delete it!\n\nLoan ID: ${loan?.loanId || loanId}\nBorrower: ${loan?.borrower?.name}\nAmount: ${formatCurrency(loan?.amount)}\n\nThis action CANNOT be undone. Are you sure you want to reject and delete this loan?`
    );
    
    if (!confirmReject) return;
    
    try {
      const token = localStorage.getItem('token');
      // Using delete endpoint instead of reject
      const response = await axios.delete(`${API_URL}/loans/${loanId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Loan rejected and deleted permanently');
        fetchLoans();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject loan');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-blue-100 text-blue-800 border-blue-200',
      active: 'bg-green-100 text-green-800 border-green-200',
      completed: 'bg-gray-100 text-gray-800 border-gray-200',
      overdue: 'bg-orange-100 text-orange-800 border-orange-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      defaulted: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getRiskColor = (level) => {
    const colors = {
      low: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      critical: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[level] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'UN';
  };

  // Calculate pending count from loans array to ensure stats match table
  const pendingCount = loans.filter(loan => loan.status === 'pending').length;
  
  // Update stats with actual pending count from loaded loans
  const updatedStats = {
    ...stats,
    pendingLoans: pendingCount
  };

  if (loading && loans.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader className="animate-spin text-emerald-600 mx-auto mb-4" size={40} />
          <p className="text-gray-500">Loading loans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loan Management</h1>
          <p className="text-sm text-gray-500">Manage and track all loan applications</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleRefresh} 
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={refreshing}
          >
            <RefreshCw size={20} className={`text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className={`p-2 border rounded-lg transition-colors ${
              showFilters 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                : 'border-gray-200 hover:bg-gray-50 text-gray-600'
            }`}
          >
            <Filter size={20} />
          </button>
          <button 
            onClick={handleCreateLoan} 
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus size={20} />
            <span>New Loan</span>
          </button>
        </div>
      </div>

      {/* Stats Cards - Using updated stats with pending count from loaded loans */}
      <LoanStats stats={updatedStats} totalLoans={pagination.total} formatCurrency={formatCurrency} />

      {/* Filters */}
      {showFilters && (
        <LoanFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          riskFilter={riskFilter}
          onRiskChange={setRiskFilter}
          totalResults={pagination.total}
        />
      )}

      {/* Table */}
      <LoanTable
        loans={loans}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onEdit={handleEditLoan}
        onView={handleViewLoan}
        onApprove={handleApproveLoan}
        onReject={handleRejectLoan}
        formatCurrency={formatCurrency}
      />

      {/* Create/Edit Modal */}
      {showModal && (
        <LoanModal
          loan={editingLoan}
          users={users}
          onClose={handleCloseModal}
          onSave={handleSaveLoan}
          formatCurrency={formatCurrency}
          isEditing={!!editingLoan}
        />
      )}

      {/* View Loan Modal */}
      {showViewModal && selectedLoan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  Loan Details
                  <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(selectedLoan.status)}`}>
                    {selectedLoan.status}
                  </span>
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Loan ID: {selectedLoan.loanId || selectedLoan._id}
                </p>
              </div>
              <button 
                onClick={handleCloseViewModal} 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-6 max-h-[calc(90vh-120px)]">
              {/* Borrower Info */}
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                    {getInitials(selectedLoan.borrower?.name)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{selectedLoan.borrower?.name}</h3>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-emerald-600">Phone</p>
                        <p className="text-sm text-gray-900">{selectedLoan.borrower?.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-emerald-600">Email</p>
                        <p className="text-sm text-gray-900">{selectedLoan.borrower?.email || 'N/A'}</p>
                      </div>
                      {selectedLoan.borrower?.nationalId && (
                        <div>
                          <p className="text-xs text-emerald-600">National ID</p>
                          <p className="text-sm text-gray-900">{selectedLoan.borrower.nationalId}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Loan Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white border border-gray-100 rounded-xl p-4">
                  <p className="text-sm text-gray-500 mb-1">Loan Amount</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedLoan.amount)}</p>
                  <div className="flex justify-between mt-2 text-xs">
                    <span className="text-gray-500">Paid: {formatCurrency(selectedLoan.paidAmount || 0)}</span>
                    <span className="text-gray-500">Remaining: {formatCurrency(selectedLoan.remainingAmount || selectedLoan.amount)}</span>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-xl p-4">
                  <p className="text-sm text-gray-500 mb-1">Terms</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedLoan.term} months</p>
                  <p className="text-sm text-gray-500 mt-2">{selectedLoan.interestRate}% interest rate</p>
                </div>

                <div className="bg-white border border-gray-100 rounded-xl p-4">
                  <p className="text-sm text-gray-500 mb-1">Schedule</p>
                  <p className="text-sm text-gray-900">
                    Started: {selectedLoan.startDate ? formatDate(selectedLoan.startDate) : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-900 mt-1">
                    Ends: {selectedLoan.endDate ? formatDate(selectedLoan.endDate) : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Risk Assessment</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`border rounded-xl p-4 ${getRiskColor(selectedLoan.risk?.level)}`}>
                    <p className="text-sm font-medium capitalize mb-2">{selectedLoan.risk?.level} Risk</p>
                    <p className="text-sm">Score: {selectedLoan.risk?.score || 'N/A'}</p>
                    {selectedLoan.risk?.dti && (
                      <p className="text-sm mt-1">DTI: {selectedLoan.risk.dti}%</p>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Financial Info</p>
                    <div className="space-y-1 text-sm">
                      <p>Monthly Income: {formatCurrency(selectedLoan.financialInfo?.monthlyIncome || 0)}</p>
                      <p>Monthly Expenses: {formatCurrency(selectedLoan.financialInfo?.monthlyExpenses || 0)}</p>
                      <p>Existing Debt: {formatCurrency(selectedLoan.financialInfo?.existingDebt || 0)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Collateral Section */}
              {selectedLoan.collateral?.hasCollateral && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Collateral</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Type</p>
                        <p className="text-sm font-medium text-gray-900 capitalize">{selectedLoan.collateral.type}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Estimated Value</p>
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(selectedLoan.collateral.value)}</p>
                      </div>
                    </div>
                    {selectedLoan.collateral.description && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500">Description</p>
                        <p className="text-sm text-gray-900">{selectedLoan.collateral.description}</p>
                      </div>
                    )}
                    
                    {/* Collateral Documents */}
                    {selectedLoan.collateral.ownershipDocs?.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-medium text-gray-500 mb-2">DOCUMENTS</p>
                        <div className="space-y-2">
                          {selectedLoan.collateral.ownershipDocs.map((doc, index) => (
                            <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100">
                              <div className="flex items-center gap-2">
                                <FileText size={16} className="text-emerald-600" />
                                <span className="text-sm text-gray-900">{doc.name}</span>
                              </div>
                              <a 
                                href={doc.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-1.5 hover:bg-gray-100 rounded-lg"
                              >
                                <Eye size={16} className="text-blue-600" />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Guarantor Section */}
              {selectedLoan.guarantor?.hasGuarantor && selectedLoan.guarantor.name && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Guarantor</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Name</p>
                        <p className="text-sm font-medium text-gray-900">{selectedLoan.guarantor.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Relationship</p>
                        <p className="text-sm text-gray-900">{selectedLoan.guarantor.relationship}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="text-sm text-gray-900">{selectedLoan.guarantor.phone}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Income</p>
                        <p className="text-sm text-gray-900">{formatCurrency(selectedLoan.guarantor.income)}</p>
                      </div>
                    </div>
                    
                    {/* Guarantor Documents */}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {selectedLoan.guarantor.idImage && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">ID Document</p>
                          <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-100">
                            <FileText size={14} className="text-emerald-600" />
                            <span className="text-xs text-gray-900 truncate flex-1">{selectedLoan.guarantor.idImage.name}</span>
                            <a href={selectedLoan.guarantor.idImage.url} target="_blank" rel="noopener noreferrer">
                              <Eye size={14} className="text-blue-600" />
                            </a>
                          </div>
                        </div>
                      )}
                      {selectedLoan.guarantor.incomeProof && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Income Proof</p>
                          <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-100">
                            <FileText size={14} className="text-emerald-600" />
                            <span className="text-xs text-gray-900 truncate flex-1">{selectedLoan.guarantor.incomeProof.name}</span>
                            <a href={selectedLoan.guarantor.incomeProof.url} target="_blank" rel="noopener noreferrer">
                              <Eye size={14} className="text-blue-600" />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Loan Purpose & Notes */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Additional Information</h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Purpose</p>
                    <p className="text-sm text-gray-900 capitalize">{selectedLoan.purpose || 'Not specified'}</p>
                  </div>
                  {selectedLoan.description && (
                    <div>
                      <p className="text-xs text-gray-500">Description</p>
                      <p className="text-sm text-gray-900">{selectedLoan.description}</p>
                    </div>
                  )}
                  {selectedLoan.loanOfficerNotes && (
                    <div>
                      <p className="text-xs text-gray-500">Loan Officer Notes</p>
                      <p className="text-sm text-gray-900">{selectedLoan.loanOfficerNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer with Actions */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50/50">
              <button 
                onClick={handleCloseViewModal}
                className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-white transition-colors text-gray-700 font-medium"
              >
                Close
              </button>
              {(selectedLoan.status === 'pending' || selectedLoan.status === 'approved') && (
                <>
                  <button 
                    onClick={() => {
                      handleCloseViewModal();
                      handleApproveLoan(selectedLoan._id);
                    }}
                    className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium shadow-sm"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => {
                      handleCloseViewModal();
                      handleRejectLoan(selectedLoan._id);
                    }}
                    className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 font-medium shadow-sm"
                  >
                    Reject & Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}

export default Loans;