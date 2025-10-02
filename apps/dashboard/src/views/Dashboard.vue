<template>
  <div class="min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Welcome, {{ tgStore.user?.firstName || 'Agent' }}! 👋
      </h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">
        Your affiliate dashboard
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="userStore.loading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p class="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>

    <!-- Stats Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <!-- Customers -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Total Customers</p>
            <p class="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {{ stats?.customers || 0 }}
            </p>
          </div>
          <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
            <span class="text-2xl">👥</span>
          </div>
        </div>
      </div>

      <!-- Commission -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Total Commission</p>
            <p class="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              ${{ (stats?.commission || 0).toFixed(2) }}
            </p>
          </div>
          <div class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
            <span class="text-2xl">💰</span>
          </div>
        </div>
      </div>

      <!-- Level -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Agent Level</p>
            <p class="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {{ getLevelName(stats?.level || 0) }}
            </p>
          </div>
          <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
            <span class="text-2xl">{{ getLevelEmoji(stats?.level || 0) }}</span>
          </div>
        </div>
      </div>

      <!-- Sub Agents -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Sub Agents</p>
            <p class="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {{ stats?.sub_agents || 0 }}
            </p>
          </div>
          <div class="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center">
            <span class="text-2xl">🤝</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
        <router-link 
          to="/tree"
          class="flex items-center justify-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg text-blue-700 dark:text-blue-300 font-medium transition-colors"
        >
          <span>🌳</span>
          <span>Agent Tree</span>
        </router-link>
        
        <router-link 
          to="/commissions"
          class="flex items-center justify-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg text-green-700 dark:text-green-300 font-medium transition-colors"
        >
          <span>💵</span>
          <span>Commissions</span>
        </router-link>
        
        <button 
          @click="refresh"
          class="flex items-center justify-center gap-2 p-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg text-purple-700 dark:text-purple-300 font-medium transition-colors"
        >
          <span>🔄</span>
          <span>Refresh</span>
        </button>
      </div>
    </div>

    <!-- Debug Info (dev mode) -->
    <div v-if="isDev" class="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4">
      <p class="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2">🛠️ Debug Info</p>
      <pre class="text-xs text-yellow-700 dark:text-yellow-400 overflow-auto">{{ {
        user: userStore.user,
        stats: userStore.stats,
        tgUser: tgStore.user,
        theme: tgStore.theme,
      } }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useUserStore } from '@/stores/user';
import { useTelegramStore } from '@/stores/telegram';

const userStore = useUserStore();
const tgStore = useTelegramStore();

const stats = computed(() => userStore.stats);
const isDev = import.meta.env.DEV;

const levelNames = ['Agent', 'Silver', 'Gold', 'Platinum'];
const levelEmojis = ['🤝', '🥈', '🥇', '💎'];

function getLevelName(level: number): string {
  return levelNames[level] || 'Agent';
}

function getLevelEmoji(level: number): string {
  return levelEmojis[level] || '🤝';
}

async function refresh() {
  await Promise.all([
    userStore.fetchCurrentUser(),
    userStore.fetchStats(),
  ]);
}

onMounted(() => {
  refresh();
});
</script>

