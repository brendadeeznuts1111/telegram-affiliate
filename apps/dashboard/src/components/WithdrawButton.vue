<template>
  <button
    @click="openWithdrawModal"
    :disabled="balance < minAmount"
    class="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 rounded-lg transition-all shadow-lg disabled:cursor-not-allowed"
  >
    <span v-if="balance >= minAmount">💸 Withdraw ${{ balance.toFixed(2) }}</span>
    <span v-else>💸 Minimum: ${{ minAmount }}</span>
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  userId: string;
  balance: number;
}>();

const emit = defineEmits<{
  withdraw: [];
}>();

const minAmount = 10;

function openWithdrawModal() {
  // For now, just emit event
  // In production, open a modal with chain selection
  emit('withdraw');
}
</script>

