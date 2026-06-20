import { DollarSign, Users, Clock, CheckCircle, AlertCircle, Shield } from "lucide-react";

export function LoanStats({ stats, totalLoans, formatCurrency }) {
  const cards = [
    { 
      label: 'Total Loans', 
      value: totalLoans, 
      icon: <Users size={20} className="text-emerald-600" />,
      bg: 'bg-emerald-50',
      border: 'border-emerald-100'
    },
    { 
      label: 'Active Loans', 
      value: stats.activeLoans, 
      icon: <CheckCircle size={20} className="text-blue-600" />,
      bg: 'bg-blue-50',
      border: 'border-blue-100'
    },
    { 
      label: 'Pending', 
      value: stats.pendingLoans, 
      icon: <Clock size={20} className="text-yellow-600" />,
      bg: 'bg-yellow-50',
      border: 'border-yellow-100'
    },
    { 
      label: 'Overdue', 
      value: stats.overdueLoans, 
      icon: <AlertCircle size={20} className="text-red-600" />,
      bg: 'bg-red-50',
      border: 'border-red-100'
    },
    { 
      label: 'Total Amount', 
      value: formatCurrency(stats.totalAmount), 
      icon: <DollarSign size={20} className="text-purple-600" />,
      bg: 'bg-purple-50',
      border: 'border-purple-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card, index) => (
        <div 
          key={index} 
          className={`${card.bg} ${card.border} border rounded-xl p-4 hover:shadow-md transition-shadow`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              {card.icon}
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              {card.label}
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{card.value}</p>
        </div>
      ))}
    </div>
  );
}