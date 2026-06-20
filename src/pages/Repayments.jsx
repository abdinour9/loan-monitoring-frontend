// src/pages/Repayments.jsx
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Calendar,
  TrendingDown,
  TrendingUp,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Receipt,
  Ban,
  Mail,
  Phone,
  Loader,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Users
} from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import toast from 'react-hot-toast';
import { useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx';

const API_URL = "http://localhost:5000/api";

// Helper functions
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const calculateDaysLate = (dueDate) => {
  if (!dueDate) return 0;
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = today - due;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

function Repayments() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Data states
  const [payments, setPayments] = useState([]);
  const [loans, setLoans] = useState([]);
  const [stats, setStats] = useState(null);
  const [overdueSummary, setOverdueSummary] = useState(null);
  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchAllData();
  }, [statusFilter, currentPage]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch all data in parallel
      const [paymentsRes, loansRes, statsRes, overdueRes, upcomingRes] = await Promise.all([
        axios.get(`${API_URL}/payments/admin/all?page=${currentPage}&limit=${itemsPerPage}${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}`, { headers }).catch(err => ({ data: { success: false } })),
        axios.get(`${API_URL}/loans?limit=1000`, { headers }).catch(err => ({ data: { success: false } })),
        axios.get(`${API_URL}/payments/admin/dashboard-stats`, { headers }).catch(err => ({ data: { success: false } })),
        axios.get(`${API_URL}/payments/admin/overdue-summary`, { headers }).catch(err => ({ data: { success: false } })),
        axios.get(`${API_URL}/payments/admin/upcoming?days=7`, { headers }).catch(err => ({ data: { success: false } }))
      ]);

      // Process payments
      if (paymentsRes.data?.success) {
        setPayments(paymentsRes.data.data || []);
        setPagination(paymentsRes.data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          pages: 1
        });
      }

      // Process loans for reference
      if (loansRes.data?.success) {
        setLoans(loansRes.data.data || []);
      }

      // Process stats
      if (statsRes.data?.success) {
        setStats(statsRes.data.data);
      }

      // Process overdue summary
      if (overdueRes.data?.success) {
        setOverdueSummary(overdueRes.data.data);
      }

      // Process upcoming payments
      if (upcomingRes.data?.success) {
        setUpcomingPayments(upcomingRes.data.data || []);
      }

    } catch (error) {
      console.error('Error fetching repayment data:', error);
      toast.error('Failed to load repayment data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const wb = XLSX.utils.book_new();
      
      // Summary Sheet
      const summaryData = [
        ['Repayment Report', new Date().toLocaleDateString()],
        [''],
        ['Summary Statistics'],
        ['Total Collected', formatCurrency(stats?.totalCollected || 0)],
        ['Collection Rate', `${(stats?.collectionRate || 0).toFixed(1)}%`],
        ['Successful Payments', stats?.successfulPayments || 0],
        ['Total Payments', stats?.totalPayments || 0],
        ['This Month', formatCurrency(stats?.thisMonth?.amount || 0)],
        ['This Week', formatCurrency(stats?.thisWeek?.amount || 0)],
        [''],
        ['Overdue Summary'],
        ['Total Overdue Loans', overdueSummary?.totalOverdue || 0],
        ['Total Overdue Amount', formatCurrency(overdueSummary?.totalOverdueAmount || 0)],
        ['1-30 Days', `${overdueSummary?.byAge['1-30']?.count || 0} loans - ${formatCurrency(overdueSummary?.byAge['1-30']?.amount || 0)}`],
        ['31-60 Days', `${overdueSummary?.byAge['31-60']?.count || 0} loans - ${formatCurrency(overdueSummary?.byAge['31-60']?.amount || 0)}`],
        ['61+ Days', `${overdueSummary?.byAge['61+']?.count || 0} loans - ${formatCurrency(overdueSummary?.byAge['61+']?.amount || 0)}`]
      ];
      
      const ws = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, ws, "Summary");

      // Payments Sheet
      const paymentsData = payments.map(p => ({
        'Date': formatDate(p.createdAt),
        'Borrower': p.userId?.name || 'N/A',
        'Loan ID': p.loanId_display || p.loanId,
        'Amount': formatCurrency(p.amount),
        'Method': p.paymentMethod,
        'Phone': p.phoneNumber,
        'Status': p.status,
        'Transaction ID': p.transactionId,
        'Invoice ID': p.invoiceId
      }));

      const ws2 = XLSX.utils.json_to_sheet(paymentsData);
      XLSX.utils.book_append_sheet(wb, ws2, "Payments");

      XLSX.writeFile(wb, `repayment_report_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusConfig = (status) => {
    const statusMap = {
      'success': { color: 'bg-green-100 text-green-700 border-green-200', label: 'Paid' },
      'paid': { color: 'bg-green-100 text-green-700 border-green-200', label: 'Paid' },
      'completed': { color: 'bg-green-100 text-green-700 border-green-200', label: 'Paid' },
      'pending': { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Pending' },
      'failed': { color: 'bg-red-100 text-red-700 border-red-200', label: 'Failed' },
      'overdue': { color: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Overdue' },
      'defaulted': { color: 'bg-red-100 text-red-700 border-red-200', label: 'Defaulted' }
    };
    return statusMap[status?.toLowerCase()] || statusMap.pending;
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader className="animate-spin text-emerald-600 mx-auto mb-4" size={40} />
          <p className="text-gray-500">Loading repayment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">
          Repayment Monitoring
        </h1>
        <p className="text-gray-600 mt-1.5 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Track repayments, overdue accounts, and collection performance
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <RepaymentSummaryCard
          title="Total Collected"
          value={formatCurrency(stats?.totalCollected || 0)}
          subtitle="All time"
          trend={`${((stats?.collectionRate || 0) - 95).toFixed(1)}% vs target`}
          trendUp={(stats?.collectionRate || 0) >= 95}
          icon={<DollarSign size={22} />}
          color="green"
        />
        <RepaymentSummaryCard
          title="This Month"
          value={formatCurrency(stats?.thisMonth?.amount || 0)}
          subtitle={`${stats?.thisMonth?.count || 0} payments`}
          trend="Current month"
          trendUp={true}
          icon={<Calendar size={22} />}
          color="emerald"
        />
        <RepaymentSummaryCard
          title="Overdue"
          value={overdueSummary?.totalOverdue?.toString() || "0"}
          subtitle={formatCurrency(overdueSummary?.totalOverdueAmount || 0)}
          trend={`${overdueSummary?.byAge['61+']?.count || 0} critical`}
          trendUp={false}
          icon={<AlertTriangle size={22} />}
          color="orange"
        />
        <RepaymentSummaryCard
          title="Collection Rate"
          value={`${(stats?.collectionRate || 0).toFixed(1)}%`}
          subtitle={`${stats?.successfulPayments || 0}/${stats?.totalPayments || 0} payments`}
          trend={`${((stats?.collectionRate || 0) - 90).toFixed(1)}% vs target`}
          trendUp={(stats?.collectionRate || 0) >= 90}
          icon={<TrendingUp size={22} />}
          color="blue"
        />
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by borrower or loan ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
              <Filter size={16} className="text-gray-500" />
              <span className="text-sm text-gray-600">Filters:</span>
            </div>

            <select 
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-200 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white text-gray-700 text-sm"
            >
              <option value="all">All Payments</option>
              <option value="success">Successful</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>

            <button 
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700 hover:border-green-500 hover:text-green-600 hover:bg-green-50 transition-all disabled:opacity-50"
            >
              {exporting ? <Loader className="animate-spin" size={18} /> : <Download size={18} />}
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Repayment Schedule Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Payments */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Clock size={20} className="text-green-600" />
                  Upcoming Payments
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Next 7 days schedule
                </p>
              </div>
              <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                {upcomingPayments.length} payments due
              </span>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
            {upcomingPayments.length > 0 ? (
              upcomingPayments.map((item, index) => (
                <UpcomingPaymentRow 
                  key={index}
                  borrower={item.borrower?.id?.name || 'Unknown'}
                  amount={formatCurrency(item.nextInstallment?.amount || 0)}
                  dueDate={formatDate(item.nextInstallment?.dueDate)}
                  daysLeft={item.nextInstallment?.daysLeft || 0}
                  avatar={getInitials(item.borrower?.id?.name)}
                  loanId={item.loanId}
                  onClick={() => navigate(`/loans/${item._id || item.loanId}`)}
                />
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                No upcoming payments in the next 7 days
              </div>
            )}
          </div>
          
          <div className="p-4 bg-gray-50 border-t border-gray-100">
            <button 
              onClick={() => navigate('/loans?status=active')}
              className="text-sm font-medium text-green-600 hover:text-green-700 flex items-center gap-1"
            >
              View All Active Loans
              <TrendingUp size={16} />
            </button>
          </div>
        </div>

        {/* Overdue Summary */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-orange-500" />
            Overdue Overview
          </h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg">
                  <Clock size={18} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Overdue 1-30 days</p>
                  <p className="font-semibold text-gray-800">{overdueSummary?.byAge['1-30']?.count || 0} loans</p>
                </div>
              </div>
              <span className="text-sm font-medium text-orange-600">
                {formatCurrency(overdueSummary?.byAge['1-30']?.amount || 0)}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg">
                  <AlertTriangle size={18} className="text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Overdue 31-60 days</p>
                  <p className="font-semibold text-gray-800">{overdueSummary?.byAge['31-60']?.count || 0} loans</p>
                </div>
              </div>
              <span className="text-sm font-medium text-red-600">
                {formatCurrency(overdueSummary?.byAge['31-60']?.amount || 0)}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-red-100 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg">
                  <Ban size={18} className="text-red-700" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Overdue 61+ days</p>
                  <p className="font-semibold text-gray-800">{overdueSummary?.byAge['61+']?.count || 0} loans</p>
                </div>
              </div>
              <span className="text-sm font-medium text-red-700">
                {formatCurrency(overdueSummary?.byAge['61+']?.amount || 0)}
              </span>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total overdue</span>
              <span className="font-bold text-gray-800">
                {formatCurrency(overdueSummary?.totalOverdueAmount || 0)}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-600">At risk (high/critical)</span>
              <span className="font-bold text-orange-600">
                {overdueSummary?.atRisk?.high?.count || 0} loans
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Repayment Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            Recent Repayment Activity
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-600">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Borrower</th>
                <th className="px-6 py-4">Loan ID</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((payment) => (
                <RepaymentRow 
                  key={payment._id}
                  date={formatDate(payment.createdAt)}
                  borrower={payment.userId?.name || 'Unknown'}
                  borrowerAvatar={getInitials(payment.userId?.name)}
                  loanId={payment.loanId_display || payment.loanId}
                  amount={formatCurrency(payment.amount)}
                  method={payment.paymentMethod}
                  status={payment.status}
                  phone={payment.phoneNumber}
                  transactionId={payment.transactionId}
                  onClick={() => navigate(`/loans/${payment.loanId}`)}
                />
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                    No payments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} payments
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              
              {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                let pageNum;
                if (pagination.pages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= pagination.pages - 2) {
                  pageNum = pagination.pages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={i}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition ${
                      currentPage === pageNum
                        ? 'bg-green-600 text-white'
                        : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.pages}
                className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RepaymentSummaryCard({ title, value, subtitle, trend, trendUp, icon, color }) {
  const colorVariants = {
    green: "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200",
    emerald: "bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200",
    orange: "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200",
    blue: "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200",
  };

  return (
    <div className={`p-6 rounded-xl border ${colorVariants[color]} shadow-sm hover:shadow-md transition-all`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 rounded-xl bg-white text-${color}-600`}>
          {icon}
        </div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-xs font-medium px-2 py-1 rounded-full ${
            trendUp ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
          }`}>
            {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
          <span className="text-xs text-gray-500">{subtitle}</span>
        </div>
      </div>
    </div>
  );
}

function UpcomingPaymentRow({ borrower, amount, dueDate, daysLeft, avatar, loanId, onClick }) {
  return (
    <div 
      className="flex items-center justify-between p-4 hover:bg-gray-50 transition cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center text-white font-semibold text-sm">
          {avatar}
        </div>
        <div>
          <p className="font-medium text-gray-800">{borrower}</p>
          <p className="text-xs text-gray-500">Loan: {loanId}</p>
          <p className="text-xs text-gray-500">Due: {dueDate}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="font-semibold text-gray-800">{amount}</span>
        <span className={`text-xs px-2 py-1 rounded-full ${
          daysLeft <= 2 ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-700'
        }`}>
          {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
        </span>
        <button className="p-1.5 hover:bg-gray-200 rounded-lg transition">
          <MoreHorizontal size={16} className="text-gray-500" />
        </button>
      </div>
    </div>
  );
}

function RepaymentRow({ date, borrower, borrowerAvatar, loanId, amount, method, status, phone, transactionId, onClick }) {
  const statusConfig = {
    success: { color: "bg-green-100 text-green-700 border-green-200", label: "Success" },
    paid: { color: "bg-green-100 text-green-700 border-green-200", label: "Paid" },
    completed: { color: "bg-green-100 text-green-700 border-green-200", label: "Completed" },
    pending: { color: "bg-yellow-100 text-yellow-700 border-yellow-200", label: "Pending" },
    failed: { color: "bg-red-100 text-red-700 border-red-200", label: "Failed" }
  };

  const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;

  return (
    <tr className="hover:bg-gray-50/80 transition-colors group cursor-pointer" onClick={onClick}>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar size={14} className="text-gray-400" />
          <span className="text-sm">{date}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center text-white font-semibold text-xs">
            {borrowerAvatar}
          </div>
          <span className="text-sm font-medium text-gray-800">{borrower}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="font-mono text-sm text-gray-600">{loanId}</span>
      </td>
      <td className="px-6 py-4">
        <span className="font-semibold text-gray-800">{amount}</span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-gray-600">{method || 'N/A'}</span>
      </td>
      <td className="px-6 py-4">
        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${config.color}`}>
          {config.label}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-gray-600">{phone || 'N/A'}</span>
      </td>
      <td className="px-6 py-4">
        <span className="text-xs font-mono text-gray-500">{transactionId?.slice(0, 8)}...</span>
      </td>
      <td className="px-6 py-4">
        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition">
          <MoreHorizontal size={16} className="text-gray-500" />
        </button>
      </td>
    </tr>
  );
}

export default Repayments;