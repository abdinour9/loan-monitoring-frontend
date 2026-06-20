import { Eye, Edit2, CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";

export function LoanTable({ 
  loans, 
  loading, 
  pagination, 
  onPageChange, 
  onEdit, 
  onView,
  onApprove, 
  onReject, 
  formatCurrency 
}) {

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (loans.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-emerald-600 text-2xl">$</span>
        </div>
        <p className="text-gray-500 mb-4">No loans found</p>
        <button className="text-emerald-600 hover:text-emerald-700 font-medium">
          Create your first loan
        </button>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      approved: 'bg-blue-50 text-blue-700 border-blue-200',
      active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      completed: 'bg-gray-50 text-gray-700 border-gray-200',
      overdue: 'bg-red-50 text-red-700 border-red-200',
      rejected: 'bg-red-50 text-red-700 border-red-200',
      defaulted: 'bg-red-50 text-red-700 border-red-200'
    };
    return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getRiskBadge = (risk) => {
    const colors = {
      low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      high: 'bg-orange-50 text-orange-700 border-orange-200',
      critical: 'bg-red-50 text-red-700 border-red-200'
    };
    return colors[risk?.level] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Loan ID</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Borrower</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Risk</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Term</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loans.map((loan) => (
              <tr 
                key={loan._id} 
                className="hover:bg-gray-50/50 transition-colors"
              >
                <td className="px-6 py-4">
                  <span className="font-mono text-sm font-medium text-gray-900">
                    {loan.loanId || loan._id.slice(-6).toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-xs font-medium text-emerald-700">
                        {loan.borrower?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'UN'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{loan.borrower?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{loan.borrower?.phone || 'No phone'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(loan.amount)}</p>
                  <p className="text-xs text-gray-500">Paid: {formatCurrency(loan.paidAmount || 0)}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(loan.status)}`}>
                    {loan.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getRiskBadge(loan.risk)}`}>
                    {loan.risk?.level || 'Unknown'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-900">{loan.term} months</p>
                  <p className="text-xs text-gray-500">{loan.interestRate}% interest</p>
                </td>
                <td className="px-6 py-4">
                  <div className="w-24">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium text-gray-900">
                        {Math.round(loan.progress || 0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${loan.progress || 0}%` }}
                      />
                    </div>
                    {loan.paidInstallments !== undefined && loan.totalInstallments !== undefined && (
                      <div className="text-xs text-gray-500 mt-1 text-center">
                        {loan.paidInstallments}/{loan.totalInstallments} installments
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    {/* View button - Always visible */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); onView(loan); }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye size={18} className="text-blue-600" />
                    </button>

                    {/* Edit button - Always visible */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); onEdit(loan); }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={18} className="text-emerald-600" />
                    </button>

                    {/* Approve button - Always visible for pending and approved loans */}
                    {(loan.status === 'pending' || loan.status === 'approved') && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onApprove(loan._id); }}
                        className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                        title="Approve"
                      >
                        <CheckCircle size={18} className="text-green-600" />
                      </button>
                    )}

                    {/* Reject button - Always visible for pending and approved loans */}
                    {(loan.status === 'pending' || loan.status === 'approved') && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onReject(loan._id); }}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Reject (Permanently Delete)"
                      >
                        <XCircle size={18} className="text-red-600" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
        <p className="text-sm text-gray-600">
          Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
          <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span>{' '}
          of <span className="font-medium">{pagination.total}</span> loans
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition-colors flex items-center gap-1 text-sm"
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
            className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition-colors flex items-center gap-1 text-sm"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}