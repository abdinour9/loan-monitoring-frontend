// src/pages/Reports.jsx
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  CreditCard,
  Download,
  Calendar,
  FileText,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Loader,
  Eye
} from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const API_URL = "http://localhost:5000/api";

function Reports() {
  const [reportType, setReportType] = useState("performance");
  const [dateRange, setDateRange] = useState("month");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [loans, setLoans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [overdueSummary, setOverdueSummary] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [paymentStats, setPaymentStats] = useState(null);

  // Date range calculations
  const getDateRange = () => {
    const now = new Date();
    const ranges = {
      week: new Date(now.setDate(now.getDate() - 7)),
      month: new Date(now.setMonth(now.getMonth() - 1)),
      quarter: new Date(now.setMonth(now.getMonth() - 3)),
      year: new Date(now.setFullYear(now.getFullYear() - 1))
    };
    return ranges[dateRange];
  };

  // Fetch all data
  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch all data in parallel
      const [
        statsRes, 
        loansRes, 
        usersRes, 
        paymentsRes,
        overdueRes,
        paymentStatsRes
      ] = await Promise.all([
        axios.get(`${API_URL}/loans/stats/overview`, { headers }).catch(err => ({ data: { success: false } })),
        axios.get(`${API_URL}/loans?limit=1000`, { headers }).catch(err => ({ data: { success: false } })),
        axios.get(`${API_URL}/users?limit=1000`, { headers }).catch(err => ({ data: { success: false } })),
        axios.get(`${API_URL}/payments/admin/all?limit=1000`, { headers }).catch(err => ({ data: { success: false } })),
        axios.get(`${API_URL}/payments/admin/overdue-summary`, { headers }).catch(err => ({ data: { success: false } })),
        axios.get(`${API_URL}/payments/admin/dashboard-stats`, { headers }).catch(err => ({ data: { success: false } }))
      ]);

      if (statsRes.data?.success) setStats(statsRes.data.data);
      if (loansRes.data?.success) setLoans(loansRes.data.data);
      if (usersRes.data?.success) setUsers(usersRes.data.data);
      if (paymentsRes.data?.success) setPayments(paymentsRes.data.data);
      if (overdueRes.data?.success) setOverdueSummary(overdueRes.data.data);
      if (paymentStatsRes.data?.success) setPaymentStats(paymentStatsRes.data.data);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics from real data
  const calculateMetrics = () => {
    if (!loans.length) return null;

    const totalPortfolio = loans.reduce((sum, l) => sum + (l.amount || 0), 0);
    const totalPaid = payments
      .filter(p => p.status === 'success')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    const activeLoans = loans.filter(l => l.status === 'active').length;
    const completedLoans = loans.filter(l => l.status === 'completed').length;
    const overdueLoans = loans.filter(l => l.status === 'overdue').length;
    const pendingLoans = loans.filter(l => l.status === 'pending').length;
    const approvedLoans = loans.filter(l => l.status === 'approved').length;
    const rejectedLoans = loans.filter(l => l.status === 'rejected').length;
    const defaultedLoans = loans.filter(l => l.status === 'defaulted').length;

    const avgLoanSize = loans.length > 0 
      ? loans.reduce((sum, l) => sum + l.amount, 0) / loans.length 
      : 0;

    const defaultRate = loans.length > 0 
      ? (defaultedLoans / loans.length) * 100 
      : 0;

    const collectionRate = totalPortfolio > 0 
      ? (totalPaid / totalPortfolio) * 100 
      : 0;

    const activeBorrowers = users.filter(u => u.role === 'borrower' && u.isActive).length;
    const totalBorrowers = users.filter(u => u.role === 'borrower').length;
    const totalGuarantors = users.filter(u => u.role === 'guarantor').length;

    // Calculate risk distribution
    const riskDistribution = {
      low: loans.filter(l => l.risk?.level === 'low').length,
      medium: loans.filter(l => l.risk?.level === 'medium').length,
      high: loans.filter(l => l.risk?.level === 'high').length,
      critical: loans.filter(l => l.risk?.level === 'critical').length
    };

    return {
      totalPortfolio,
      totalPaid,
      collectionRate,
      avgLoanSize,
      defaultRate,
      activeLoans,
      completedLoans,
      overdueLoans,
      pendingLoans,
      approvedLoans,
      rejectedLoans,
      defaultedLoans,
      activeBorrowers,
      totalBorrowers,
      totalGuarantors,
      riskDistribution,
      totalLoans: loans.length,
      totalPayments: payments.length,
      successfulPayments: payments.filter(p => p.status === 'success').length,
      failedPayments: payments.filter(p => p.status === 'failed').length,
      pendingPayments: payments.filter(p => p.status === 'pending').length
    };
  };

  const metrics = calculateMetrics();

  // Prepare chart data based on report type
  const getChartData = () => {
    if (!stats || !loans.length) return [];

    switch(reportType) {
      case 'performance':
        return (stats.byStatus || []).map(s => ({
          name: s._id,
          value: s.totalAmount || 0,
          count: s.count || 0
        }));
      
      case 'collection':
        return (stats.byStatus || []).map(s => ({
          name: s._id,
          value: s.paidAmount || 0,
          total: s.totalAmount || 0
        }));
      
      case 'risk':
        return Object.entries(metrics?.riskDistribution || {}).map(([key, value]) => ({
          name: key,
          value: value,
          percentage: loans.length > 0 ? (value / loans.length) * 100 : 0
        }));
      
      case 'users':
        return [
          { name: 'Borrowers', value: metrics?.totalBorrowers || 0 },
          { name: 'Guarantors', value: metrics?.totalGuarantors || 0 },
          { name: 'Active', value: metrics?.activeBorrowers || 0 }
        ];
      
      case 'payments':
        return [
          { name: 'Successful', value: metrics?.successfulPayments || 0, amount: payments.filter(p => p.status === 'success').reduce((sum, p) => sum + p.amount, 0) },
          { name: 'Pending', value: metrics?.pendingPayments || 0 },
          { name: 'Failed', value: metrics?.failedPayments || 0 }
        ];
      
      default:
        return [];
    }
  };

  const chartData = getChartData();

  // Handle report export
  const handleExportReport = async (reportTitle, reportType, reportData) => {
    setExporting(true);
    try {
      const wb = XLSX.utils.book_new();
      let ws;

      switch(reportType) {
        case 'performance':
          ws = XLSX.utils.json_to_sheet(
            (stats?.byStatus || []).map(s => ({
              'Status': s._id,
              'Number of Loans': s.count,
              'Total Amount': s.totalAmount,
              'Paid Amount': s.paidAmount || 0,
              'Remaining': (s.totalAmount || 0) - (s.paidAmount || 0)
            }))
          );
          break;

        case 'risk':
          ws = XLSX.utils.json_to_sheet(
            Object.entries(metrics?.riskDistribution || {}).map(([level, count]) => ({
              'Risk Level': level,
              'Number of Loans': count,
              'Percentage': `${((count / loans.length) * 100).toFixed(1)}%`
            }))
          );
          break;

        case 'loans':
          ws = XLSX.utils.json_to_sheet(
            loans.map(l => ({
              'Loan ID': l.loanId,
              'Borrower': l.borrower?.name,
              'Amount': l.amount,
              'Status': l.status,
              'Paid Amount': l.paidAmount || 0,
              'Remaining': (l.amount || 0) - (l.paidAmount || 0),
              'Risk Level': l.risk?.level,
              'Term': `${l.term} months`,
              'Interest': `${l.interestRate}%`,
              'Start Date': new Date(l.startDate).toLocaleDateString(),
              'End Date': new Date(l.endDate).toLocaleDateString()
            }))
          );
          break;

        case 'payments':
          ws = XLSX.utils.json_to_sheet(
            payments.map(p => ({
              'Date': new Date(p.createdAt).toLocaleDateString(),
              'Borrower': p.userId?.name,
              'Loan ID': p.loanId_display,
              'Amount': p.amount,
              'Method': p.paymentMethod,
              'Phone': p.phoneNumber,
              'Status': p.status,
              'Transaction ID': p.transactionId
            }))
          );
          break;

        case 'users':
          ws = XLSX.utils.json_to_sheet(
            users.map(u => ({
              'Name': u.name,
              'Email': u.email,
              'Phone': u.phone,
              'Role': u.role,
              'Status': u.isActive ? 'Active' : 'Inactive',
              'Joined': new Date(u.createdAt).toLocaleDateString()
            }))
          );
          break;

        default:
          ws = XLSX.utils.json_to_sheet(reportData || []);
      }

      if (ws) {
        XLSX.utils.book_append_sheet(wb, ws, "Report");
        const filename = `${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, filename);
        toast.success('Report downloaded successfully');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  // Available reports list with real data
  const availableReports = [
    {
      id: 'loan-performance',
      title: 'Monthly Loan Performance',
      date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      size: `${(loans.length * 0.5).toFixed(1)} KB`,
      icon: <BarChart3 size={20} />,
      type: 'performance',
      data: stats?.byStatus
    },
    {
      id: 'risk-assessment',
      title: 'Risk Assessment Report',
      date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      size: '1.2 MB',
      icon: <Activity size={20} />,
      type: 'risk',
      data: metrics?.riskDistribution
    },
    {
      id: 'collection-efficiency',
      title: 'Collection Efficiency',
      date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      size: `${(payments.length * 0.3).toFixed(1)} KB`,
      icon: <TrendingUp size={20} />,
      type: 'payments',
      data: {
        collectionRate: metrics?.collectionRate,
        totalPaid: metrics?.totalPaid,
        totalPortfolio: metrics?.totalPortfolio
      }
    },
    {
      id: 'user-acquisition',
      title: 'User Acquisition Report',
      date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      size: `${(users.length * 0.2).toFixed(1)} KB`,
      icon: <Users size={20} />,
      type: 'users',
      data: {
        total: users.length,
        active: users.filter(u => u.isActive).length,
        borrowers: users.filter(u => u.role === 'borrower').length,
        guarantors: users.filter(u => u.role === 'guarantor').length,
        admins: users.filter(u => ['admin', 'super_admin'].includes(u.role)).length
      }
    },
    {
      id: 'financial-summary',
      title: 'Financial Summary',
      date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      size: `${(loans.length * 0.4).toFixed(1)} KB`,
      icon: <DollarSign size={20} />,
      type: 'financial',
      data: metrics
    },
    {
      id: 'complete-loan-list',
      title: 'Complete Loan List',
      date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      size: `${(loans.length * 0.8).toFixed(1)} KB`,
      icon: <FileText size={20} />,
      type: 'loans',
      data: loans
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader className="animate-spin text-emerald-600 mx-auto mb-4" size={40} />
          <p className="text-gray-500">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">
            Reports & Analytics
          </h1>
          <p className="text-gray-600 mt-1.5 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Comprehensive insights into loan performance and system metrics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
            {["week", "month", "quarter", "year"].map((period) => (
              <button
                key={period}
                onClick={() => setDateRange(period)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all capitalize ${
                  dateRange === period
                    ? "bg-green-600 text-white shadow-sm shadow-green-600/30"
                    : "text-gray-600 hover:text-green-600 hover:bg-green-50"
                }`}
              >
                {period}
              </button>
            ))}
          </div>
          
          <button 
            onClick={() => handleExportReport('Complete_Report', 'complete', { loans, users, payments, stats })}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg shadow-lg shadow-green-600/30 hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50"
          >
            {exporting ? <Loader className="animate-spin" size={18} /> : <Download size={18} />}
            Export Report
          </button>
        </div>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <ReportTypeCard
          title="Loan Performance"
          value={`$${(metrics?.totalPortfolio || 0).toLocaleString()}`}
          change={`${((metrics?.collectionRate || 0) - 75).toFixed(1)}%`}
          trendUp={(metrics?.collectionRate || 0) > 75}
          icon={<BarChart3 size={24} />}
          active={reportType === "performance"}
          onClick={() => setReportType("performance")}
        />
        <ReportTypeCard
          title="Collection Rate"
          value={`${(metrics?.collectionRate || 0).toFixed(1)}%`}
          change={`${((metrics?.collectionRate || 0) - 85).toFixed(1)}%`}
          trendUp={(metrics?.collectionRate || 0) > 85}
          icon={<TrendingUp size={24} />}
          active={reportType === "collection"}
          onClick={() => setReportType("collection")}
        />
        <ReportTypeCard
          title="Risk Analysis"
          value={`${(metrics?.riskDistribution?.high || 0) + (metrics?.riskDistribution?.critical || 0)} loans`}
          change={`${((metrics?.riskDistribution?.critical || 0) / (loans.length || 1) * 100).toFixed(1)}% critical`}
          trendUp={(metrics?.riskDistribution?.critical || 0) < 5}
          icon={<Activity size={24} />}
          active={reportType === "risk"}
          onClick={() => setReportType("risk")}
        />
        <ReportTypeCard
          title="User Growth"
          value={`${metrics?.totalBorrowers || 0}`}
          change={`+${users.filter(u => {
            const created = new Date(u.createdAt);
            const range = getDateRange();
            return created >= range;
          }).length} new`}
          trendUp={true}
          icon={<Users size={24} />}
          active={reportType === "users"}
          onClick={() => setReportType("users")}
        />
        <ReportTypeCard
          title="Payments"
          value={metrics?.totalPayments || 0}
          change={`$${(metrics?.totalPaid || 0).toLocaleString()}`}
          trendUp={true}
          icon={<CreditCard size={24} />}
          active={reportType === "payments"}
          onClick={() => setReportType("payments")}
        />
      </div>

      {/* Main Report Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <PieChart size={20} className="text-green-600" />
              {reportType === "performance" && "Loan Performance Overview"}
              {reportType === "collection" && "Collection Rate Summary"}
              {reportType === "risk" && "Risk Distribution Analysis"}
              {reportType === "users" && "User Growth Metrics"}
              {reportType === "payments" && "Payment Statistics"}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {dateRange === "week" && "Last 7 days"}
              {dateRange === "month" && "Last 30 days"}
              {dateRange === "quarter" && "Last 90 days"}
              {dateRange === "year" && "Last 12 months"}
            </p>
          </div>
          <button
            onClick={() => handleExportReport(reportType, reportType, chartData)}
            disabled={exporting}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
          >
            <Download size={16} />
            Export
          </button>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Category</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Count</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Value</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((item, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-800 capitalize">{item.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-800 text-right">
                    {item.count || item.value || 0}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-800 text-right">
                    {item.amount ? `$${item.amount.toLocaleString()}` : 
                     item.total ? `$${item.total.toLocaleString()}` : 
                     item.name.includes('Risk') ? '-' : 
                     `$${item.value?.toLocaleString() || 0}`}
                  </td>
                  <td className="py-3 px-4 text-sm text-right">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                      item.name === 'low' || item.name === 'completed' || item.name === 'successful'
                        ? 'bg-green-100 text-green-700'
                        : item.name === 'medium' || item.name === 'active' || item.name === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : item.name === 'high' || item.name === 'overdue' || item.name === 'failed'
                        ? 'bg-orange-100 text-orange-700'
                        : item.name === 'critical' || item.name === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {item.percentage 
                        ? `${item.percentage.toFixed(1)}%`
                        : item.name.includes('Risk') 
                        ? `${((item.value / loans.length) * 100).toFixed(1)}%`
                        : reportType === 'users'
                        ? `${((item.value / (metrics?.totalBorrowers || 1)) * 100).toFixed(1)}%`
                        : `${((item.value / (reportType === 'payments' ? metrics?.totalPayments || 1 : (stats?.byStatus?.reduce((sum, s) => sum + s.totalAmount, 0) || 1))) * 100).toFixed(1)}%`
                      }
                    </span>
                  </td>
                </tr>
              ))}
              {chartData.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-gray-500">
                    No data available for this report type
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Available Reports Grid */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FileText size={20} className="text-green-600" />
              Available Reports
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Download detailed reports for offline analysis
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableReports.map((report) => (
            <ReportDownloadCard
              key={report.id}
              report={report}
              onView={() => {
                setSelectedReport(report);
                setShowReportModal(true);
              }}
              onDownload={() => handleExportReport(report.title, report.type, report.data)}
              exporting={exporting}
            />
          ))}
        </div>
      </div>

      {/* Report Preview Modal */}
      {showReportModal && selectedReport && (
        <ReportPreviewModal
          report={selectedReport}
          metrics={metrics}
          users={users}
          loans={loans}
          payments={payments}
          stats={stats}
          onClose={() => {
            setShowReportModal(false);
            setSelectedReport(null);
          }}
          onDownload={() => handleExportReport(selectedReport.title, selectedReport.type, selectedReport.data)}
          exporting={exporting}
        />
      )}
    </div>
  );
}

