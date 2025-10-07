<template>
  <div class="p-4 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-tg-text">Dashboard</h1>
        <p class="text-sm text-gray-500">Welcome back! Here's your overview.</p>
      </div>
      <button
        @click="refreshData"
        :disabled="loading"
        class="px-4 py-2 bg-tg-button text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 flex items-center space-x-2"
      >
        <svg class="h-4 w-4" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>Refresh</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !stats" class="space-y-6">
      <LoadingSkeleton type="card" />
      <LoadingSkeleton type="chart" />
      <LoadingSkeleton type="list" :rows="3" />
    </div>

    <!-- Stats Cards -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">Total Earned</p>
            <p class="text-2xl font-bold text-green-600">${{ stats?.total_earned?.toFixed(2) || '0.00' }}</p>
          </div>
          <div class="p-3 bg-green-100 rounded-full">
            <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">Pending</p>
            <p class="text-2xl font-bold text-yellow-600">${{ stats?.pending?.toFixed(2) || '0.00' }}</p>
          </div>
          <div class="p-3 bg-yellow-100 rounded-full">
            <svg class="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">Paid Out</p>
            <p class="text-2xl font-bold text-blue-600">${{ stats?.paid_out?.toFixed(2) || '0.00' }}</p>
          </div>
          <div class="p-3 bg-blue-100 rounded-full">
            <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">This Month</p>
            <p class="text-2xl font-bold text-purple-600">${{ stats?.this_month?.toFixed(2) || '0.00' }}</p>
          </div>
          <div class="p-3 bg-purple-100 rounded-full">
            <svg class="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Earnings Chart -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">Earnings Trend</h2>
          <select
            v-model="chartDays"
            @change="loadChartData"
            class="px-3 py-1 border border-gray-300 rounded-lg text-sm"
          >
            <option :value="7">7 Days</option>
            <option :value="30">30 Days</option>
            <option :value="90">90 Days</option>
          </select>
        </div>
        <EarningsChart :data="chartData" :loading="chartLoading" />
      </div>

      <!-- Activity Feed -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">Recent Activity</h2>
          <router-link to="/commissions" class="text-sm text-tg-link hover:underline">
            View All
          </router-link>
        </div>
        <div v-if="activityLoading">
          <LoadingSkeleton type="list" :rows="3" />
        </div>
        <div v-else-if="activities.length === 0" class="text-center py-8 text-gray-500">
          No recent activity
        </div>
        <div v-else class="space-y-3">
          <div v-for="activity in activities.slice(0, 5)" :key="activity.id" class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
            <span class="text-2xl">{{ activityIcon(activity.type) }}</span>
            <div class="flex-1">
              <p class="text-sm font-medium">{{ activity.title }}</p>
              <p class="text-xs text-gray-500">{{ activity.description }}</p>
              <p class="text-xs text-gray-400 mt-1">
                {{ formatDate(activity.timestamp) }}
              </p>
            </div>
            <span v-if="activity.amount" class="text-sm font-semibold text-green-600">
              +${{ activity.amount.toFixed(2) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <router-link
        to="/commissions"
        class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
      >
        <div class="flex items-center space-x-4">
          <div class="p-3 bg-green-100 rounded-full">
            <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="font-semibold">View Commissions</p>
            <p class="text-sm text-gray-500">Track your earnings</p>
          </div>
        </div>
      </router-link>

      <router-link
        to="/tree"
        class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
      >
        <div class="flex items-center space-x-4">
          <div class="p-3 bg-blue-100 rounded-full">
            <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <p class="font-semibold">Agent Tree</p>
            <p class="text-sm text-gray-500">View your network</p>
          </div>
        </div>
      </router-link>

      <router-link
        to="/customers"
        class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
      >
        <div class="flex items-center space-x-4">
          <div class="p-3 bg-purple-100 rounded-full">
            <svg class="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <p class="font-semibold">Customers</p>
            <p class="text-sm text-gray-500">Manage your clients</p>
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { commissionsAPI, activityAPI } from '@/api/client';
import { useToast } from '@/composables/useToast';
import EarningsChart from '@/components/EarningsChart.vue';
import LoadingSkeleton from '@/components/LoadingSkeleton.vue';

const { success, error: showError } = useToast();

// State
const loading = ref(true);
const stats = ref<any>(null);
const activities = ref<any[]>([]);
const activityLoading = ref(true);
const chartData = ref<any[]>([]);
const chartLoading = ref(true);
const chartDays = ref(30);

// Load data
const loadStats = async () => {
  try {
    const { data } = await commissionsAPI.stats();
    stats.value = data.stats;
  } catch (err: any) {
    console.error('Failed to load stats:', err);
    showError('Failed to load statistics');
  }
};

const loadActivities = async () => {
  activityLoading.value = true;
  try {
    const { data } = await activityAPI.list({ limit: 10 });
    activities.value = data.activities || [];
  } catch (err: any) {
    console.error('Failed to load activities:', err);
    // Don't show error for activities - it's not critical
  } finally {
    activityLoading.value = false;
  }
};

const loadChartData = async () => {
  chartLoading.value = true;
  try {
    const { data } = await activityAPI.chart({ days: chartDays.value });
    chartData.value = data.data || [];
  } catch (err: any) {
    console.error('Failed to load chart data:', err);
  } finally {
    chartLoading.value = false;
  }
};

const refreshData = async () => {
  loading.value = true;
  try {
    await Promise.all([
      loadStats(),
      loadActivities(),
      loadChartData(),
    ]);
    success('Data refreshed successfully');
  } catch (err) {
    showError('Failed to refresh data');
  } finally {
    loading.value = false;
  }
};

// Helpers
const activityIcon = (type: string) => {
  const icons: Record<string, string> = {
    commission: '💵',
    deposit: '💰',
    customer: '👤',
    agent: '🤝',
  };
  return icons[type] || '📋';
};

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

// Auto-refresh every 30 seconds
let refreshInterval: any;

onMounted(async () => {
  await refreshData();
  
  // Auto-refresh every 30 seconds
  refreshInterval = setInterval(() => {
    loadStats();
    loadActivities();
  }, 30000);
});

// Cleanup on unmount
import { onUnmounted } from 'vue';
onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>