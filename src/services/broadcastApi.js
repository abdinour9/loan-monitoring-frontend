// src/services/broadcastApi.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const broadcastApi = {
  // Send broadcast message
  sendBroadcast: async (data) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/broadcast/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  // Get broadcast history
  getBroadcastHistory: async (page = 1, limit = 20) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/broadcast/history?page=${page}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  // Get broadcast details
  getBroadcastDetails: async (id) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/broadcast/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  // Get SMS balance
  getSmsBalance: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/broadcast/sms-balance`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  // Get recipient count preview
  getRecipientCount: async (targetRoles, filters = {}) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/broadcast/recipient-count`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ targetRoles, filters })
    });
    return response.json();
  },

  // Cancel scheduled broadcast
  cancelBroadcast: async (id) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/broadcast/${id}/cancel`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  }
};