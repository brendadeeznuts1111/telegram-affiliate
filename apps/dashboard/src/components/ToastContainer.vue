<template>
  <div class="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
    <transition-group name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto max-w-sm rounded-lg shadow-lg p-4 flex items-start space-x-3"
        :class="toastClasses(toast.type)"
      >
        <div class="flex-shrink-0">
          <span class="text-xl">{{ toastIcon(toast.type) }}</span>
        </div>
        <div class="flex-1">
          <p class="text-sm font-medium">{{ toast.message }}</p>
        </div>
        <button
          @click="removeToast(toast.id)"
          class="flex-shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { useToast } from '../composables/useToast';

const { toasts, removeToast } = useToast();

const toastClasses = (type: string) => {
  const classes: Record<string, string> = {
    success: 'bg-green-50 border border-green-200 text-green-800',
    error: 'bg-red-50 border border-red-200 text-red-800',
    info: 'bg-blue-50 border border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border border-yellow-200 text-yellow-800',
  };
  return classes[type] || classes.info;
};

const toastIcon = (type: string) => {
  const icons: Record<string, string> = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️',
  };
  return icons[type] || icons.info;
};
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100px);
}
</style>
