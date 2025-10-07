<template>
  <div class="animate-pulse">
    <!-- Card skeleton -->
    <div v-if="type === 'card'" class="bg-white rounded-lg shadow p-6 space-y-4">
      <div class="h-4 bg-gray-200 rounded w-3/4"></div>
      <div class="h-4 bg-gray-200 rounded w-1/2"></div>
      <div class="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>

    <!-- Table skeleton -->
    <div v-if="type === 'table'" class="bg-white rounded-lg shadow overflow-hidden">
      <div class="p-4 border-b border-gray-200">
        <div class="h-4 bg-gray-200 rounded w-1/4"></div>
      </div>
      <div v-for="i in rows" :key="i" class="p-4 border-b border-gray-100">
        <div class="flex space-x-4">
          <div class="h-4 bg-gray-200 rounded flex-1"></div>
          <div class="h-4 bg-gray-200 rounded w-24"></div>
          <div class="h-4 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    </div>

    <!-- List skeleton -->
    <div v-if="type === 'list'" class="space-y-3">
      <div v-for="i in rows" :key="i" class="bg-white rounded-lg shadow p-4 flex items-center space-x-4">
        <div class="h-10 w-10 bg-gray-200 rounded-full"></div>
        <div class="flex-1 space-y-2">
          <div class="h-4 bg-gray-200 rounded w-3/4"></div>
          <div class="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    </div>

    <!-- Chart skeleton -->
    <div v-if="type === 'chart'" class="bg-white rounded-lg shadow p-6">
      <div class="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div class="h-64 bg-gray-100 rounded"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: 'card' | 'table' | 'list' | 'chart';
    rows?: number;
  }>(),
  {
    type: 'card',
    rows: 5,
  }
);
</script>
