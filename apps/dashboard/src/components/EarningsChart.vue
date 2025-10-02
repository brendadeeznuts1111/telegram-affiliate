<template>
  <div class="earnings-chart">
    <svg :width="width" :height="height" class="w-full">
      <polyline
        :points="linePoints"
        fill="none"
        stroke="#10b981"
        stroke-width="2"
        class="drop-shadow-lg"
      />
      <polyline
        :points="areaPoints"
        fill="url(#gradient)"
        opacity="0.3"
      />
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#10b981;stop-opacity:0.5" />
          <stop offset="100%" style="stop-color:#10b981;stop-opacity:0" />
        </linearGradient>
      </defs>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  data: Array<{ date: string; amount: number }>;
}>();

const width = 300;
const height = 100;
const padding = 10;

const linePoints = computed(() => {
  if (!props.data || props.data.length === 0) return '';
  
  const maxValue = Math.max(...props.data.map(d => d.amount));
  const stepX = (width - padding * 2) / (props.data.length - 1);
  
  return props.data
    .map((d, i) => {
      const x = padding + i * stepX;
      const y = height - padding - ((d.amount / maxValue) * (height - padding * 2));
      return `${x},${y}`;
    })
    .join(' ');
});

const areaPoints = computed(() => {
  if (!linePoints.value) return '';
  const lastPoint = props.data.length - 1;
  const stepX = (width - padding * 2) / (props.data.length - 1);
  return `${padding},${height - padding} ${linePoints.value} ${padding + lastPoint * stepX},${height - padding}`;
});
</script>

