import { useState } from "react";
import {
  MoreHorizontal,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Edit2,
  Eye,
  Shield,
  AlertCircle,
  BadgeAlert,
  DollarSign
} from "lucide-react";

export function LoanRow({ loan, onEdit, onApprove, onDisburse, onReject, onView, formatCurrency }) {
  const [showActions, setShowActions] = useState(false);

  const statusConfig = {
    pending: { 
      color: "bg-yellow-50 text-yellow-700 border-yellow-200", 
      icon: <Clock size={12} className="text-yellow-600" />,
      progressColor: "bg-yellow-500" 
    },
    approved: { 
      color: "bg-blue-50 text-blue-700 border-blue-200", 
      icon: <CheckCircle size={12} className="text-blue-600" />,
      progressColor: "bg-blue-500" 
    },
    active: { 
      color: "bg-green-50 text-green-700 border-green-200", 
      icon: <CheckCircle size={12} className="text-green-600" />,
      progressColor: "bg-green-500" 
    },
    overdue: { 
      color: "bg-orange-50 text-orange-700 border-orange-200", 
      icon: <AlertCircle size={12} className="text-orange-600" />,
      progressColor: "bg-orange-500" 
    },
    completed: { 
      color: "bg-gray-50 text-gray-700 border-gray-200", 
      icon: <CheckCircle size={12} className="text-gray-600" />,
      progressColor: "bg-gray-500" 
    },
    rejected: { 
      color: "bg-red-50 text-red-700 border-red-200", 
      icon: <AlertTriangle size={12} className="text-red-600" />,
      progressColor: "bg-red-500" 
    },
    cancelled: { 
      color: "bg-gray-50 text-gray-700 border-gray-200", 
      icon: <AlertTriangle size={12} className="text-gray-600" />,
      progressColor: "bg-gray-500" 
    }
  };

  const riskConfig = {
    low: { bg: "bg-green-50", text: "text-green-700", icon: <Shield size={12} className="text-green-600" /> },
    medium: { bg: "bg-yellow-50", text: "text-yellow-700", icon: <AlertTriangle size={12} className="text-yellow-600" /> },
    high: { bg: "bg-red-50", text: "text-red-700", icon: <BadgeAlert size={12} className="text-red-600" /> }
  };

  const progress = loan.amount > 0 
    ? Math.round((loan.paidAmount / loan.amount) * 100) 
    : 0;

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'UN';
  };

  const canApprove = loan.status === 'pending';
  const canDisburse = loan.status === 'approved';
  const canReject = loan.status === 'pending' || loan.status === 'approved';

  return (
    <tr className="hover:bg-gray-50/50 transition-colors group text-sm">
      <td className="px-4 py-3">
        <span className="font-mono text-xs font-medium text-gray-700">{loan.loanId}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center text-white font-semibold text-xs">
            {getInitials(loan.borrower?.name)}
          </div>
          <span className="text-sm font-medium text-gray-800">
            {loan.borrower?.name || 'Unknown'}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div>
          <span className="font-semibold text-gray-800">{formatCurrency(loan.amount)}</span>
          <span className="text-xs text-gray-400 ml-1">/ {formatCurrency(loan.remainingAmount)}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${statusConfig[loan.status]?.color || statusConfig.pending.color}`}>
          {statusConfig[loan.status]?.icon || statusConfig.pending.icon}
          <span className="capitalize">{loan.status}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${riskConfig[loan.risk?.level]?.bg || riskConfig.low.bg}`}>
          {riskConfig[loan.risk?.level]?.icon || riskConfig.low.icon}
          <span className={riskConfig[loan.risk?.level]?.text || riskConfig.low.text}>
            {loan.risk?.level || 'low'}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 text-gray-600">
          <Calendar size={12} className="text-gray-400" />
          <span className="text-xs">
            {loan.endDate ? new Date(loan.endDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'N/A'}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-16 bg-gray-100 rounded-full h-1.5">
            <div 
              className={`${statusConfig[loan.status]?.progressColor || 'bg-green-500'} h-1.5 rounded-full`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">{progress}%</span>
        </div>
      </td>
      <td className="px-4 py-3 relative">
        <div className="flex items-center gap-1">
          <button 
            onClick={onView}
            className="p-1 hover:bg-gray-100 rounded"
            title="View Details"
          >
            <Eye size={14} className="text-gray-500" />
          </button>
          
          {/* Actions Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowActions(!showActions)}
              className="p-1 hover:bg-gray-100 rounded"
              title="More Actions"
            >
              <MoreHorizontal size={14} className="text-gray-500" />
            </button>
            
            {showActions && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <button
                  onClick={() => {
                    onEdit();
                    setShowActions(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Edit2 size={14} />
                  Edit Loan
                </button>
                
                {canApprove && (
                  <button
                    onClick={() => {
                      onApprove(loan._id);
                      setShowActions(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50 flex items-center gap-2"
                  >
                    <CheckCircle size={14} />
                    Approve Loan
                  </button>
                )}
                
                {canDisburse && (
                  <button
                    onClick={() => {
                      onDisburse(loan._id);
                      setShowActions(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 flex items-center gap-2"
                  >
                    <DollarSign size={14} />
                    Disburse Loan
                  </button>
                )}
                
                {canReject && (
                  <button
                    onClick={() => {
                      onReject(loan._id);
                      setShowActions(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center gap-2"
                  >
                    <AlertTriangle size={14} />
                    Reject Loan
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}