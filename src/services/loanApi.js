// src/services/loanApi.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const loanApi = {
  // Get loans with progress data (including overdue detection)
  getLoansWithProgress: async (page = 1, limit = 100, status = '') => {
    const token = localStorage.getItem('token');
    let url = `${API_URL}/loans/with-progress?page=${page}&limit=${limit}`;
    if (status) {
      url += `&status=${status}`;
    }
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  // Get single loan details
  getLoanById: async (id) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/loans/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  // Get near-due loans (for early notifications)
  getNearDueLoans: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/loans/near-due`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  // Get loan statistics
  getLoanStats: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/loans/stats/overview`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  // Get all loans with filters
  getLoans: async (page = 1, limit = 10, filters = {}) => {
    const token = localStorage.getItem('token');
    let url = `${API_URL}/loans?page=${page}&limit=${limit}`;
    if (filters.status) url += `&status=${filters.status}`;
    if (filters.risk) url += `&risk=${filters.risk}`;
    if (filters.search) url += `&search=${filters.search}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  // Approve loan
  approveLoan: async (id) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/loans/${id}/approve`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  // Reject loan
  rejectLoan: async (id, reason) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/loans/${id}/reject`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ reason })
    });
    return response.json();
  },

  // Record payment
  recordPayment: async (id, paymentData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/loans/${id}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(paymentData)
    });
    return response.json();
  }
};