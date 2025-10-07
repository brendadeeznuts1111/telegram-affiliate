<template>
  <div class="min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Deposits 💰
      </h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">
        Track all customer deposits and earnings
      </p>
    </div>

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
        <p class="text-sm text-gray-600 dark:text-gray-400">Total Deposits</p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
          {{ deposits.length }}
        </p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
        <p class="text-sm text-gray-600 dark:text-gray-400">Total Volume</p>
        <p class="text-2xl font-bold text-blue-600 mt-1">
          ${{ totalVolume.toFixed(2) }}
        </p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
        <p class="text-sm text-gray-600 dark:text-gray-400">Your Earnings</p>
        <p class="text-2xl font-bold text-green-600 mt-1">
          ${{ totalEarnings.toFixed(2) }}
        </p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
        <p class="text-sm text-gray-600 dark:text-gray-400">Avg Deposit</p>
        <p class="text-2xl font-bold text-purple-600 mt-1">
          ${{ avgDeposit.toFixed(2) }}
        </p>
      </div>
    </div>

    <!-- Filter & Search -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 mb-6">
      <div class="flex flex-col md:flex-row gap-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by customer or ID..."
          class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          v-model="statusFilter"
          class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
        <select
          v-model="sortBy"
          class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest">Highest Amount</option>
          <option value="lowest">Lowest Amount</option>
        </select>
      </div>
    </div>

    <!-- Deposits Table -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Date & Time
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Customer
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Amount
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Your Commission
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="deposit in filteredDeposits"
              :key="deposit.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-white">
                  {{ formatDateTime(deposit.created_at) }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  ID: {{ deposit.id.slice(0, 8) }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {{ getInitials(deposit.customerName) }}
                  </div>
                  <div>
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ deposit.customerName }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-semibold text-gray-900 dark:text-white">
                  ${{ deposit.amount.toFixed(2) }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {{ deposit.currency }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-semibold text-green-600">
                  ${{ deposit.yourCommission.toFixed(2) }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {{ ((deposit.yourCommission / deposit.amount) * 100).toFixed(1) }}%
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'px-2 py-1 text-xs font-medium rounded-full',
                    deposit.status === 'completed'
                      ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                      : deposit.status === 'pending'
                      ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                      : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                  ]"
                >
                  {{ deposit.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <button
                  @click="viewDetails(deposit)"
                  class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  View Details
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface Deposit {
  id: string;
  customerName: string;
  amount: number;
  currency: string;
  yourCommission: number;
  status: 'completed' | 'pending' | 'failed';
  created_at: number;
}

const deposits = ref<Deposit[]>([
  {
    id: 'dep_123456',
    customerName: 'John Doe',
    amount: 1000,
    currency: 'USD',
    yourCommission: 50,
    status: 'completed',
    created_at: Date.now() / 1000 - 3600,
  },
  {
    id: 'dep_123457',
    customerName: 'Jane Smith',
    amount: 2000,
    currency: 'USD',
    yourCommission: 100,
    status: 'completed',
    created_at: Date.now() / 1000 - 7200,
  },
]);

const searchQuery = ref('');
const statusFilter = ref('all');
const sortBy = ref('newest');

const filteredDeposits = computed(() => {
  let filtered = deposits.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (d) =>
        d.customerName.toLowerCase().includes(query) ||
        d.id.toLowerCase().includes(query)
    );
  }

  if (statusFilter.value !== 'all') {
    filtered = filtered.filter((d) => d.status === statusFilter.value);
  }

  return [...filtered].sort((a, b) => {
    switch (sortBy.value) {
      case 'newest':
        return b.created_at - a.created_at;
      case 'oldest':
        return a.created_at - b.created_at;
      case 'highest':
        return b.amount - a.amount;
      case 'lowest':
        return a.amount - b.amount;
      default:
        return 0;
    }
  });
});

const totalVolume = computed(() => deposits.value.reduce((sum, d) => sum + d.amount, 0));
const totalEarnings = computed(() => deposits.value.reduce((sum, d) => sum + d.yourCommission, 0));
const avgDeposit = computed(() => deposits.value.length > 0 ? totalVolume.value / deposits.value.length : 0);

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
}

function viewDetails(deposit: Deposit) {
  console.log('View deposit:', deposit);
}
</script>
