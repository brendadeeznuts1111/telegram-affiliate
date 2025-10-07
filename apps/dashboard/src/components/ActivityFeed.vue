<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Recent Activity
      </h3>
      <button
        v-if="showViewAll"
        @click="$emit('viewAll')"
        class="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
      >
        View All →
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="activities.length === 0" class="py-8 text-center">
      <div class="text-4xl mb-2">📋</div>
      <p class="text-gray-600 dark:text-gray-400">No recent activity</p>
    </div>

    <!-- Activity List -->
    <div v-else class="space-y-4">
      <div
        v-for="activity in displayedActivities"
        :key="activity.id"
        class="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <!-- Icon -->
        <div
          :class="[
            'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
            getActivityColor(activity.type)
          ]"
        >
          <span class="text-xl">{{ getActivityIcon(activity.type) }}</span>
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 dark:text-white">
            {{ activity.title }}
          </p>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
            {{ activity.description }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {{ formatTime(activity.timestamp) }}
          </p>
        </div>

        <!-- Amount (if applicable) -->
        <div
          v-if="activity.amount"
          class="text-right flex-shrink-0"
        >
          <p
            :class="[
              'text-sm font-semibold',
              activity.amount > 0 ? 'text-green-600' : 'text-red-600'
            ]"
          >
            {{ activity.amount > 0 ? '+' : '' }}${{ Math.abs(activity.amount).toFixed(2) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface Activity {
  id: string;
  type: 'commission' | 'deposit' | 'customer' | 'agent' | 'withdrawal' | 'payment';
  title: string;
  description: string;
  amount?: number;
  timestamp: number;
}

interface Props {
  activities: Activity[];
  loading?: boolean;
  limit?: number;
  showViewAll?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  limit: 10,
  showViewAll: true,
});

defineEmits<{
  viewAll: [];
}>();

const displayedActivities = computed(() => {
  return props.activities.slice(0, props.limit);
});

function getActivityIcon(type: Activity['type']): string {
  const icons = {
    commission: '💵',
    deposit: '💰',
    customer: '👤',
    agent: '🤝',
    withdrawal: '🏦',
    payment: '✅',
  };
  return icons[type] || '📋';
}

function getActivityColor(type: Activity['type']): string {
  const colors = {
    commission: 'bg-green-100 dark:bg-green-900/20',
    deposit: 'bg-blue-100 dark:bg-blue-900/20',
    customer: 'bg-purple-100 dark:bg-purple-900/20',
    agent: 'bg-amber-100 dark:bg-amber-900/20',
    withdrawal: 'bg-red-100 dark:bg-red-900/20',
    payment: 'bg-green-100 dark:bg-green-900/20',
  };
  return colors[type] || 'bg-gray-100 dark:bg-gray-700';
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
</script>
