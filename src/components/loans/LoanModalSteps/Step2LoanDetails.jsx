import { DollarSign, Percent, Calendar, FileText } from "lucide-react";

export function Step2LoanDetails({ formData, errors, onChange, purposes }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {/* Loan Amount */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <DollarSign size={16} className="text-emerald-600" />
            Loan Amount <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={onChange}
              min="100"
              className={`w-full pl-8 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow ${
                errors.amount ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}
              placeholder="0.00"
            />
          </div>
          {errors.amount && (
            <p className="text-sm text-red-600">{errors.amount}</p>
          )}
        </div>

        {/* Interest Rate */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Percent size={16} className="text-emerald-600" />
            Interest Rate <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              name="interestRate"
              value={formData.interestRate}
              onChange={onChange}
              min="0"
              max="100"
              step="0.1"
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow ${
                errors.interestRate ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}
              placeholder="0"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
          </div>
          {errors.interestRate && (
            <p className="text-sm text-red-600">{errors.interestRate}</p>
          )}
        </div>

        {/* Term */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Calendar size={16} className="text-emerald-600" />
            Term <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              name="term"
              value={formData.term}
              onChange={onChange}
              min="1"
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow ${
                errors.term ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}
              placeholder="12"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">months</span>
          </div>
          {errors.term && (
            <p className="text-sm text-red-600">{errors.term}</p>
          )}
        </div>

        {/* Purpose */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <FileText size={16} className="text-emerald-600" />
            Purpose
          </label>
          <select
            name="purpose"
            value={formData.purpose}
            onChange={onChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
          >
            {purposes.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={onChange}
          rows="4"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
          placeholder="Provide a brief description of the loan purpose..."
        />
        <p className="text-xs text-gray-400 text-right">
          {formData.description?.length || 0}/500 characters
        </p>
      </div>

      {/* Summary Card */}
      {formData.amount && formData.term && (
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
          <h4 className="text-sm font-medium text-emerald-800 mb-2">Loan Summary</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-emerald-600 text-xs">Monthly Payment</p>
              <p className="font-medium text-gray-900">
                ${(parseFloat(formData.amount) / parseInt(formData.term || 1)).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-emerald-600 text-xs">Total Interest</p>
              <p className="font-medium text-gray-900">
                ${(parseFloat(formData.amount) * (parseFloat(formData.interestRate || 0) / 100)).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-emerald-600 text-xs">Total Repayment</p>
              <p className="font-medium text-gray-900">
                ${(parseFloat(formData.amount) * (1 + parseFloat(formData.interestRate || 0) / 100)).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}