import { Shield, AlertCircle, CheckCircle, Info, TrendingDown, Wallet, Receipt, Brain } from "lucide-react";

export function Step3RiskEvaluation({ 
  formData, 
  errors, 
  onChange,
  getRiskColor
}) {
  
  const calculateRisk = () => {
    const monthlyIncome = parseFloat(formData.monthlyIncome) || 0;
    const monthlyExpenses = parseFloat(formData.monthlyExpenses) || 0;
    const existingDebt = parseFloat(formData.existingDebt) || 0;
    const loanAmount = parseFloat(formData.amount) || 0;
    const term = parseFloat(formData.term) || 1;
    
    const monthlyPayment = loanAmount / term;
    const totalMonthlyObligations = monthlyExpenses + existingDebt + monthlyPayment;
    const dti = monthlyIncome > 0 ? (totalMonthlyObligations / monthlyIncome) * 100 : 0;
    
    let riskScore = 0;
    
    if (dti <= 30) riskScore += 50;
    else if (dti <= 40) riskScore += 40;
    else if (dti <= 50) riskScore += 25;
    else if (dti <= 60) riskScore += 15;
    else riskScore += 5;
    
    const loanToIncome = monthlyIncome > 0 ? loanAmount / monthlyIncome : 999;
    if (loanToIncome <= 3) riskScore += 30;
    else if (loanToIncome <= 5) riskScore += 20;
    else if (loanToIncome <= 8) riskScore += 10;
    else riskScore += 5;
    
    if (term <= 6) riskScore += 20;
    else if (term <= 12) riskScore += 15;
    else if (term <= 24) riskScore += 10;
    else riskScore += 5;
    
    let calculatedRiskLevel = 'critical';
    if (riskScore >= 70) calculatedRiskLevel = 'low';
    else if (riskScore >= 50) calculatedRiskLevel = 'medium';
    else if (riskScore >= 30) calculatedRiskLevel = 'high';
    else calculatedRiskLevel = 'critical';
    
    return {
      score: riskScore,
      level: calculatedRiskLevel,
      dti: dti.toFixed(2),
      loanToIncome: loanToIncome.toFixed(1)
    };
  };

  const risk = calculateRisk();

  const getRiskMessage = () => {
    if (risk.level === 'critical') {
      return {
        title: 'Critical Risk - Not Recommended',
        message: 'DTI exceeds 60%. This loan represents a critical risk.',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        icon: AlertCircle
      };
    } else if (risk.level === 'high') {
      return {
        title: 'High Risk - Proceed with Caution',
        message: 'DTI between 50-60%. Consider requiring collateral.',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-800',
        icon: AlertCircle
      };
    } else if (risk.level === 'medium') {
      return {
        title: 'Medium Risk - Standard Review',
        message: 'DTI between 40-50%. Standard loan requirements apply.',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800',
        icon: Info
      };
    } else {
      return {
        title: 'Low Risk - Good Candidate',
        message: 'DTI below 40%. Good borrowing capacity.',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        textColor: 'text-emerald-800',
        icon: CheckCircle
      };
    }
  };

  const riskMessage = getRiskMessage();
  const RiskIcon = riskMessage.icon;

  return (
    <div className="space-y-6">
      {/* Risk Score Card */}
      <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <Brain size={18} className="text-emerald-600" />
            AI Risk Assessment
          </h3>
          <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${getRiskColor(risk.level)}`}>
            {risk.level?.toUpperCase()} RISK (Score: {risk.score})
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-3 text-center border border-gray-100">
            <div className="text-2xl font-bold text-gray-900">
              {risk.dti}%
            </div>
            <div className="text-xs text-gray-500 mt-1">DTI Ratio</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center border border-gray-100">
            <div className="text-2xl font-bold text-gray-900">
              {risk.loanToIncome}x
            </div>
            <div className="text-xs text-gray-500 mt-1">Loan/Income</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center border border-gray-100">
            <div className="text-sm font-bold text-gray-900 capitalize">
              {risk.level}
            </div>
            <div className="text-xs text-gray-500 mt-1">Risk Level</div>
          </div>
        </div>
      </div>

      {/* Financial Inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Wallet size={16} className="text-emerald-600" />
            Monthly Income <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              name="monthlyIncome"
              value={formData.monthlyIncome}
              onChange={onChange}
              min="0"
              className={`w-full pl-8 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow ${
                errors.monthlyIncome ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}
              placeholder="0.00"
            />
          </div>
          {errors.monthlyIncome && (
            <p className="text-sm text-red-600">{errors.monthlyIncome}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Receipt size={16} className="text-emerald-600" />
            Monthly Expenses
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              name="monthlyExpenses"
              value={formData.monthlyExpenses}
              onChange={onChange}
              min="0"
              className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <TrendingDown size={16} className="text-emerald-600" />
            Existing Debt
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              name="existingDebt"
              value={formData.existingDebt}
              onChange={onChange}
              min="0"
              className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">DTI Ratio</label>
          <div className="relative">
            <input
              type="text"
              value={risk.dti}
              readOnly
              className={`w-full px-4 py-3 bg-gray-50 border rounded-xl ${
                parseFloat(risk.dti) > 50 
                  ? 'text-red-600 font-bold border-red-200' 
                  : 'text-gray-700 border-gray-200'
              }`}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
          </div>
        </div>
      </div>

      {/* Risk Message */}
      <div className={`${riskMessage.bgColor} border ${riskMessage.borderColor} rounded-xl p-4 flex items-start gap-3`}>
        <RiskIcon size={20} className={`${riskMessage.textColor} flex-shrink-0 mt-0.5`} />
        <div>
          <p className={`text-sm font-medium ${riskMessage.textColor}`}>{riskMessage.title}</p>
          <p className={`text-xs ${riskMessage.textColor} mt-1 opacity-90`}>{riskMessage.message}</p>
        </div>
      </div>

      {/* Loan Officer Notes */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Loan Officer Notes</label>
        <textarea
          name="loanOfficerNotes"
          value={formData.loanOfficerNotes || ''}
          onChange={onChange}
          rows="3"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
          placeholder="Add any additional notes about the risk assessment..."
        />
      </div>
    </div>
  );
}