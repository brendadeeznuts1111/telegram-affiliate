<template>
  <div class="min-h-screen bg-tg-bg text-tg-text">
    <router-view />
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useTelegramStore } from '@/stores/telegram';
import ToastContainer from '@/components/ToastContainer.vue';

const tgStore = useTelegramStore();

onMounted(() => {
  tgStore.initialize();
});
</script>