function ReportTypeCard({ title, value, change, trendUp, icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        p-4 rounded-xl border transition-all text-left
        ${active 
          ? "bg-gradient-to-br from-green-600 to-emerald-600 border-green-700 shadow-lg shadow-green-600/30" 
          : "bg-white border-gray-100 hover:border-green-300 hover:shadow-md"
        }
      `}
    >
      <div className={`p-2 rounded-xl w-fit mb-3 ${
        active ? "bg-white/20" : "bg-green-50"
      }`}>
        <div className={active ? "text-white" : "text-green-600"}>
          {icon}
        </div>
      </div>
      <div>
        <p className={`text-xs mb-1 ${active ? "text-green-100" : "text-gray-600"}`}>
          {title}
        </p>
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${
            active ? "text-white" : "text-gray-800"
          }`}>
            {value}
          </span>
          <span className={`flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full ${
            active 
              ? "bg-white/20 text-white" 
              : trendUp 
                ? "bg-green-100 text-green-700" 
                : "bg-orange-100 text-orange-700"
          }`}>
            {trendUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {change}
          </span>
        </div>
      </div>
    </button>
  );
}

function ReportDownloadCard({ report, onView, onDownload, exporting }) {
  return (
    <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:border-green-300 hover:shadow-md transition-all group">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition">
          <div className="text-green-600">
            {report.icon}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-800 text-sm truncate">{report.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{report.date} • {report.size}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button 
          onClick={onView}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
          title="Preview Report"
        >
          <Eye size={16} className="text-blue-600" />
        </button>
        <button 
          onClick={onDownload}
          disabled={exporting}
          className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
          title="Download Report"
        >
          <Download size={16} className="text-green-600" />
        </button>
      </div>
    </div>
  );
}

