<template>
  <div class="p-4 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Commissions</h1>
        <p class="text-sm text-gray-500">Track your earnings and payouts</p>
      </div>
      <button
        @click="exportCSV"
        :disabled="exporting"
        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>{{ exporting ? 'Exporting...' : 'Export CSV' }}</span>
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow p-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            v-model="filters.status"
            @change="loadCommissions"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Level</label>
          <select
            v-model="filters.level"
            @change="loadCommissions"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Levels</option>
            <option value="1">Level 1</option>
            <option value="2">Level 2</option>
            <option value="3">Level 3</option>
          </select>
        </div>

        <div class="flex items-end">
          <button
            @click="refreshData"
            :disabled="loading"
            class="w-full px-4 py-2 bg-tg-button text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <svg class="h-4 w-4" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <LoadingSkeleton v-if="loading" type="table" :rows="8" />

    <!-- Commissions Table -->
    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Level
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="commissions.length === 0">
              <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                No commissions found
              </td>
            </tr>
            <tr v-for="commission in commissions" :key="commission.commission_id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatDate(commission.created_at) }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-900">
                {{ commission.description || 'Commission earned' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ commission.customer_name || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span class="px-2 py-1 text-xs font-medium rounded-full" :class="levelClass(commission.level)">
                  Level {{ commission.level }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                ${{ commission.amount.toFixed(2) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span class="px-2 py-1 text-xs font-medium rounded-full" :class="statusClass(commission.status)">
                  {{ commission.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="total > limit" class="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
        <div class="text-sm text-gray-700">
          Showing {{ offset + 1 }} to {{ Math.min(offset + limit, total) }} of {{ total }} results
        </div>
        <div class="flex space-x-2">
          <button
            @click="previousPage"
            :disabled="offset === 0"
            class="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            @click="nextPage"
            :disabled="offset + limit >= total"
            class="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- Summary Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-sm text-gray-500">Total Commissions</p>
        <p class="text-2xl font-bold text-gray-900">{{ total }}</p>
      </div>
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-sm text-gray-500">Pending</p>
        <p class="text-2xl font-bold text-yellow-600">{{ pendingCount }}</p>
      </div>
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-sm text-gray-500">Paid</p>
        <p class="text-2xl font-bold text-green-600">{{ paidCount }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { commissionsAPI } from '@/api/client';
import { useToast } from '@/composables/useToast';
import LoadingSkeleton from '@/components/LoadingSkeleton.vue';

const { success, error: showError } = useToast();

// State
const loading = ref(true);
const exporting = ref(false);
const commissions = ref<any[]>([]);
const total = ref(0);
const limit = ref(20);
const offset = ref(0);

const filters = ref({
  status: '',
  level: '',
});

// Computed
const pendingCount = computed(() => 
  commissions.value.filter(c => c.status === 'pending').length
);

const paidCount = computed(() => 
  commissions.value.filter(c => c.status === 'paid').length
);

// Methods
const loadCommissions = async () => {
  loading.value = true;
  try {
    const params: any = {
      limit: limit.value,
      offset: offset.value,
    };

    if (filters.value.status) params.status = filters.value.status;
    if (filters.value.level) params.level = filters.value.level;

    const { data } = await commissionsAPI.list(params);
    commissions.value = data.commissions || [];
    total.value = data.total || 0;
  } catch (err: any) {
    console.error('Failed to load commissions:', err);
    showError('Failed to load commissions');
  } finally {
    loading.value = false;
  }
};

const exportCSV = async () => {
  exporting.value = true;
  try {
    const { data } = await commissionsAPI.export();
    
    // Create blob and download
    const blob = new Blob([data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `commissions-${Date.now()}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    success('Commissions exported successfully');
  } catch (err: any) {
    console.error('Failed to export commissions:', err);
    showError('Failed to export commissions');
  } finally {
    exporting.value = false;
  }
};

const refreshData = () => {
  offset.value = 0;
  loadCommissions();
};

const previousPage = () => {
  if (offset.value > 0) {
    offset.value = Math.max(0, offset.value - limit.value);
    loadCommissions();
  }
};

const nextPage = () => {
  if (offset.value + limit.value < total.value) {
    offset.value += limit.value;
    loadCommissions();
  }
};

// Helpers
const formatDate = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const statusClass = (status: string) => {
  return status === 'paid'
    ? 'bg-green-100 text-green-800'
    : 'bg-yellow-100 text-yellow-800';
};

const levelClass = (level: number) => {
  const classes = [
    'bg-blue-100 text-blue-800',
    'bg-purple-100 text-purple-800',
    'bg-pink-100 text-pink-800',
  ];
  return classes[level - 1] || classes[0];
};

onMounted(() => {
  loadCommissions();
});
</script>