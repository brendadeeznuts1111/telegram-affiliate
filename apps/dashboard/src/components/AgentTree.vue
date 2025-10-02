<template>
  <div class="agent-tree">
    <div v-if="agents.length > 0" class="space-y-2">
      <div
        v-for="(agent, idx) in agents.slice(0, 5)"
        :key="agent.user_id"
        class="flex items-center gap-3 p-2 bg-gray-800/50 rounded"
      >
        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold">
          {{ agent.first_name?.[0] || 'A' }}
        </div>
        <div class="flex-1">
          <p class="text-sm font-semibold">{{ agent.first_name }}</p>
          <p class="text-xs text-gray-500">{{ agent.customers }} customers</p>
        </div>
        <div class="text-right">
          <p class="text-sm text-green-400 font-semibold">${{ agent.earnings?.toFixed(2) || '0.00' }}</p>
        </div>
      </div>
      <p v-if="agents.length > 5" class="text-xs text-gray-500 text-center mt-2">
        +{{ agents.length - 5 }} more agents
      </p>
    </div>
    <div v-else class="text-center text-gray-500 py-4 text-sm">
      No agents in your network yet
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  agents: any[];
}>();
</script>

