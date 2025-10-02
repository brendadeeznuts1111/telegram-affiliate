import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/api/client';
import type { User, AgentStats } from '@affiliate/schemas';

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null);
  const stats = ref<AgentStats | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  async function fetchCurrentUser() {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await api.get<User>('/user/me');
      user.value = response.data;
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch user';
      throw err;
    } finally {
      loading.value = false;
    }
  }
  
  async function fetchStats() {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await api.get<AgentStats>('/user/stats');
      stats.value = response.data;
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch stats';
      throw err;
    } finally {
      loading.value = false;
    }
  }
  
  return {
    user,
    stats,
    loading,
    error,
    fetchCurrentUser,
    fetchStats,
  };
});

