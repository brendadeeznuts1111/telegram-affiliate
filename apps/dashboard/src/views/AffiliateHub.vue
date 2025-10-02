<template>
  <div class="min-h-screen p-4 bg-black text-white">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold">💰 Your Affiliate Hub</h1>
      <p class="text-gray-400 text-sm mt-1">Track earnings and grow your network</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-green-500"></div>
    </div>

    <div v-else>
      <!-- Earnings Grid -->
      <div class="grid grid-cols-3 gap-3 mb-6">
        <div class="bg-gray-900 rounded-lg p-4 text-center border border-gray-800">
          <p class="text-xs text-gray-400 mb-1">Earnings</p>
          <p class="text-2xl font-bold text-green-400">${{ earnings.toFixed(2) }}</p>
        </div>
        <div class="bg-gray-900 rounded-lg p-4 text-center border border-gray-800">
          <p class="text-xs text-gray-400 mb-1">Clicks</p>
          <p class="text-2xl font-bold text-blue-400">{{ clicks }}</p>
        </div>
        <div class="bg-gray-900 rounded-lg p-4 text-center border border-gray-800">
          <p class="text-xs text-gray-400 mb-1">Referrals</p>
          <p class="text-2xl font-bold text-purple-400">{{ refs }}</p>
        </div>
      </div>

      <!-- QR Code Section -->
      <div class="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-800">
        <p class="text-sm text-gray-400 mb-3 text-center">Your QR Code</p>
        <div class="flex justify-center mb-4">
          <div v-if="qrCodeUrl" class="bg-white p-4 rounded-lg">
            <img :src="qrCodeUrl" alt="QR Code" class="w-48 h-48" />
          </div>
          <div v-else class="bg-gray-800 rounded-lg p-12 animate-pulse">
            <p class="text-gray-600">Generating...</p>
          </div>
        </div>
        <button
          @click="shareLink"
          class="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          🔗 Share Link
        </button>
      </div>

      <!-- Referral Link -->
      <div class="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-800">
        <p class="text-xs text-gray-400 mb-2">Your Referral Link</p>
        <div class="flex items-center gap-2">
          <input
            :value="referralLink"
            readonly
            class="flex-1 bg-gray-800 text-sm px-3 py-2 rounded border border-gray-700 text-gray-300"
          />
          <button
            @click="copyLink"
            class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-semibold transition-colors"
          >
            {{ copied ? '✓' : 'Copy' }}
          </button>
        </div>
      </div>

      <!-- Withdraw Button -->
      <WithdrawButton :user-id="userId" :balance="earnings" @withdraw="handleWithdraw" />

      <!-- Recent Activity -->
      <div class="mt-6">
        <h2 class="text-lg font-semibold mb-3">📊 Recent Activity</h2>
        <div v-if="recentClicks.length > 0" class="space-y-2">
          <div
            v-for="(click, idx) in recentClicks"
            :key="idx"
            class="bg-gray-900 rounded p-3 border border-gray-800 text-sm"
          >
            <div class="flex justify-between items-center">
              <span class="text-gray-400">Click from {{ click.ip }}</span>
              <span class="text-xs text-gray-500">{{ formatTime(click.timestamp) }}</span>
            </div>
          </div>
        </div>
        <div v-else class="bg-gray-900 rounded p-6 border border-gray-800 text-center text-gray-500">
          No activity yet. Share your link to start earning!
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useTelegramStore } from '@/stores/telegram';
import WithdrawButton from '@/components/WithdrawButton.vue';

const tgStore = useTelegramStore();
const webapp = tgStore.webApp;

const loading = ref(true);
const earnings = ref(0);
const clicks = ref(0);
const refs = ref(0);
const qrCodeUrl = ref('');
const copied = ref(false);
const recentClicks = ref<any[]>([]);

const userId = computed(() => tgStore.user?.id?.toString() || '');
const referralLink = computed(() => `https://t.me/your_bot?start=ref${userId.value}`);

async function loadData() {
  loading.value = true;
  try {
    // Fetch stats from API
    const response = await fetch(`/api/affiliate/ref/${userId.value}/stats`);
    const data = await response.json();
    
    clicks.value = data.totalClicks || 0;
    recentClicks.value = data.recentClicks || [];

    // Fetch earnings (mock for now)
    earnings.value = clicks.value * 2.5; // $2.5 per click
    refs.value = Math.floor(clicks.value / 3); // Assume 1/3 clicks convert

    // Load QR code
    qrCodeUrl.value = `/api/affiliate/qr/${userId.value}`;
  } catch (error) {
    console.error('Failed to load data:', error);
  } finally {
    loading.value = false;
  }
}

function shareLink() {
  if (webapp) {
    webapp.shareURL(referralLink.value, 'Join via my affiliate link!');
  } else {
    copyLink();
  }
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(referralLink.value);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  } catch (error) {
    console.error('Failed to copy:', error);
  }
}

function handleWithdraw() {
  // Navigate to withdrawal flow
  console.log('Withdraw initiated');
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

onMounted(() => {
  loadData();
  // Real-time updates every 30 seconds
  setInterval(loadData, 30000);
});
</script>

