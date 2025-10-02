<template>
  <div class="min-h-screen p-4 bg-black text-white">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold">👑 Super Agent Panel</h1>
      <p class="text-gray-400 text-sm mt-1">Manage your agent network</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-yellow-500"></div>
    </div>

    <div v-else>
      <!-- Stats Overview -->
      <div class="grid grid-cols-2 gap-3 mb-6">
        <div class="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 rounded-lg p-4 border border-yellow-700/50">
          <p class="text-xs text-yellow-300 mb-1">Total Override</p>
          <p class="text-2xl font-bold text-yellow-400">${{ totalOverride.toFixed(2) }}</p>
        </div>
        <div class="bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-lg p-4 border border-blue-700/50">
          <p class="text-xs text-blue-300 mb-1">Sub-Agents</p>
          <p class="text-2xl font-bold text-blue-400">{{ agents.length }}</p>
        </div>
        <div class="bg-gradient-to-br from-green-900/50 to-green-800/30 rounded-lg p-4 border border-green-700/50">
          <p class="text-xs text-green-300 mb-1">Total Customers</p>
          <p class="text-2xl font-bold text-green-400">{{ totalCustomers }}</p>
        </div>
        <div class="bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-lg p-4 border border-purple-700/50">
          <p class="text-xs text-purple-300 mb-1">Network Value</p>
          <p class="text-2xl font-bold text-purple-400">${{ networkValue.toFixed(2) }}</p>
        </div>
      </div>

      <!-- Earnings Chart -->
      <div class="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-800">
        <h2 class="text-sm font-semibold mb-3 text-gray-300">📈 Override Earnings (30 Days)</h2>
        <EarningsChart :data="overrideHistory" />
      </div>

      <!-- Agent List -->
      <div class="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-800">
        <h2 class="text-sm font-semibold mb-3 text-gray-300">🤝 Your Agents</h2>
        <div v-if="agents.length > 0" class="space-y-2">
          <div
            v-for="(agent, idx) in agents"
            :key="agent.user_id"
            class="bg-gray-800 rounded p-3 border border-gray-700"
          >
            <div class="flex justify-between items-center mb-1">
              <span class="font-semibold">{{ idx + 1 }}. {{ agent.first_name }}</span>
              <span class="text-sm text-gray-400">@{{ agent.username || 'no_username' }}</span>
            </div>
            <div class="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span class="text-gray-500">Customers:</span>
                <span class="text-white ml-1">{{ agent.customers }}</span>
              </div>
              <div>
                <span class="text-gray-500">Earnings:</span>
                <span class="text-green-400 ml-1">${{ agent.earnings.toFixed(2) }}</span>
              </div>
              <div>
                <span class="text-gray-500">Override:</span>
                <span class="text-yellow-400 ml-1">${{ (agent.earnings * 0.5).toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center text-gray-500 py-6">
          No sub-agents yet. Recruit agents to grow your empire!
        </div>
      </div>

      <!-- Agent Tree Visualization -->
      <div class="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-800">
        <h2 class="text-sm font-semibold mb-3 text-gray-300">🌳 Network Tree</h2>
        <AgentTree :agents="agents" />
      </div>

      <!-- Actions -->
      <div class="grid grid-cols-2 gap-3">
        <button
          @click="openBroadcast"
          class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          📢 Broadcast
        </button>
        <button
          @click="refreshData"
          class="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          🔄 Refresh
        </button>
      </div>
    </div>

    <!-- Broadcast Modal -->
    <BroadcastModal v-if="showBroadcast" @close="showBroadcast = false" @send="sendBroadcast" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useTelegramStore } from '@/stores/telegram';
import EarningsChart from '@/components/EarningsChart.vue';
import AgentTree from '@/components/AgentTree.vue';
import BroadcastModal from '@/components/BroadcastModal.vue';

const tgStore = useTelegramStore();

const loading = ref(true);
const showBroadcast = ref(false);
const agents = ref<any[]>([]);
const overrideHistory = ref<any[]>([]);

const totalOverride = computed(() => 
  agents.value.reduce((sum, a) => sum + (a.earnings * 0.5), 0)
);
const totalCustomers = computed(() => 
  agents.value.reduce((sum, a) => sum + a.customers, 0)
);
const networkValue = computed(() => 
  agents.value.reduce((sum, a) => sum + a.earnings, 0) + totalOverride.value
);

async function loadData() {
  loading.value = true;
  try {
    const userId = tgStore.user?.id;
    
    // Fetch agents from API
    const response = await fetch(`/api/agent/downline`);
    const data = await response.json();
    
    agents.value = data.map((agent: any) => ({
      ...agent,
      customers: agent.total_customers || 0,
      earnings: agent.total_commission || 0,
    }));

    // Mock override history
    overrideHistory.value = generateMockHistory();
  } catch (error) {
    console.error('Failed to load data:', error);
  } finally {
    loading.value = false;
  }
}

function generateMockHistory() {
  const data = [];
  for (let i = 30; i >= 0; i--) {
    data.push({
      date: new Date(Date.now() - i * 86400000).toLocaleDateString(),
      amount: Math.random() * 100 + 50,
    });
  }
  return data;
}

function openBroadcast() {
  showBroadcast.value = true;
}

async function sendBroadcast(message: string) {
  try {
    const userId = tgStore.user?.id;
    const response = await fetch('/api/affiliate/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        superAgentId: userId,
        message,
        targetType: 'direct_agents',
      }),
    });

    if (response.ok) {
      alert('Broadcast sent successfully!');
      showBroadcast.value = false;
    } else {
      alert('Failed to send broadcast');
    }
  } catch (error) {
    console.error('Broadcast error:', error);
    alert('Failed to send broadcast');
  }
}

function refreshData() {
  loadData();
}

onMounted(() => {
  loadData();
});
</script>

