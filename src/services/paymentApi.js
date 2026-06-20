// src/services/paymentApi.js
import axios from 'axios';

const API_URL = "http://localhost:5000/api";

export const paymentApi = {
  /**
   * Get user payment history
   */
  getUserPaymentHistory: async (limit = 100) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      console.log('📨 Fetching payment history...');
      
      // Try multiple possible endpoints
      let response = null;
      
      // Try /payments/user first
      try {
        response = await axios.get(`${API_URL}/payments/user`, { 
          headers,
          params: { limit }
        });
        console.log('✅ Got payments from /payments/user');
      } catch (e) {
        console.log('⚠️ /payments/user failed, trying /payments');
        // Try /payments
        try {
          response = await axios.get(`${API_URL}/payments`, { 
            headers,
            params: { limit }
          });
          console.log('✅ Got payments from /payments');
        } catch (e2) {
          console.log('⚠️ /payments failed, trying /loans/payments');
          // Try /loans/payments
          response = await axios.get(`${API_URL}/loans/payments`, { 
            headers,
            params: { limit }
          });
          console.log('✅ Got payments from /loans/payments');
        }
      }
      
      console.log('📊 Payment response:', response?.data);
      
      // Handle different response structures
      if (response?.data?.success) {
        // Try to find payments array in different locations
        const payments = response.data.payments || 
                        response.data.data || 
                        response.data.results || 
                        [];
        
        console.log(`📊 Found ${payments.length} payments`);
        
        // Log first payment to see structure
        if (payments.length > 0) {
          console.log('📝 First payment structure:', payments[0]);
        }
        
        return { 
          success: true, 
          payments: Array.isArray(payments) ? payments : [] 
        };
      }
      
      return { success: false, payments: [] };
    } catch (error) {
      console.error('❌ Error fetching payment history:', error);
      console.error('Error details:', error.response?.data || error.message);
      return { success: false, payments: [] };
    }
  },

  /**
   * Get payments for a specific loan
   */
  getLoanPayments: async (loanId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      console.log(`📨 Fetching payments for loan: ${loanId}`);
      
      // Try multiple possible endpoints
      let response = null;
      
      try {
        response = await axios.get(`${API_URL}/payments/loan/${loanId}`, { headers });
      } catch (e) {
        try {
          response = await axios.get(`${API_URL}/loans/${loanId}/payments`, { headers });
        } catch (e2) {
          response = await axios.get(`${API_URL}/payments?loanId=${loanId}`, { headers });
        }
      }
      
      console.log('📊 Loan payments response:', response?.data);
      
      if (response?.data?.success) {
        const payments = response.data.payments || 
                        response.data.data || 
                        response.data.results || 
                        [];
        
        return { 
          success: true, 
          payments: Array.isArray(payments) ? payments : [] 
        };
      }
      
      return { success: false, payments: [] };
    } catch (error) {
      console.error(`❌ Error fetching payments for loan ${loanId}:`, error);
      return { success: false, payments: [] };
    }
  }
};