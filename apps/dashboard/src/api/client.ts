import axios from 'axios';
import { retrieveLaunchParams } from '@telegram-apps/sdk';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
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

