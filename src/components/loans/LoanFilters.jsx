import { Search, X } from "lucide-react";

export function LoanFilters({ 
  searchTerm, 
  onSearchChange, 
  statusFilter, 
  onStatusChange,
  riskFilter,
  onRiskChange,
  totalResults 
}) {
  const statuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'rejected', label: 'Rejected' }
  ];

  const riskLevels = [
    { value: 'all', label: 'All Risks' },
    { value: 'low', label: 'Low Risk' },
    { value: 'medium', label: 'Medium Risk' },
    { value: 'high', label: 'High Risk' },
    { value: 'critical', label: 'Critical Risk' }
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by borrower name or ID..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <select 
          value={statusFilter} 
          onChange={(e) => onStatusChange(e.target.value)} 
          className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
        >
          {statuses.map(status => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>

        {/* Risk Filter */}
        <select 
          value={riskFilter} 
          onChange={(e) => onRiskChange(e.target.value)} 
          className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
        >
          {riskLevels.map(risk => (
            <option key={risk.value} value={risk.value}>
              {risk.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
        <p className="text-sm text-gray-500">
          <span className="font-medium text-gray-700">{totalResults}</span> loans found
        </p>
        {(searchTerm || statusFilter !== 'all' || riskFilter !== 'all') && (
          <button
            onClick={() => {
              onSearchChange('');
              onStatusChange('all');
              onRiskChange('all');
            }}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}