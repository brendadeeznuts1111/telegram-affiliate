<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        {{ title }}
      </h3>
      <select
        v-model="selectedPeriod"
        class="text-sm px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="7d">Last 7 Days</option>
        <option value="30d">Last 30 Days</option>
        <option value="90d">Last 90 Days</option>
        <option value="1y">Last Year</option>
      </select>
    </div>

    <!-- Chart Area -->
    <div class="relative" style="height: 300px;">
      <canvas ref="chartCanvas"></canvas>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div>
        <p class="text-xs text-gray-600 dark:text-gray-400">Total</p>
        <p class="text-lg font-semibold text-gray-900 dark:text-white mt-1">
          ${{ totalEarnings.toFixed(2) }}
        </p>
      </div>
      <div>
        <p class="text-xs text-gray-600 dark:text-gray-400">Average</p>
        <p class="text-lg font-semibold text-gray-900 dark:text-white mt-1">
          ${{ averageEarnings.toFixed(2) }}
        </p>
      </div>
      <div>
        <p class="text-xs text-gray-600 dark:text-gray-400">Peak Day</p>
        <p class="text-lg font-semibold text-gray-900 dark:text-white mt-1">
          ${{ peakEarnings.toFixed(2) }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';

export interface ChartDataPoint {
  date: string;
  amount: number;
}

interface Props {
  title?: string;
  data: ChartDataPoint[];
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Earnings Overview',
});

const chartCanvas = ref<HTMLCanvasElement | null>(null);
const selectedPeriod = ref('30d');

// Mock chart rendering (in real app, use Chart.js or similar)
const chartData = computed(() => {
  // Filter data based on selected period
  const days = selectedPeriod.value === '7d' ? 7 : selectedPeriod.value === '30d' ? 30 : 90;
  return props.data.slice(-days);
});

const totalEarnings = computed(() => {
  return chartData.value.reduce((sum, d) => sum + d.amount, 0);
});

const averageEarnings = computed(() => {
  return chartData.value.length > 0 ? totalEarnings.value / chartData.value.length : 0;
});

const peakEarnings = computed(() => {
  return Math.max(...chartData.value.map(d => d.amount), 0);
});

function drawChart() {
  if (!chartCanvas.value) return;

  const ctx = chartCanvas.value.getContext('2d');
  if (!ctx) return;

  const canvas = chartCanvas.value;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;

  // Clear canvas
  ctx.clearRect(0, 0, rect.width, rect.height);

  if (chartData.value.length === 0) return;

  // Simple line chart
  const padding = 20;
  const chartWidth = rect.width - padding * 2;
  const chartHeight = rect.height - padding * 2;

  const max = Math.max(...chartData.value.map(d => d.amount));
  const xStep = chartWidth / (chartData.value.length - 1);

  // Draw gradient
  const gradient = ctx.createLinearGradient(0, padding, 0, rect.height - padding);
  gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
  gradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');

  ctx.beginPath();
  ctx.moveTo(padding, rect.height - padding);

  chartData.value.forEach((point, i) => {
    const x = padding + i * xStep;
    const y = rect.height - padding - (point.amount / max) * chartHeight;
    
    if (i === 0) {
      ctx.lineTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.lineTo(rect.width - padding, rect.height - padding);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // Draw line
  ctx.beginPath();
  chartData.value.forEach((point, i) => {
    const x = padding + i * xStep;
    const y = rect.height - padding - (point.amount / max) * chartHeight;
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw points
  chartData.value.forEach((point, i) => {
    const x = padding + i * xStep;
    const y = rect.height - padding - (point.amount / max) * chartHeight;
    
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#3b82f6';
    ctx.fill();
  });
}

onMounted(() => {
  drawChart();
  window.addEventListener('resize', drawChart);
});

watch([selectedPeriod, () => props.data], () => {
  drawChart();
});
</script>