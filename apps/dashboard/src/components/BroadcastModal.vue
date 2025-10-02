<template>
  <div class="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
    <div class="bg-gray-900 rounded-lg p-6 max-w-md w-full border border-gray-700">
      <h2 class="text-xl font-bold mb-4">📢 Broadcast Message</h2>
      
      <textarea
        v-model="message"
        placeholder="Type your message to all agents..."
        class="w-full bg-gray-800 text-white p-3 rounded border border-gray-700 mb-4 min-h-[120px] resize-none"
        maxlength="1000"
      ></textarea>
      
      <p class="text-xs text-gray-500 mb-4">{{ message.length }}/1000 characters</p>
      
      <div class="flex gap-3">
        <button
          @click="emit('close')"
          class="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 rounded transition-colors"
        >
          Cancel
        </button>
        <button
          @click="handleSend"
          :disabled="!message.trim()"
          class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-2 rounded transition-colors disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{
  close: [];
  send: [message: string];
}>();

const message = ref('');

function handleSend() {
  if (message.value.trim()) {
    emit('send', message.value.trim());
  }
}
</script>

