<template>
  <div class="min-h-screen bg-tg-bg text-tg-text">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useTelegramStore } from '@/stores/telegram';

const tgStore = useTelegramStore();

onMounted(() => {
  tgStore.initialize();
});
</script>

