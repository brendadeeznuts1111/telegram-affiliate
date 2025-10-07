import axios from 'axios';
import { retrieveLaunchParams } from '@telegram-apps/sdk';

// Determine base URL based on environment
const getBaseURL = () => {
  // In production (Cloudflare Pages), use the Workers URL
  if (import.meta.env.PROD) {
    return 'https://telegram-affiliate-api.nolarose1968-806.workers.dev/api';
  }
  // In development, use local server
  return import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Telegram init data to every request
api.interceptors.request.use((config) => {
  try {
    // Try to get from Telegram WebApp
    if (window.Telegram?.WebApp?.initData) {
      config.headers['X-Telegram-Init-Data'] = window.Telegram.WebApp.initData;
    } else {
      // Try to get from SDK
      const { initDataRaw } = retrieveLaunchParams();
      if (initDataRaw) {
        config.headers['X-Telegram-Init-Data'] = initDataRaw;
      }
    }
  } catch (error) {
    console.log('No Telegram init data (dev mode)');
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;

// ============================================================================
// API METHODS - Phase 3 REST Endpoints
// ============================================================================

// Customers API
export const customersAPI = {
  list: () => api.get('/customers'),
  get: (id: string) => api.get(`/customers/${id}`),
  create: (data: { name: string; email: string; phone: string; telegram_id?: number }) =>
    api.post('/customers', data),
  update: (id: string, data: { name?: string; email?: string; phone?: string; status?: string }) =>
    api.patch(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
};

// Commissions API
export const commissionsAPI = {
  list: (params?: { status?: string; level?: string; limit?: number; offset?: number }) =>
    api.get('/commissions', { params }),
  get: (id: string) => api.get(`/commissions/${id}`),
  stats: () => api.get('/commissions/stats'),
  export: () => api.get('/commissions/export', { responseType: 'blob' }),
};

// Deposits API
export const depositsAPI = {
  list: (params?: { status?: string; limit?: number; offset?: number }) =>
    api.get('/deposits', { params }),
  get: (id: string) => api.get(`/deposits/${id}`),
  stats: () => api.get('/deposits/stats'),
};

// Agent Tree API
export const treeAPI = {
  get: () => api.get('/tree'),
};

// Activity Feed API
export const activityAPI = {
  list: (params?: { limit?: number }) => api.get('/activity', { params }),
  chart: (params?: { days?: number }) => api.get('/activity/chart', { params }),
};

// User/Agent API (existing)
export const userAPI = {
  me: () => api.get('/user/me'),
  stats: () => api.get('/user/stats'),
};