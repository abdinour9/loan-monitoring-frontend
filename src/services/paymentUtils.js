// src/services/paymentUtils.js
import axios from 'axios';

const API_URL = "http://localhost:5000/api";

/**
 * Safely convert any value to number
 */
export const toNumber = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value === 'object' && value !== null) {
    // Handle MongoDB Decimal128 or other object types
    if (value.$numberDecimal) return parseFloat(value.$numberDecimal);
    if (value.value) return toNumber(value.value);
  }
  return 0;
};

/**
 * Safely parse date from various formats
 */
export const parseDate = (date) => {
  if (!date) return null;
  if (date instanceof Date) return date;
  if (typeof date === 'string') {
    try {
      const parsed = new Date(date);
      return isNaN(parsed.getTime()) ? null : parsed;
    } catch (e) {
      return null;
    }
  }
  return null;
};

/**
 * Fetch all payments from the API
 */
export const fetchAllPayments = async () => {
  try {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    
    console.log('📨 Fetching all payments from API...');
    
    // Try to fetch from payments endpoint
    const response = await axios.get(`${API_URL}/payments/history?limit=1000`, { headers });    
    console.log('📊 Payments API response:', response.data);
    
    if (response.data?.success) {
      const payments = response.data.payments || response.data.data || [];
      console.log(`✅ Fetched ${payments.length} payments`);
      
      // Log the first payment to see structure
      if (payments.length > 0) {
        console.log('📝 First payment structure:', payments[0]);
      }
      
      return payments;
    }
    
    return [];
  } catch (error) {
    console.error('❌ Error fetching payments:', error);
    return [];
  }
};

/**
 * Process a payment object from API (matching LoanPayment schema)
 */
export const processPayment = (payment) => {
  try {
    console.log('🔄 Processing payment:', payment);
    
    // Extract date - use processedAt or createdAt
    let paymentDate = null;
    if (payment.processedAt) {
      paymentDate = parseDate(payment.processedAt);
    } else if (payment.createdAt) {
      paymentDate = parseDate(payment.createdAt);
    }

    // If still no date, use current time as fallback
    if (!paymentDate) paymentDate = new Date();

    // Use invoiceId as the primary identifier (it's unique in schema)
    let displayPaymentId = payment.invoiceId || '';
    if (!displayPaymentId && payment.transactionId) {
      displayPaymentId = payment.transactionId;
    } else if (!displayPaymentId && payment._id) {
      const id = payment._id.toString();
      displayPaymentId = `PAY-${id.slice(-6)}`;
    }

    // Build reference string
    let reference = '';
    if (payment.transactionId) {
      reference = `TXN: ${payment.transactionId}`;
    }
    if (payment.referenceId) {
      reference = reference ? `${reference} | REF: ${payment.referenceId}` : `REF: ${payment.referenceId}`;
    }

    const processed = {
      paymentId: displayPaymentId,
      amount: toNumber(payment.amount),
      date: paymentDate,
      method: payment.paymentMethod || 'EVC Plus',
      reference: reference,
      status: payment.status?.toString().toLowerCase() || 'success',
      loanId: payment.loanId?.toString(),
      loanId_display: payment.loanId_display,
      transactionId: payment.transactionId,
      invoiceId: payment.invoiceId,
      phoneNumber: payment.phoneNumber,
      userId: payment.userId?.toString()
    };
    
    console.log('✅ Processed payment:', {
      ...processed,
      amount: processed.amount,
      date: processed.date?.toISOString()
    });
    
    return processed;
  } catch (e) {
    console.error('⚠️ Error processing payment object:', e);
    return null;
  }
};

/**
 * Calculate paid amount from payments list (matching Flutter logic)
 */
export const calculatePaidAmountFromPayments = (payments, loanId, loanDisplayId) => {
  let totalPaid = 0;
  let matchingPayments = [];
  
  console.log('💰 Calculating paid amount for loan:', { 
    loanId, 
    loanDisplayId,
    totalPayments: payments?.length || 0 
  });
  
  if (!payments || !Array.isArray(payments)) {
    console.log('❌ No payments array');
    return { totalPaid: 0, matchingPayments: [] };
  }

  for (const payment of payments) {
    if (!payment) continue;
    
    // Check if this payment belongs to our loan
    const paymentLoanId = payment.loanId?.toString();
    const paymentLoanDisplayId = payment.loanId_display?.toString();
    
    if (paymentLoanId === loanId || paymentLoanDisplayId === loanDisplayId) {
      console.log('  ✅ Payment matches loan:', {
        invoiceId: payment.invoiceId,
        amount: payment.amount,
        status: payment.status,
        date: payment.date
      });
      
      matchingPayments.push(payment);
      
      if (payment.status === 'success') {
        const amount = toNumber(payment.amount);
        totalPaid += amount;
        console.log('    ✅ Adding to paid amount:', amount, '(total now:', totalPaid, ')');
      }
    }
  }
  
  console.log('💰 Final calculated paid amount:', totalPaid);
  console.log(`📊 Found ${matchingPayments.length} matching payments for this loan`);
  
  return { totalPaid, matchingPayments };
};