function ReportPreviewModal({ report, metrics, users, loans, payments, stats, onClose, onDownload, exporting }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <div className="text-green-600">
                {report.icon}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{report.title}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{report.date}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-4">
            <h3 className="font-medium text-gray-800">Report Preview</h3>
            
            {report.type === 'performance' && stats?.byStatus && (
              <div className="bg-gray-50 rounded-lg p-4">
                {stats.byStatus.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                    <span className="text-sm text-gray-600 capitalize">{item._id}</span>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-800 block">${item.totalAmount?.toLocaleString() || 0}</span>
                      <span className="text-xs text-gray-500">{item.count || 0} loans</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {report.type === 'risk' && metrics?.riskDistribution && (
              <div className="bg-gray-50 rounded-lg p-4">
                {Object.entries(metrics.riskDistribution).map(([level, count], idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                    <span className="text-sm text-gray-600 capitalize">{level} Risk</span>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-800 block">{count} loans</span>
                      <span className="text-xs text-gray-500">{((count / loans.length) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {report.type === 'users' && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg">
                    <p className="text-xs text-gray-500">Total Users</p>
                    <p className="text-2xl font-bold text-gray-800">{users.length}</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <p className="text-xs text-gray-500">Active Users</p>
                    <p className="text-2xl font-bold text-green-600">{users.filter(u => u.isActive).length}</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <p className="text-xs text-gray-500">Borrowers</p>
                    <p className="text-lg font-semibold text-gray-800">{users.filter(u => u.role === 'borrower').length}</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <p className="text-xs text-gray-500">Guarantors</p>
                    <p className="text-lg font-semibold text-gray-800">{users.filter(u => u.role === 'guarantor').length}</p>
                  </div>
                </div>
              </div>
            )}

            {report.type === 'payments' && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-white rounded-lg">
                    <p className="text-xs text-gray-500">Total Payments</p>
                    <p className="text-2xl font-bold text-gray-800">{payments.length}</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <p className="text-xs text-gray-500">Total Collected</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${payments.filter(p => p.status === 'success').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Successful</span>
                    <span className="text-sm font-medium text-green-600">
                      {payments.filter(p => p.status === 'success').length} (${payments.filter(p => p.status === 'success').reduce((sum, p) => sum + p.amount, 0).toLocaleString()})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Pending</span>
                    <span className="text-sm font-medium text-yellow-600">
                      {payments.filter(p => p.status === 'pending').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Failed</span>
                    <span className="text-sm font-medium text-red-600">
                      {payments.filter(p => p.status === 'failed').length}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {report.type === 'financial' && metrics && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Portfolio</span>
                    <span className="text-sm font-medium text-gray-800">${metrics.totalPortfolio?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Paid</span>
                    <span className="text-sm font-medium text-green-600">${metrics.totalPaid?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Collection Rate</span>
                    <span className="text-sm font-medium text-green-600">{metrics.collectionRate?.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Avg Loan Size</span>
                    <span className="text-sm font-medium text-gray-800">${metrics.avgLoanSize?.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Default Rate</span>
                    <span className="text-sm font-medium text-orange-600">{metrics.defaultRate?.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}

            {report.type === 'loans' && (
              <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                <div className="space-y-2">
                  {loans.slice(0, 5).map((loan, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-white rounded border border-gray-100">
                      <div>
                        <p className="text-xs font-medium text-gray-800">{loan.loanId}</p>
                        <p className="text-xs text-gray-500">{loan.borrower?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-gray-800">${loan.amount?.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{loan.status}</p>
                      </div>
                    </div>
                  ))}
                  {loans.length > 5 && (
                    <p className="text-xs text-center text-gray-500 mt-2">
                      ... and {loans.length - 5} more loans
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Close
          </button>
          <button
            onClick={onDownload}
            disabled={exporting}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            {exporting ? <Loader className="animate-spin" size={16} /> : <Download size={16} />}
            Download Report
          </button>
        </div>
      </div>
    </div>
  );
}

export default Reports;