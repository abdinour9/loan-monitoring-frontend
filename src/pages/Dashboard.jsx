// src/pages/Dashboard.jsx
import {
  Users,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
  MoreHorizontal,
  Calendar,
  UserPlus,
  Loader,
  ChevronLeft,
  ChevronRight
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

const toNumber = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

function Dashboard() {
  const [timeframe, setTimeframe] = useState("week");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [payments, setPayments] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [loans, setLoans] = useState([]);
  const [users, setUsers] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, [timeframe, currentPage]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      console.log('📊 Fetching dashboard data...');

      // Fetch all data in parallel
      const [statsRes, loansRes, usersRes, paymentsRes, recentPaymentsRes] = await Promise.all([
        axios.get(`${API_URL}/loans/stats/overview`, { headers }).catch(err => ({ data: { success: false } })),
        axios.get(`${API_URL}/loans?limit=1000`, { headers }).catch(err => ({ data: { success: false } })),
        axios.get(`${API_URL}/users?limit=1000`, { headers }).catch(err => ({ data: { success: false } })),
        axios.get(`${API_URL}/payments/admin/all?limit=1000`, { headers }).catch(err => ({ data: { success: false } })),
        axios.get(`${API_URL}/payments/admin/all?page=${currentPage}&limit=10&sortBy=createdAt&sortOrder=desc`, { headers }).catch(err => ({ data: { success: false } }))
      ]);

      console.log('📊 Stats response:', statsRes.data);
      console.log('📊 Loans response:', loansRes.data);
      console.log('📊 Users response:', usersRes.data);
      console.log('📊 All payments response:', paymentsRes.data);
      console.log('📊 Recent payments response:', recentPaymentsRes.data);

      // Process payments data
      if (paymentsRes.data?.success) {
        setPayments(paymentsRes.data.data || []);
      }

      // Process recent payments with pagination
      if (recentPaymentsRes.data?.success) {
        setRecentPayments(recentPaymentsRes.data.data || []);
        setPagination(recentPaymentsRes.data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          pages: 1
        });
      }

      // Process loans
      if (loansRes.data?.success) {
        const allLoans = loansRes.data.data || [];
        
        // Create a map of payments by loan for quick lookup
        const paymentsByLoan = {};
        if (paymentsRes.data?.success) {
          paymentsRes.data.data.forEach(payment => {
            if (payment.status === 'success' || payment.status === 'completed') {
              const loanId = payment.loanId?.toString();
              if (loanId) {
                if (!paymentsByLoan[loanId]) {
                  paymentsByLoan[loanId] = [];
                }
                paymentsByLoan[loanId].push(payment);
              }
            }
          });
        }

        // Process loans with payment data
        const processedLoans = allLoans.map(loan => {
          const loanPayments = paymentsByLoan[loan._id?.toString()] || [];
          const totalPaid = loanPayments.reduce((sum, p) => sum + toNumber(p.amount), 0);
          
          return {
            ...loan,
            paidAmount: totalPaid,
            remainingAmount: toNumber(loan.amount) - totalPaid,
            payments: loanPayments
          };
        });
        
        setLoans(processedLoans);
      }

      // Set stats and users
      if (statsRes.data?.success) {
        setStats(statsRes.data.data);
      }

      if (usersRes.data?.success) {
        setUsers(usersRes.data.data);
      }

    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics from payments and loans
  const calculateMetrics = () => {
    if (!payments.length || !loans.length) return null;

    // Calculate total collected from successful payments
    const successfulPayments = payments.filter(p => p.status === 'success' || p.status === 'completed');
    const totalCollected = successfulPayments.reduce((sum, p) => sum + toNumber(p.amount), 0);
    
    // Calculate this month's collections
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthPayments = successfulPayments.filter(p => new Date(p.createdAt) >= startOfMonth);
    const thisMonthCollected = thisMonthPayments.reduce((sum, p) => sum + toNumber(p.amount), 0);

    // Calculate this week's collections
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const thisWeekPayments = successfulPayments.filter(p => new Date(p.createdAt) >= startOfWeek);
    const thisWeekCollected = thisWeekPayments.reduce((sum, p) => sum + toNumber(p.amount), 0);

    // Count on-time payments (paid before or on due date)
    const onTimePayments = successfulPayments.filter(p => {
      // This would need loan schedule data to be accurate
      return true; // Simplified for now
    }).length;

    // Calculate overdue stats
    const overdueLoans = loans.filter(l => l.status === 'overdue').length;
    const overdueAmount = loans
      .filter(l => l.status === 'overdue')
      .reduce((sum, l) => sum + (toNumber(l.amount) - toNumber(l.paidAmount)), 0);

    // Calculate collection rate
    const totalPortfolio = loans.reduce((sum, l) => sum + toNumber(l.amount), 0);
    const collectionRate = totalPortfolio > 0 ? (totalCollected / totalPortfolio) * 100 : 0;

    // User counts
    const totalUsers = users.length;
    const newUsersThisWeek = users.filter(u => {
      const created = new Date(u.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return created >= weekAgo;
    }).length;

    // Loan counts by status
    const activeLoans = loans.filter(l => l.status === 'active').length;
    const completedLoans = loans.filter(l => l.status === 'completed').length;
    const pendingLoans = loans.filter(l => l.status === 'pending').length;

    // Calculate amounts by status
    const activeAmount = loans
      .filter(l => l.status === 'active')
      .reduce((sum, l) => sum + toNumber(l.amount), 0);

    const completedAmount = loans
      .filter(l => l.status === 'completed')
      .reduce((sum, l) => sum + toNumber(l.amount), 0);

    // Calculate average loan size
    const avgLoanSize = loans.length > 0 ? totalPortfolio / loans.length : 0;

    // Weekly chart data
    const weeklyData = generateWeeklyData();

    return {
      totalUsers,
      newUsersThisWeek,
      totalCollected,
      thisMonthCollected,
      thisWeekCollected,
      onTimePayments: successfulPayments.length,
      totalPayments: payments.length,
      overdueLoans,
      overdueAmount,
      collectionRate,
      activeLoans,
      activeAmount,
      completedLoans,
      completedAmount,
      pendingLoans,
      avgLoanSize,
      weeklyData
    };
  };

  // Generate weekly chart data
  const generateWeeklyData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    // Get successful payments from last 7 days
    const recentSuccessfulPayments = payments.filter(p => 
      (p.status === 'success' || p.status === 'completed') && 
      new Date(p.createdAt) >= weekAgo
    );
    
    return days.map((day, index) => {
      // Filter payments from this day of week
      const dayPayments = recentSuccessfulPayments.filter(p => {
        const paymentDate = new Date(p.createdAt);
        return paymentDate.getDay() === index;
      });
      
      const collected = dayPayments.reduce((sum, p) => sum + toNumber(p.amount), 0);
      
      // For disbursed, use loans created on that day
      const dayLoans = loans.filter(l => {
        const loanDate = new Date(l.createdAt);
        return loanDate >= weekAgo && loanDate.getDay() === index;
      });
      
      const disbursed = dayLoans.reduce((sum, l) => sum + toNumber(l.amount), 0);
      
      // Scale for visualization
      const maxAmount = Math.max(disbursed, collected, 1000);
      
      return {
        day,
        disbursed: maxAmount > 0 ? (disbursed / maxAmount) * 100 : 0,
        collected: maxAmount > 0 ? (collected / maxAmount) * 100 : 0,
        actualDisbursed: disbursed,
        actualCollected: collected
      };
    });
  };

  const metrics = calculateMetrics();

  // Handle export to Excel
  const handleExport = async () => {
    setExporting(true);
    try {
      const wb = XLSX.utils.book_new();
      
      // Dashboard Summary Sheet
      const summaryData = [
        ['Dashboard Summary', new Date().toLocaleDateString()],
        [''],
        ['Metric', 'Value'],
        ['Total Users', metrics?.totalUsers || 0],
        ['New Users (This Week)', metrics?.newUsersThisWeek || 0],
        ['Total Collected', formatCurrency(metrics?.totalCollected || 0)],
        ['This Month', formatCurrency(metrics?.thisMonthCollected || 0)],
        ['This Week', formatCurrency(metrics?.thisWeekCollected || 0)],
        ['Collection Rate', `${(metrics?.collectionRate || 0).toFixed(1)}%`],
        ['Active Loans', `${metrics?.activeLoans || 0} (${formatCurrency(metrics?.activeAmount || 0)})`],
        ['Overdue Loans', `${metrics?.overdueLoans || 0} (${formatCurrency(metrics?.overdueAmount || 0)})`],
        ['Completed Loans', `${metrics?.completedLoans || 0} (${formatCurrency(metrics?.completedAmount || 0)})`],
        ['Pending Loans', metrics?.pendingLoans || 0],
        ['Average Loan Size', formatCurrency(metrics?.avgLoanSize || 0)]
      ];
      
      const ws = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, ws, "Dashboard Summary");
      
      // Recent Payments Sheet
      const paymentsData = recentPayments.map(p => ({
        'Date': formatDate(p.createdAt),
        'Borrower': p.userId?.name || 'N/A',
        'Loan ID': p.loanId_display || p.loanId,
        'Amount': formatCurrency(p.amount),
        'Method': p.paymentMethod,
        'Phone': p.phoneNumber,
        'Status': p.status,
        'Transaction ID': p.transactionId
      }));
      
      const ws2 = XLSX.utils.json_to_sheet(paymentsData);
      XLSX.utils.book_append_sheet(wb, ws2, "Recent Payments");
      
      // Save file
      XLSX.writeFile(wb, `dashboard_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Dashboard exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export dashboard');
    } finally {
      setExporting(false);
    }
  };

  // Handle payment click navigation
  const handlePaymentClick = (loanId) => {
    if (loanId) {
      navigate(`/loans/${loanId}`);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader className="animate-spin text-emerald-600 mx-auto mb-4" size={40} />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">
            Dashboard Overview
          </h1>
          <p className="text-gray-600 mt-1.5 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Real-time loan performance and system metrics
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
            {["day", "week", "month"].map((period) => (
              <button
                key={period}
                onClick={() => setTimeframe(period)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all capitalize ${
                  timeframe === period
                    ? "bg-green-600 text-white shadow-sm shadow-green-600/30"
                    : "text-gray-600 hover:text-green-600 hover:bg-green-50"
                }`}
              >
                {period}
              </button>
            ))}
          </div>
          
          {/* Export Button */}
          <button 
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:border-green-500 hover:text-green-600 hover:bg-green-50 transition-all shadow-sm disabled:opacity-50"
          >
            {exporting ? <Loader className="animate-spin" size={18} /> : <Download size={18} />}
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={metrics?.totalUsers?.toLocaleString() || "0"}
          trend={`+${metrics?.newUsersThisWeek || 0} this week`}
          trendUp={true}
          icon={<Users size={22} />}
          color="green"
        />
        <StatCard
          title="Total Collected"
          value={formatCurrency(metrics?.totalCollected || 0)}
          subtitle={`${metrics?.totalPayments || 0} payments`}
          trend={`${(metrics?.collectionRate || 0).toFixed(1)}% of portfolio`}
          trendUp={true}
          icon={<DollarSign size={22} />}
          color="emerald"
        />
        <StatCard
          title="Overdue Loans"
          value={metrics?.overdueLoans?.toString() || "0"}
          subtitle={formatCurrency(metrics?.overdueAmount || 0)}
          trend={metrics?.overdueLoans > 0 ? `${metrics.overdueLoans} loans` : "0 overdue"}
          trendUp={false}
          icon={<AlertTriangle size={22} />}
          color="orange"
        />
        <StatCard
          title="This Month"
          value={formatCurrency(metrics?.thisMonthCollected || 0)}
          subtitle={`${metrics?.thisWeekCollected ? formatCurrency(metrics.thisWeekCollected) : '$0'} this week`}
          trend="Current period"
          trendUp={true}
          icon={<Calendar size={22} />}
          color="green"
        />
      </div>

      {/* Charts & Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Loan Performance Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <TrendingUp size={20} className="text-green-600" />
                Collections vs Disbursements (Last 7 Days)
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Daily collection and loan disbursement amounts
              </p>
            </div>
          </div>
          
          <div className="h-48 flex items-end justify-between gap-2">
            {metrics?.weeklyData?.map((data, i) => (
              <div key={data.day} className="flex flex-col items-center gap-2 w-full">
                <div className="w-full flex justify-center gap-1">
                  <div 
                    className="w-3 bg-green-500 rounded-t-sm transition-all duration-500" 
                    style={{ height: `${Math.max(data.disbursed, 5)}px` }}
                    title={`Disbursed: ${formatCurrency(data.actualDisbursed)}`}
                  />
                  <div 
                    className="w-3 bg-green-200 rounded-t-sm transition-all duration-500" 
                    style={{ height: `${Math.max(data.collected, 5)}px` }}
                    title={`Collected: ${formatCurrency(data.actualCollected)}`}
                  />
                </div>
                <span className="text-xs text-gray-500">{data.day}</span>
              </div>
            ))}
          </div>
          
          <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
              <span className="text-xs text-gray-600">Disbursed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-200 rounded-sm"></div>
              <span className="text-xs text-gray-600">Collected</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock size={20} className="text-green-600" />
            Quick Overview
          </h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg">
                  <CreditCard size={18} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Loans</p>
                  <p className="font-semibold text-gray-800">{metrics?.activeLoans || 0} loans</p>
                </div>
              </div>
              <span className="text-sm font-medium text-green-600">
                {formatCurrency(metrics?.activeAmount || 0)}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg">
                  <Users size={18} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">New Users</p>
                  <p className="font-semibold text-gray-800">+{metrics?.newUsersThisWeek || 0} this week</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/users')}
                className="text-green-600 hover:text-green-700"
              >
                <UserPlus size={18} />
              </button>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg">
                  <CheckCircle size={18} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Completed Loans</p>
                  <p className="font-semibold text-gray-800">{metrics?.completedLoans || 0} loans</p>
                </div>
              </div>
              <span className="text-sm font-medium text-green-600">
                {formatCurrency(metrics?.completedAmount || 0)}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg">
                  <AlertTriangle size={18} className="text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending Loans</p>
                  <p className="font-semibold text-gray-800">{metrics?.pendingLoans || 0} waiting</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/loans?status=pending')}
                className="text-orange-600 hover:text-orange-700 text-xs"
              >
                Review
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Payments Section - Using Repayments table style */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <DollarSign size={20} className="text-green-600" />
                Recent Repayment Activity
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Latest payments received from borrowers
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/repayments')}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
              >
                <Filter size={16} />
                View All Payments
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-600">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Borrower</th>
                <th className="px-6 py-4">Loan ID</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentPayments.map((payment) => (
                <PaymentRow 
                  key={payment._id}
                  date={formatDate(payment.createdAt)}
                  borrower={payment.userId?.name || 'Unknown'}
                  borrowerAvatar={getInitials(payment.userId?.name)}
                  loanId={payment.loanId_display || payment.loanId}
                  amount={formatCurrency(payment.amount)}
                  method={payment.paymentMethod}
                  status={payment.status}
                  phone={payment.phoneNumber}
                  onClick={() => handlePaymentClick(payment.loanId)}
                />
              ))}
              {recentPayments.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
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
        
        {pagination.pages <= 1 && (
          <div className="p-6 border-t border-gray-100 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Showing {recentPayments.length} of {pagination.total} payments
            </p>
            <button 
              onClick={() => navigate('/repayments')}
              className="text-sm font-medium text-green-600 hover:text-green-700 flex items-center gap-1"
            >
              View All Payments
              <ArrowUpRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// StatCard Component
function StatCard({ title, value, subtitle, trend, trendUp, icon, color = "green" }) {
  const colorVariants = {
    green: "bg-green-50 text-green-700 border-green-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
  };

  return (
    <div className="group bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 rounded-xl ${colorVariants[color]}`}>
          {icon}
        </div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-xs font-medium px-2 py-1 rounded-full ${
            trendUp 
              ? "bg-green-50 text-green-700" 
              : "bg-orange-50 text-orange-700"
          }`}>
            {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trend}
          </span>
        )}
      </div>
      
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-bold text-gray-800">
            {value}
          </h3>
          {subtitle && (
            <span className="text-xs text-gray-500">{subtitle}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// Payment Row Component (from Repayments page)
function PaymentRow({ date, borrower, borrowerAvatar, loanId, amount, method, status, phone, onClick }) {
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
        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition">
          <MoreHorizontal size={16} className="text-gray-500" />
        </button>
      </td>
    </tr>
  );
}

export default Dashboard;