<template>
  <div class="min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Customers 👥
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">
          Manage your customer database
        </p>
      </div>
      <button
        @click="refreshData"
        class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
      >
        <span>🔄</span>
        <span>Refresh</span>
      </button>
    </div>

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
        <p class="text-sm text-gray-600 dark:text-gray-400">Total Customers</p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
          {{ filteredCustomers.length }}
        </p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
        <p class="text-sm text-gray-600 dark:text-gray-400">Active</p>
        <p class="text-2xl font-bold text-green-600 mt-1">
          {{ activeCustomers }}
        </p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
        <p class="text-sm text-gray-600 dark:text-gray-400">Total Deposits</p>
        <p class="text-2xl font-bold text-blue-600 mt-1">
          ${{ totalDeposits.toFixed(2) }}
        </p>
      </div>
    </div>

    <!-- Search & Filter -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 mb-6">
      <div class="flex flex-col md:flex-row gap-4">
        <!-- Search -->
        <div class="flex-1">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by name, email, or phone..."
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <!-- Status Filter -->
        <select
          v-model="statusFilter"
          class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <!-- Sort -->
        <select
          v-model="sortBy"
          class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name">Name (A-Z)</option>
          <option value="deposits">Most Deposits</option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p class="mt-2 text-gray-600 dark:text-gray-400">Loading customers...</p>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredCustomers.length === 0" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 border border-gray-200 dark:border-gray-700 text-center">
      <div class="text-6xl mb-4">👥</div>
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        No Customers Found
      </h3>
      <p class="text-gray-600 dark:text-gray-400 mb-6">
        {{ searchQuery ? 'Try adjusting your search filters' : 'Add your first customer to get started' }}
      </p>
      <button
        v-if="!searchQuery"
        class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
      >
        Add Customer
      </button>
    </div>

    <!-- Customer List -->
    <div v-else class="space-y-4">
      <div
        v-for="customer in paginatedCustomers"
        :key="customer.id"
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
      >
        <div class="p-6">
          <div class="flex items-start justify-between">
            <!-- Customer Info -->
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {{ getInitials(customer.name) }}
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    {{ customer.name }}
                  </h3>
                  <div class="flex items-center gap-2 mt-1">
                    <span
                      :class="[
                        'px-2 py-0.5 text-xs font-medium rounded-full',
                        customer.status === 'active'
                          ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      ]"
                    >
                      {{ customer.status }}
                    </span>
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                      Added {{ formatDate(customer.created_at) }}
                    </span>
                  </div>
                </div>
              </div>
              
              <!-- Contact Info -->
              <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>📧</span>
                  <span class="break-all">{{ customer.email }}</span>
                </div>
                <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>📱</span>
                  <span>{{ customer.phone }}</span>
                </div>
              </div>

              <!-- Stats -->
              <div class="mt-4 flex items-center gap-6">
                <div>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Deposits</p>
                  <p class="text-lg font-semibold text-gray-900 dark:text-white">
                    {{ customer.depositsCount || 0 }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Total Volume</p>
                  <p class="text-lg font-semibold text-gray-900 dark:text-white">
                    ${{ (customer.totalDeposits || 0).toFixed(2) }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Your Earnings</p>
                  <p class="text-lg font-semibold text-green-600">
                    ${{ (customer.yourEarnings || 0).toFixed(2) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-col gap-2 ml-4">
              <button
                @click="viewCustomerDetails(customer)"
                class="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium transition-colors"
              >
                View Details
              </button>
              <button
                @click="recordDeposit(customer)"
                class="px-4 py-2 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium transition-colors"
              >
                Record Deposit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="mt-6 flex items-center justify-between">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, filteredCustomers.length) }} of {{ filteredCustomers.length }} customers
      </p>
      <div class="flex items-center gap-2">
        <button
          @click="currentPage--"
          :disabled="currentPage === 1"
          class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <span class="text-sm text-gray-600 dark:text-gray-400">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        <button
          @click="currentPage++"
          :disabled="currentPage === totalPages"
          class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

// Mock data (will be replaced with API calls)
interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  created_at: number;
  depositsCount?: number;
  totalDeposits?: number;
  yourEarnings?: number;
}

const loading = ref(false);
const customers = ref<Customer[]>([
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    status: 'active',
    created_at: Date.now() / 1000 - 86400 * 7,
    depositsCount: 5,
    totalDeposits: 5000,
    yourEarnings: 250,
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+1987654321',
    status: 'active',
    created_at: Date.now() / 1000 - 86400 * 14,
    depositsCount: 3,
    totalDeposits: 3000,
    yourEarnings: 150,
  },
]);

const searchQuery = ref('');
const statusFilter = ref('all');
const sortBy = ref('newest');
const currentPage = ref(1);
const pageSize = 10;

const filteredCustomers = computed(() => {
  let filtered = customers.value;

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.phone.includes(query)
    );
  }

  // Status filter
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter((c) => c.status === statusFilter.value);
  }

  // Sort
  filtered = [...filtered].sort((a, b) => {
    switch (sortBy.value) {
      case 'newest':
        return b.created_at - a.created_at;
      case 'oldest':
        return a.created_at - b.created_at;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'deposits':
        return (b.totalDeposits || 0) - (a.totalDeposits || 0);
      default:
        return 0;
    }
  });

  return filtered;
});

const paginatedCustomers = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return filteredCustomers.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredCustomers.value.length / pageSize);
});

const activeCustomers = computed(() => {
  return customers.value.filter((c) => c.status === 'active').length;
});

const totalDeposits = computed(() => {
  return customers.value.reduce((sum, c) => sum + (c.totalDeposits || 0), 0);
});

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

function viewCustomerDetails(customer: Customer) {
  console.log('View customer:', customer);
  // Will open modal or navigate to detail page
}

function recordDeposit(customer: Customer) {
  console.log('Record deposit for:', customer);
  // Will open deposit modal
}

async function refreshData() {
  loading.value = true;
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000));
  loading.value = false;
}

onMounted(() => {
  // Load customers from API
});
</script>