/**
 * Process loan with payments to calculate correct progress (matching Flutter exactly)
 */
export const processLoanWithPayments = (loan, allPayments = []) => {
  console.log('🔄 Processing loan:', loan.loanId);
  console.log('📊 Loan data:', {
    amount: loan.amount,
    paidAmount: loan.paidAmount,
    schedule: loan.schedule?.length,
    status: loan.status,
    loanId: loan._id,
    loanDisplayId: loan.loanId
  });
  
  const processedLoan = { ...loan };
  
  // Get base values
  const loanId = loan._id?.toString();
  const loanDisplayId = loan.loanId;
  const amount = toNumber(loan.amount);
  
  // Calculate paid amount from payments
  const { totalPaid, matchingPayments } = calculatePaidAmountFromPayments(
    allPayments, 
    loanId, 
    loanDisplayId
  );
  
  console.log('💰 Final paid amount:', totalPaid);
  
  // Process schedule and mark installments as paid based on payments
  const processedSchedule = [];
  if (loan.schedule && Array.isArray(loan.schedule) && loan.schedule.length > 0) {
    const scheduleList = loan.schedule;
    
    // Calculate installment amount (total / number of installments)
    const term = scheduleList.length;
    const installmentAmount = amount / term;
    
    // Calculate how many installments are paid based on total paid amount
    const paidInstallmentsCount = Math.round(totalPaid / installmentAmount);
    
    console.log('📊 Installment calculation:', {
      amount,
      term,
      installmentAmount: installmentAmount.toFixed(2),
      totalPaid: totalPaid.toFixed(2),
      paidInstallmentsCount
    });
    
    // Track which installments are paid
    let paidSoFar = 0;
    
    for (let i = 0; i < scheduleList.length; i++) {
      const inst = scheduleList[i];
      
      // Determine status based on paid installments count
      let status;
      if (paidSoFar < paidInstallmentsCount) {
        status = 'paid';
        paidSoFar++;
        console.log(`✅ Installment #${i + 1} marked as PAID (${paidSoFar}/${paidInstallmentsCount})`);
      } else {
        // Otherwise use the original status or pending
        status = inst.status?.toString().toLowerCase() || 'pending';
        console.log(`📅 Installment #${i + 1} marked as`, status);
      }
      
      processedSchedule.push({
        installmentNo: i + 1,
        dueDate: parseDate(inst.dueDate),
        amount: toNumber(inst.amount),
        principal: toNumber(inst.principal || 0),
        interest: toNumber(inst.interest || 0),
        status: status
      });
    }
    
    console.log('📅 Total schedule items:', processedSchedule.length);
    console.log('✅ Total paid installments:', paidSoFar);
  }
  
  // Sort matching payments by date (newest first) for display
  const sortedPayments = [...matchingPayments].sort((a, b) => {
    const dateA = a.processedAt || a.createdAt;
    const dateB = b.processedAt || b.createdAt;
    if (!dateA) return 1;
    if (!dateB) return -1;
    return new Date(dateB) - new Date(dateA);
  });
  
  // Process payments for display
  const processedPayments = sortedPayments.map(p => processPayment(p)).filter(p => p !== null);
  
  // Update the loan object with calculated paid amount
  processedLoan.paidAmount = totalPaid;
  processedLoan.remainingAmount = amount - totalPaid;
  processedLoan.progress = amount > 0 ? (totalPaid / amount) * 100 : 0;
  processedLoan.processedSchedule = processedSchedule;
  processedLoan.processedPayments = processedPayments;
  processedLoan.paidInstallments = processedSchedule.filter(s => s.status === 'paid').length;
  processedLoan.totalInstallments = processedSchedule.length;
  
  // Find next pending installment
  processedLoan.nextPendingInstallment = processedSchedule.find(s => s.status === 'pending');
  
  console.log('✅ Processed loan final:', {
    loanId: loan.loanId,
    amount,
    paidAmount: totalPaid,
    progress: processedLoan.progress.toFixed(2) + '%',
    paidInstallments: processedLoan.paidInstallments,
    totalInstallments: processedLoan.totalInstallments,
    matchingPayments: matchingPayments.length
  });
  
  return processedLoan;
};

/**
 * Get next payment amount and date
 */
export const getNextPaymentInfo = (loan) => {
  const next = loan.nextPendingInstallment;
  if (!next) return { amount: 0, date: null };
  
  return {
    amount: toNumber(next.amount),
    date: next.dueDate
  };
};

/**
 * Format currency
 */
export const formatCurrency = (amount, currency = 'USD') => {
  const num = toNumber(amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

/**
 * Format date
 */
export const formatDate = (date, format = 'MMM dd, yyyy') => {
  const parsed = parseDate(date);
  if (!parsed) return 'N/A';
  
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Format time
 */
export const formatTime = (date) => {
  const parsed = parseDate(date);
  if (!parsed) return 'N/A';
  
  return parsed.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};