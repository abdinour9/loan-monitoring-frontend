// src/pages/Broadcast.jsx
import { useState, useEffect } from "react";
import { 
  Send, 
  Mail, 
  Smartphone, 
  Users as UsersIcon, 
  UserCheck,
  User,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  Filter,
  Clock,
  MessageSquare,
  Shield,
  Calendar,
  Tag,
  TrendingUp,
  Zap,
  RefreshCw,
  XCircle,
  AlertTriangle,
  Phone,
  Mail as MailIcon,
  AlertOctagon,
  FileText,
  CalendarDays
} from "lucide-react";
import toast from "react-hot-toast";
import { broadcastApi } from "../services/broadcastApi";
import { loanApi } from "../services/loanApi";

function Broadcast() {
  const [activeTab, setActiveTab] = useState("message");
  const [selectedRoles, setSelectedRoles] = useState({
    borrowers: true,
    guarantors: true,
    admins: false
  });
  const [sendVia, setSendVia] = useState({
    email: true,
    sms: true
  });
  const [messageData, setMessageData] = useState({
    subject: "",
    content: "",
    scheduleDate: "",
    scheduleTime: ""
  });
  const [isSending, setIsSending] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [recipientCount, setRecipientCount] = useState(null);
  const [broadcastHistory, setBroadcastHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [smsBalance, setSmsBalance] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Overdue & Due Loans State
  const [dueLoans, setDueLoans] = useState([]);
  const [loadingDue, setLoadingDue] = useState(false);
  const [selectedDueLoans, setSelectedDueLoans] = useState([]);
  const [selectAllDue, setSelectAllDue] = useState(false);
  const [dueFilter, setDueFilter] = useState("overdue"); // overdue, due_today, due_week, due_month
  const [sendingToDue, setSendingToDue] = useState(false);
  const [includeGuarantors, setIncludeGuarantors] = useState(true);

  // Fetch broadcast history
  useEffect(() => {
    if (activeTab === "history") {
      fetchBroadcastHistory();
    }
  }, [activeTab, pagination.page]);

  // Fetch SMS balance
  useEffect(() => {
    fetchSmsBalance();
  }, []);

  // Fetch due loans when tab or filter changes
  useEffect(() => {
    if (activeTab === "due") {
      fetchDueLoans();
    }
  }, [activeTab, dueFilter]);

  // Fetch recipient count for message tab
  useEffect(() => {
    if (activeTab === "message") {
      fetchRecipientCount();
    }
  }, [selectedRoles, activeTab]);

  // Handle select all
  useEffect(() => {
    if (selectAllDue) {
      setSelectedDueLoans(dueLoans.map(loan => loan._id));
    } else {
      setSelectedDueLoans([]);
    }
  }, [selectAllDue, dueLoans]);

  const fetchBroadcastHistory = async () => {
    setLoading(true);
    try {
      const response = await broadcastApi.getBroadcastHistory(pagination.page, pagination.limit);
      if (response.success) {
        setBroadcastHistory(response.data);
        setPagination({
          ...pagination,
          total: response.pagination.total,
          pages: response.pagination.pages
        });
      } else {
        toast.error(response.message || "Failed to fetch broadcast history");
      }
    } catch (error) {
      console.error("Error fetching history:", error);
      toast.error("Failed to load broadcast history");
    } finally {
      setLoading(false);
    }
  };

  const fetchDueLoans = async () => {
    setLoadingDue(true);
    try {
      const response = await loanApi.getLoansWithProgress(1, 500);
      if (response.success) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const sevenDaysFromNow = new Date(today);
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        
        const thirtyDaysFromNow = new Date(today);
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        
        // Process each loan to calculate due status
        let processedLoans = response.data.map(loan => {
          const schedule = loan.schedule || [];
          
          // Sort schedule by due date
          const sortedSchedule = [...schedule].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
          
          // Find the next pending installment
          const nextInstallment = sortedSchedule.find(i => i.status === 'pending');
          
          let dueStatus = 'up_to_date';
          let daysUntilDue = null;
          let overdueDays = 0;
          
          if (nextInstallment) {
            const dueDate = new Date(nextInstallment.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            
            if (dueDate < today) {
              // Overdue
              dueStatus = 'overdue';
              overdueDays = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
            } else if (dueDate.getTime() === today.getTime()) {
              // Due today
              dueStatus = 'due_today';
              daysUntilDue = 0;
            } else if (dueDate <= sevenDaysFromNow) {
              // Due within 7 days
              dueStatus = 'due_week';
              daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            } else if (dueDate <= thirtyDaysFromNow) {
              // Due within 30 days
              dueStatus = 'due_month';
              daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            } else {
              daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            }
          }
          
          return {
            ...loan,
            nextInstallment,
            dueStatus,
            daysUntilDue,
            overdueDays,
            nextDueAmount: nextInstallment?.amount || 0,
            nextDueDate: nextInstallment?.dueDate || null
          };
        });
        
        // Filter based on selected filter
        if (dueFilter === 'overdue') {
          processedLoans = processedLoans.filter(l => l.dueStatus === 'overdue');
        } else if (dueFilter === 'due_today') {
          processedLoans = processedLoans.filter(l => l.dueStatus === 'due_today');
        } else if (dueFilter === 'due_week') {
          processedLoans = processedLoans.filter(l => l.dueStatus === 'due_week');
        } else if (dueFilter === 'due_month') {
          processedLoans = processedLoans.filter(l => l.dueStatus === 'due_month');
        }
        
        setDueLoans(processedLoans);
      }
    } catch (error) {
      console.error("Error fetching due loans:", error);
      toast.error("Failed to load due loans");
    } finally {
      setLoadingDue(false);
    }
  };

  const fetchRecipientCount = async () => {
    const targetRoles = Object.keys(selectedRoles).filter(role => selectedRoles[role]);
    if (targetRoles.length === 0) {
      setRecipientCount(0);
      return;
    }
    try {
      const response = await broadcastApi.getRecipientCount(targetRoles, {});
      if (response.success) {
        setRecipientCount(response.data.total);
      }
    } catch (error) {
      console.error("Error fetching recipient count:", error);
    }
  };

  const fetchSmsBalance = async () => {
    setLoadingBalance(true);
    try {
      const response = await broadcastApi.getSmsBalance();
      if (response.success) {
        setSmsBalance(response.data);
        if (response.data.balance < 100) {
          toast.warning(`Low SMS balance: ${response.data.balance} SMS remaining`, {
            duration: 5000,
            icon: '⚠️'
          });
        }
      }
    } catch (error) {
      console.error("Error fetching SMS balance:", error);
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageData.content.trim()) {
      toast.error("Please enter a message content");
      return;
    }
    if (sendVia.email && !messageData.subject.trim()) {
      toast.error("Please enter a subject for email");
      return;
    }
    if (!sendVia.email && !sendVia.sms) {
      toast.error("Please select at least one delivery method (Email or SMS)");
      return;
    }
    const targetRoles = Object.keys(selectedRoles).filter(role => selectedRoles[role]);
    if (targetRoles.length === 0) {
      toast.error("Please select at least one recipient role");
      return;
    }
    if (recipientCount === 0) {
      toast.error("No recipients found for selected roles");
      return;
    }
    if (sendVia.sms && smsBalance && smsBalance.balance < recipientCount) {
      const confirmLowBalance = window.confirm(
        `⚠️ Warning: You only have ${smsBalance.balance} SMS credits but trying to send to ${recipientCount} recipients.\n\nDo you want to proceed?`
      );
      if (!confirmLowBalance) return;
    }
    const confirmSend = window.confirm(
      `📨 You are about to send a message to ${recipientCount} recipient(s) via ${sendVia.email ? "Email" : ""}${sendVia.email && sendVia.sms ? " and " : ""}${sendVia.sms ? "SMS" : ""}.\n\nAre you sure you want to proceed?`
    );
    if (!confirmSend) return;

    setIsSending(true);
    const loadingToast = toast.loading("Sending broadcast message...");

    try {
      const broadcastData = {
        subject: messageData.subject,
        content: messageData.content,
        targetRoles: targetRoles,
        channels: Object.keys(sendVia).filter(channel => sendVia[channel]),
        scheduledFor: messageData.scheduleDate && messageData.scheduleTime 
          ? `${messageData.scheduleDate}T${messageData.scheduleTime}`
          : null
      };
      const response = await broadcastApi.sendBroadcast(broadcastData);
      if (response.success) {
        toast.dismiss(loadingToast);
        toast.success(`🎉 ${response.message}`);
        setMessageData({ subject: "", content: "", scheduleDate: "", scheduleTime: "" });
        setPreviewMode(false);
        fetchSmsBalance();
        setTimeout(() => {
          setActiveTab("history");
          setPagination({ ...pagination, page: 1 });
          fetchBroadcastHistory();
        }, 2000);
      } else {
        toast.dismiss(loadingToast);
        toast.error(response.message || "Failed to send broadcast");
      }
    } catch (error) {
      console.error("Error sending broadcast:", error);
      toast.dismiss(loadingToast);
      toast.error("Failed to send broadcast. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendToDue = async () => {
    if (selectedDueLoans.length === 0) {
      toast.error("Please select at least one loan");
      return;
    }
    if (!messageData.content.trim()) {
      toast.error("Please enter a message content");
      return;
    }
    if (sendVia.email && !messageData.subject.trim()) {
      toast.error("Please enter a subject for email");
      return;
    }

    const loadingToast = toast.loading(`Sending messages to ${selectedDueLoans.length} loan(s)...`);
    setSendingToDue(true);

    try {
      let totalRecipients = 0;
      let successCount = 0;

      for (const loanId of selectedDueLoans) {
        const loan = dueLoans.find(l => l._id === loanId);
        if (!loan) continue;

        // Send to borrower
        if (loan.borrower?.id) {
          let personalizedContent = messageData.content;
          let personalizedSubject = messageData.subject;
          
          // Replace variables
          personalizedContent = personalizedContent
            .replace(/{borrower_name}/g, loan.borrower.name || "Valued Customer")
            .replace(/{loan_id}/g, loan.loanId)
            .replace(/{due_amount}/g, formatCurrency(loan.nextDueAmount))
            .replace(/{days_until_due}/g, loan.daysUntilDue !== null ? loan.daysUntilDue : 0)
            .replace(/{overdue_days}/g, loan.overdueDays || 0);

          personalizedSubject = personalizedSubject
            .replace(/{borrower_name}/g, loan.borrower.name || "Valued Customer")
            .replace(/{loan_id}/g, loan.loanId);

          const borrowerData = {
            subject: personalizedSubject,
            content: personalizedContent,
            targetRoles: ["borrowers"],
            channels: Object.keys(sendVia).filter(ch => sendVia[ch]),
            scheduledFor: null
          };

          const response = await broadcastApi.sendBroadcast(borrowerData);
          if (response.success) successCount++;
          totalRecipients++;
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Send to guarantor if enabled
        if (includeGuarantors && loan.guarantor?.hasGuarantor && loan.guarantor?.id) {
          let personalizedContent = messageData.content;
          let personalizedSubject = messageData.subject;
          
          personalizedContent = personalizedContent
            .replace(/{borrower_name}/g, loan.borrower?.name || "the borrower")
            .replace(/{guarantor_name}/g, loan.guarantor.name || "Guarantor")
            .replace(/{loan_id}/g, loan.loanId)
            .replace(/{due_amount}/g, formatCurrency(loan.nextDueAmount))
            .replace(/{days_until_due}/g, loan.daysUntilDue !== null ? loan.daysUntilDue : 0)
            .replace(/{overdue_days}/g, loan.overdueDays || 0);

          personalizedSubject = personalizedSubject
            .replace(/{borrower_name}/g, loan.guarantor.name || "Guarantor")
            .replace(/{loan_id}/g, loan.loanId);

          const guarantorData = {
            subject: personalizedSubject,
            content: personalizedContent,
            targetRoles: ["guarantors"],
            channels: Object.keys(sendVia).filter(ch => sendVia[ch]),
            scheduledFor: null
          };

          const response = await broadcastApi.sendBroadcast(guarantorData);
          if (response.success) successCount++;
          totalRecipients++;
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      toast.dismiss(loadingToast);
      toast.success(`✅ Sent to ${successCount}/${totalRecipients} recipients`);
      setSelectedDueLoans([]);
      setSelectAllDue(false);
      fetchDueLoans();
      
    } catch (error) {
      console.error("Error sending to due loans:", error);
      toast.dismiss(loadingToast);
      toast.error("Failed to send messages to some recipients");
    } finally {
      setSendingToDue(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    });
  };

  const getDueStatusBadge = (status, daysUntilDue, overdueDays) => {
    if (status === 'overdue') {
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          overdueDays > 30 ? "bg-red-100 text-red-700" :
          overdueDays > 15 ? "bg-orange-100 text-orange-700" :
          "bg-yellow-100 text-yellow-700"
        }`}>
          <AlertCircle size={12} />
          {overdueDays} days overdue
        </span>
      );
    } else if (status === 'due_today') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
          <CalendarDays size={12} />
          Due Today
        </span>
      );
    } else if (status === 'due_week') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
          <Clock size={12} />
          {daysUntilDue} days left
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <CheckCircle size={12} />
          {daysUntilDue} days left
        </span>
      );
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      sent: { color: "text-green-600", bg: "bg-green-100", icon: CheckCircle, label: "Sent" },
      scheduled: { color: "text-blue-600", bg: "bg-blue-100", icon: Clock, label: "Scheduled" },
      sending: { color: "text-yellow-600", bg: "bg-yellow-100", icon: Loader2, label: "Sending..." },
      failed: { color: "text-red-600", bg: "bg-red-100", icon: XCircle, label: "Failed" },
      partial: { color: "text-orange-600", bg: "bg-orange-100", icon: AlertCircle, label: "Partial" }
    };
    const config = statusConfig[status] || statusConfig.sent;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 ${config.bg} ${config.color} rounded-lg text-xs font-medium`}>
        <Icon size={12} className={status === "sending" ? "animate-spin" : ""} />
        {config.label}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 bg-gradient-to-r from-green-50 to-white rounded-2xl p-8 border border-green-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <Send className="w-6 h-6 text-white" />
              </div>
              Broadcast Messaging
            </h1>
            <p className="text-gray-600 mt-2 ml-1">
              Send notifications to borrowers, guarantors, or admins via Email and SMS
            </p>
          </div>
          <div className="hidden md:block">
            {smsBalance && (
              <div className={`rounded-full px-4 py-2 ${smsBalance.balance < 100 ? 'bg-orange-100' : 'bg-green-100'}`}>
                <span className={`text-sm font-medium flex items-center gap-2 ${smsBalance.balance < 100 ? 'text-orange-700' : 'text-green-700'}`}>
                  <Smartphone size={16} />
                  SMS Balance: {smsBalance.balance} {smsBalance.accountType}
                  <button onClick={fetchSmsBalance} className="ml-2 hover:opacity-70">
                    <RefreshCw size={14} className={loadingBalance ? "animate-spin" : ""} />
                  </button>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-8 bg-white rounded-xl p-1.5 shadow-sm border border-gray-100 w-fit flex-wrap">
        <button
          onClick={() => setActiveTab("message")}
          className={`px-5 py-2.5 font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${
            activeTab === "message"
              ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md"
              : "text-gray-600 hover:text-green-600 hover:bg-green-50"
          }`}
        >
          <MessageSquare size={18} />
          New Message
        </button>
        <button
          onClick={() => setActiveTab("due")}
          className={`px-5 py-2.5 font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${
            activeTab === "due"
              ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md"
              : "text-gray-600 hover:text-orange-600 hover:bg-orange-50"
          }`}
        >
          <CalendarDays size={18} />
          Due & Overdue Loans
          {dueLoans.filter(l => l.dueStatus === 'overdue').length > 0 && (
            <span className="ml-1 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">
              {dueLoans.filter(l => l.dueStatus === 'overdue').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-5 py-2.5 font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${
            activeTab === "history"
              ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md"
              : "text-gray-600 hover:text-green-600 hover:bg-green-50"
          }`}
        >
          <Clock size={18} />
          Broadcast History
          {pagination.total > 0 && (
            <span className="ml-1 text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
              {pagination.total}
            </span>
          )}
        </button>
      </div>

      {/* New Message Tab */}
      {activeTab === "message" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <MessageSquare size={20} />
                  Message Content
                </h3>
              </div>
              <div className="p-6">
                {sendVia.email && (
                  <div className="mb-5">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Subject (for Email)</label>
                    <input
                      type="text"
                      value={messageData.subject}
                      onChange={(e) => setMessageData({...messageData, subject: e.target.value})}
                      placeholder="Enter email subject..."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Message Content</label>
                  <textarea
                    value={messageData.content}
                    onChange={(e) => setMessageData({...messageData, content: e.target.value})}
                    rows={8}
                    placeholder="Type your message here... (SMS will be limited to 160 characters per message)"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <div className="mt-3 flex justify-between text-sm">
                    <span className="text-gray-500">Characters: {messageData.content.length}</span>
                    {sendVia.sms && (
                      <span className={messageData.content.length > 160 ? "text-orange-500" : "text-gray-500"}>
                        SMS Segments: {Math.ceil(messageData.content.length / 160)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Available variables: {"{borrower_name}"}, {"{guarantor_name}"}, {"{loan_id}"}
                  </p>
                </div>
                <div className="mt-6 pt-5 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Schedule Delivery (Optional)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="date"
                      value={messageData.scheduleDate}
                      onChange={(e) => setMessageData({...messageData, scheduleDate: e.target.value})}
                      className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="time"
                      value={messageData.scheduleTime}
                      onChange={(e) => setMessageData({...messageData, scheduleTime: e.target.value})}
                      className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Send size={20} />
                  Delivery Methods
                </h3>
              </div>
              <div className="p-6">
                <div className="flex gap-8">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendVia.email}
                      onChange={(e) => setSendVia({...sendVia, email: e.target.checked})}
                      className="w-5 h-5 text-green-500 rounded focus:ring-green-500"
                    />
                    <span className="text-gray-700 font-medium">Email</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendVia.sms}
                      onChange={(e) => setSendVia({...sendVia, sms: e.target.checked})}
                      className="w-5 h-5 text-green-500 rounded focus:ring-green-500"
                    />
                    <span className="text-gray-700 font-medium">SMS</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <UsersIcon size={20} />
                  Select Recipients
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-4 bg-blue-50 rounded-xl cursor-pointer hover:bg-blue-100 transition">
                    <div>
                      <span className="text-gray-800 font-medium">Borrowers</span>
                      <p className="text-xs text-gray-500">All loan borrowers</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedRoles.borrowers}
                      onChange={(e) => setSelectedRoles({...selectedRoles, borrowers: e.target.checked})}
                      className="w-5 h-5 text-green-500 rounded focus:ring-green-500"
                    />
                  </label>
                  <label className="flex items-center justify-between p-4 bg-green-50 rounded-xl cursor-pointer hover:bg-green-100 transition">
                    <div>
                      <span className="text-gray-800 font-medium">Guarantors</span>
                      <p className="text-xs text-gray-500">Loan guarantors</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedRoles.guarantors}
                      onChange={(e) => setSelectedRoles({...selectedRoles, guarantors: e.target.checked})}
                      className="w-5 h-5 text-green-500 rounded focus:ring-green-500"
                    />
                  </label>
                  <label className="flex items-center justify-between p-4 bg-purple-50 rounded-xl cursor-pointer hover:bg-purple-100 transition">
                    <div>
                      <span className="text-gray-800 font-medium">Admins</span>
                      <p className="text-xs text-gray-500">System administrators</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedRoles.admins}
                      onChange={(e) => setSelectedRoles({...selectedRoles, admins: e.target.checked})}
                      className="w-5 h-5 text-green-500 rounded focus:ring-green-500"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl border border-green-200 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold">Summary</h3>
                  <button
                    onClick={() => setPreviewMode(!previewMode)}
                    className="text-sm text-white/90 hover:text-white bg-white/20 px-3 py-1 rounded-lg"
                  >
                    {previewMode ? "Hide Preview" : "Show Preview"}
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm mb-3">
                  <span className="text-gray-600">Recipients</span>
                  <span className="text-green-600 font-bold text-2xl">{recipientCount || 0}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm">
                  <span className="text-gray-600">Delivery via</span>
                  <div className="flex gap-2">
                    {sendVia.email && <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm">📧 Email</span>}
                    {sendVia.sms && <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm">📱 SMS</span>}
                  </div>
                </div>
                {previewMode && messageData.content && (
                  <div className="mt-5 p-4 bg-white rounded-xl border border-gray-200">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{messageData.content}</p>
                    {sendVia.email && messageData.subject && (
                      <p className="text-xs text-gray-500 mt-2">Subject: {messageData.subject}</p>
                    )}
                  </div>
                )}
                <button
                  onClick={handleSendMessage}
                  disabled={isSending || recipientCount === 0}
                  className="w-full mt-5 bg-gradient-to-r from-green-500 to-green-600 text-white py-3.5 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
                >
                  {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                  {isSending ? "Sending..." : "Send Message"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Due & Overdue Loans Tab */}
      {activeTab === "due" && (
        <div className="space-y-6">
          {/* Message Content */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <MessageSquare size={20} />
                Message Content
              </h3>
            </div>
            <div className="p-6">
              {sendVia.email && (
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Subject (for Email)</label>
                  <input
                    type="text"
                    value={messageData.subject}
                    onChange={(e) => setMessageData({...messageData, subject: e.target.value})}
                    placeholder="Enter email subject..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Message Content</label>
                <textarea
                  value={messageData.content}
                  onChange={(e) => setMessageData({...messageData, content: e.target.value})}
                  rows={6}
                  placeholder="Type your message here... Use variables: {borrower_name}, {loan_id}, {due_amount}, {days_until_due}, {overdue_days}"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Available variables: {"{borrower_name}"}, {"{guarantor_name}"}, {"{loan_id}"}, {"{due_amount}"}, {"{days_until_due}"}, {"{overdue_days}"}
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Methods */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Send size={20} />
                Delivery Methods
              </h3>
            </div>
            <div className="p-6">
              <div className="flex gap-8">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendVia.email}
                    onChange={(e) => setSendVia({...sendVia, email: e.target.checked})}
                    className="w-5 h-5 text-green-500 rounded"
                  />
                  <span className="text-gray-700 font-medium">Email</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendVia.sms}
                    onChange={(e) => setSendVia({...sendVia, sms: e.target.checked})}
                    className="w-5 h-5 text-green-500 rounded"
                  />
                  <span className="text-gray-700 font-medium">SMS</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeGuarantors}
                    onChange={(e) => setIncludeGuarantors(e.target.checked)}
                    className="w-5 h-5 text-purple-500 rounded"
                  />
                  <span className="text-gray-700 font-medium">Include Guarantors</span>
                </label>
              </div>
            </div>
          </div>

          {/* Filter and Loans List */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <CalendarDays size={20} />
                  Loans ({dueLoans.length})
                </h3>
                <div className="flex gap-2">
                  <select
                    value={dueFilter}
                    onChange={(e) => setDueFilter(e.target.value)}
                    className="px-3 py-1.5 bg-white/20 text-white rounded-lg text-sm border border-white/30"
                  >
                    <option value="overdue">Overdue Only</option>
                    <option value="due_today">Due Today</option>
                    <option value="due_week">Due Within 7 Days</option>
                    <option value="due_month">Due Within 30 Days</option>
                  </select>
                  <button onClick={fetchDueLoans} className="px-3 py-1.5 bg-white/20 text-white rounded-lg text-sm hover:bg-white/30">
                    <RefreshCw size={14} className={loadingDue ? "animate-spin" : ""} />
                  </button>
                </div>
              </div>
            </div>
            
            {loadingDue ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={40} className="animate-spin text-orange-500" />
              </div>
            ) : dueLoans.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={40} className="text-green-500" />
                </div>
                <p className="text-gray-600 font-medium">No loans found</p>
                <p className="text-gray-400 text-sm mt-1">All loans are up to date!</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left w-10">
                          <input
                            type="checkbox"
                            checked={selectAllDue}
                            onChange={(e) => setSelectAllDue(e.target.checked)}
                            className="w-4 h-4 text-orange-500 rounded"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Loan ID</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Borrower</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Next Due Date</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Due Amount</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Remaining</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {dueLoans.map((loan) => (
                        <tr key={loan._id} className="hover:bg-orange-50 transition">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedDueLoans.includes(loan._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedDueLoans([...selectedDueLoans, loan._id]);
                                } else {
                                  setSelectedDueLoans(selectedDueLoans.filter(id => id !== loan._id));
                                }
                              }}
                              className="w-4 h-4 text-orange-500 rounded"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-sm">{loan.loanId}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{loan.borrower?.name}</div>
                            <div className="text-xs text-gray-500">{loan.borrower?.phone}</div>
                          </td>
                          <td className="px-4 py-3">
                            {loan.nextDueDate ? (
                              <div>
                                <div className="text-sm">{formatDate(loan.nextDueDate)}</div>
                                {loan.daysUntilDue !== null && loan.daysUntilDue > 0 && (
                                  <div className="text-xs text-gray-500">in {loan.daysUntilDue} days</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">N/A</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-gray-900">{formatCurrency(loan.nextDueAmount)}</span>
                          </td>
                          <td className="px-4 py-3">
                            {getDueStatusBadge(loan.dueStatus, loan.daysUntilDue, loan.overdueDays)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm">{formatCurrency(loan.remainingAmount)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Selected: {selectedDueLoans.length} of {dueLoans.length} loans
                  </div>
                  <button
                    onClick={handleSendToDue}
                    disabled={sendingToDue || selectedDueLoans.length === 0}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2 rounded-xl font-semibold disabled:opacity-50 flex items-center gap-2"
                  >
                    {sendingToDue ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        Send to Selected ({selectedDueLoans.length})
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Broadcast History Tab */}
      {activeTab === "history" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={40} className="animate-spin text-green-500" />
            </div>
          ) : broadcastHistory.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={40} className="text-green-500" />
              </div>
              <p className="text-gray-600 font-medium">No broadcast history yet</p>
              <p className="text-gray-400 text-sm mt-1">Send your first message using the New Message tab</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-green-50 to-white border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Subject</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Recipients</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Via</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Target Roles</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Sent At</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {broadcastHistory.map((broadcast) => (
                      <tr key={broadcast._id} className="hover:bg-green-50 transition">
                        <td className="px-6 py-4">
                          <div className="text-gray-900 font-medium">{broadcast.subject}</div>
                          <div className="text-gray-500 text-sm truncate max-w-xs">{broadcast.message?.substring(0, 100)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-900 font-semibold">{broadcast.recipientCount}</span>
                          {broadcast.successCount !== undefined && (
                            <div className="text-xs text-gray-500">
                              ✅ {broadcast.successCount} sent
                              {broadcast.failedCount > 0 && ` | ❌ ${broadcast.failedCount} failed`}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1.5">
                            {broadcast.channels?.includes("email") && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                                <Mail size={12} /> Email
                              </span>
                            )}
                            {broadcast.channels?.includes("sms") && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                                <Smartphone size={12} /> SMS
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1.5">
                            {broadcast.targetRoles?.map((role) => (
                              <span key={role} className="px-2.5 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium capitalize">
                                {role}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">{formatDate(broadcast.sentAt || broadcast.createdAt)}</td>
                        <td className="px-6 py-4">{getStatusBadge(broadcast.status)}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => {
                              setSelectedBroadcast(broadcast);
                              setShowDetailsModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 transition"
                          >
                            <Eye size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pagination.pages > 1 && !loading && broadcastHistory.length > 0 && (
                <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200">
                  <button
                    onClick={() => setPagination({...pagination, page: pagination.page - 1})}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">Page {pagination.page} of {pagination.pages}</span>
                  <button
                    onClick={() => setPagination({...pagination, page: pagination.page + 1})}
                    disabled={pagination.page === pagination.pages}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedBroadcast && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 flex justify-between items-center">
              <h3 className="text-white font-semibold text-lg">Broadcast Details</h3>
              <button onClick={() => setShowDetailsModal(false)} className="text-white hover:text-gray-200">
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-500">Subject</label>
                <p className="text-gray-900 mt-1">{selectedBroadcast.subject}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-500">Message</label>
                <p className="text-gray-900 mt-1 whitespace-pre-wrap">{selectedBroadcast.message}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-500">Total Recipients</label>
                  <p className="text-gray-900 mt-1">{selectedBroadcast.recipientCount}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-500">Status</label>
                  <p className="mt-1">{getStatusBadge(selectedBroadcast.status)}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-500">Sent At</label>
                <p className="text-gray-900 mt-1">{formatDate(selectedBroadcast.sentAt || selectedBroadcast.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Broadcast;