<template>
  <div class="min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Agent Network Tree 🌳</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">Visualize your affiliate network structure</p>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
        <p class="text-sm text-gray-600 dark:text-gray-400">Total Network</p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
          {{ totalNodes }}
        </p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
        <p class="text-sm text-gray-600 dark:text-gray-400">Direct Agents</p>
        <p class="text-2xl font-bold text-blue-600 mt-1">
          {{ directAgents }}
        </p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
        <p class="text-sm text-gray-600 dark:text-gray-400">Network Depth</p>
        <p class="text-2xl font-bold text-purple-600 mt-1">
          {{ maxDepth }} levels
        </p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
        <p class="text-sm text-gray-600 dark:text-gray-400">Network Earnings</p>
        <p class="text-2xl font-bold text-green-600 mt-1">
          ${{ networkEarnings.toFixed(2) }}
        </p>
      </div>
    </div>

    <!-- Controls -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 mb-6">
      <div class="flex flex-wrap items-center gap-4">
        <button
          @click="zoomIn"
          class="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg font-medium transition-colors"
        >
          🔍 Zoom In
        </button>
        <button
          @click="zoomOut"
          class="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg font-medium transition-colors"
        >
          🔍 Zoom Out
        </button>
        <button
          @click="resetZoom"
          class="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg font-medium transition-colors"
        >
          🎯 Reset View
        </button>
        <button
          @click="expandAll"
          class="px-4 py-2 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg font-medium transition-colors"
        >
          ⬇️ Expand All
        </button>
        <button
          @click="collapseAll"
          class="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg font-medium transition-colors"
        >
          ⬆️ Collapse All
        </button>
      </div>
    </div>

    <!-- Tree Visualization -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div
        ref="treeContainer"
        class="w-full"
        style="height: 600px; position: relative;"
      >
        <svg
          ref="treeSvg"
          class="w-full h-full"
        ></svg>
      </div>
    </div>

    <!-- Selected Node Details -->
    <div
      v-if="selectedNode"
      class="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
    >
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Agent Details
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400">Name</p>
          <p class="text-lg font-semibold text-gray-900 dark:text-white mt-1">
            {{ selectedNode.name }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400">Level</p>
          <p class="text-lg font-semibold text-gray-900 dark:text-white mt-1">
            Level {{ selectedNode.level }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400">Sub Agents</p>
          <p class="text-lg font-semibold text-gray-900 dark:text-white mt-1">
            {{ selectedNode.children?.length || 0 }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400">Customers</p>
          <p class="text-lg font-semibold text-gray-900 dark:text-white mt-1">
            {{ selectedNode.customers }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400">Total Earnings</p>
          <p class="text-lg font-semibold text-green-600 mt-1">
            ${{ selectedNode.earnings.toFixed(2) }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400">Status</p>
          <p class="text-lg font-semibold text-gray-900 dark:text-white mt-1">
            <span
              :class="[
                'px-2 py-1 text-xs rounded-full',
                selectedNode.active
                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              ]"
            >
              {{ selectedNode.active ? 'Active' : 'Inactive' }}
            </span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import * as d3 from 'd3';

interface TreeNode {
  id: string;
  name: string;
  level: number;
  customers: number;
  earnings: number;
  active: boolean;
  children?: TreeNode[];
}

const treeContainer = ref<HTMLDivElement | null>(null);
const treeSvg = ref<SVGSVGElement | null>(null);
const selectedNode = ref<TreeNode | null>(null);

// Mock tree data
const treeData: TreeNode = {
  id: 'root',
  name: 'You',
  level: 0,
  customers: 10,
  earnings: 500,
  active: true,
  children: [
    {
      id: 'agent-1',
      name: 'Agent 1',
      level: 1,
      customers: 5,
      earnings: 250,
      active: true,
      children: [
        {
          id: 'agent-1-1',
          name: 'Sub Agent 1.1',
          level: 2,
          customers: 3,
          earnings: 150,
          active: true,
        },
        {
          id: 'agent-1-2',
          name: 'Sub Agent 1.2',
          level: 2,
          customers: 2,
          earnings: 100,
          active: true,
        },
      ],
    },
    {
      id: 'agent-2',
      name: 'Agent 2',
      level: 1,
      customers: 8,
      earnings: 400,
      active: true,
      children: [
        {
          id: 'agent-2-1',
          name: 'Sub Agent 2.1',
          level: 2,
          customers: 4,
          earnings: 200,
          active: true,
        },
      ],
    },
    {
      id: 'agent-3',
      name: 'Agent 3',
      level: 1,
      customers: 6,
      earnings: 300,
      active: false,
    },
  ],
};

const totalNodes = ref(0);
const directAgents = ref(0);
const maxDepth = ref(0);
const networkEarnings = ref(0);

let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
let g: d3.Selection<SVGGElement, unknown, null, undefined>;
let zoom: d3.ZoomBehavior<SVGSVGElement, unknown>;
let tree: d3.TreeLayout<TreeNode>;
let root: d3.HierarchyNode<TreeNode>;

function calculateStats(node: TreeNode, depth = 0): void {
  totalNodes.value++;
  networkEarnings.value += node.earnings;
  if (depth === 1) directAgents.value++;
  if (depth > maxDepth.value) maxDepth.value = depth;

  if (node.children) {
    node.children.forEach((child) => calculateStats(child, depth + 1));
  }
}

function initializeTree() {
  if (!treeSvg.value || !treeContainer.value) return;

  const width = treeContainer.value.clientWidth;
  const height = 600;

  // Clear previous
  d3.select(treeSvg.value).selectAll('*').remove();

  svg = d3.select(treeSvg.value)
    .attr('width', width)
    .attr('height', height);

  g = svg.append('g')
    .attr('transform', `translate(${width / 2}, 50)`);

  // Initialize zoom
  zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.1, 3])
    .on('zoom', (event) => {
      g.attr('transform', event.transform);
    });

  svg.call(zoom);

  // Create tree layout
  tree = d3.tree<TreeNode>()
    .size([width - 200, height - 200])
    .separation((a, b) => (a.parent === b.parent ? 1 : 1.5));

  root = d3.hierarchy(treeData);
  update(root);
}

function update(source: d3.HierarchyNode<TreeNode>) {
  const treeData = tree(root);
  const nodes = treeData.descendants();
  const links = treeData.links();

  // Normalize depth
  nodes.forEach((d) => {
    d.y = d.depth * 150;
  });

  // Links
  const link = g.selectAll('path.link')
    .data(links, (d: any) => d.target.data.id);

  const linkEnter = link.enter()
    .append('path')
    .attr('class', 'link')
    .attr('fill', 'none')
    .attr('stroke', '#94a3b8')
    .attr('stroke-width', 2)
    .attr('d', d3.linkVertical<any, any>()
      .x((d) => d.x)
      .y((d) => d.y));

  link.merge(linkEnter as any)
    .transition()
    .duration(750)
    .attr('d', d3.linkVertical<any, any>()
      .x((d) => d.x)
      .y((d) => d.y));

  link.exit().remove();

  // Nodes
  const node = g.selectAll('g.node')
    .data(nodes, (d: any) => d.data.id);

  const nodeEnter = node.enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', (d) => `translate(${d.x},${d.y})`)
    .on('click', (event, d) => {
      selectedNode.value = d.data;
    });

  // Node circle
  nodeEnter.append('circle')
    .attr('r', 30)
    .attr('fill', (d) => {
      if (d.data.level === 0) return '#3b82f6'; // Blue for root
      if (d.data.level === 1) return '#8b5cf6'; // Purple for level 1
      if (d.data.level === 2) return '#f59e0b'; // Amber for level 2
      return '#10b981'; // Green for level 3+
    })
    .attr('stroke', '#fff')
    .attr('stroke-width', 3)
    .style('cursor', 'pointer')
    .on('mouseover', function() {
      d3.select(this).attr('r', 35);
    })
    .on('mouseout', function() {
      d3.select(this).attr('r', 30);
    });

  // Node label
  nodeEnter.append('text')
    .attr('dy', '.35em')
    .attr('text-anchor', 'middle')
    .attr('fill', '#fff')
    .attr('font-weight', 'bold')
    .attr('font-size', '12px')
    .text((d) => {
      const names = d.data.name.split(' ');
      return names.map(n => n[0]).join('').toUpperCase();
    });

  // Name below node
  nodeEnter.append('text')
    .attr('dy', '2.5em')
    .attr('text-anchor', 'middle')
    .attr('fill', '#374151')
    .attr('font-size', '11px')
    .text((d) => d.data.name);

  // Stats below name
  nodeEnter.append('text')
    .attr('dy', '4em')
    .attr('text-anchor', 'middle')
    .attr('fill', '#6b7280')
    .attr('font-size', '10px')
    .text((d) => `${d.data.customers} customers`);

  node.merge(nodeEnter as any)
    .transition()
    .duration(750)
    .attr('transform', (d) => `translate(${d.x},${d.y})`);

  node.exit().remove();
}

function zoomIn() {
  svg.transition().call(zoom.scaleBy as any, 1.3);
}

function zoomOut() {
  svg.transition().call(zoom.scaleBy as any, 0.7);
}

function resetZoom() {
  svg.transition().call(zoom.transform as any, d3.zoomIdentity);
}

function expandAll() {
  root.descendants().forEach((d: any) => {
    if (d._children) {
      d.children = d._children;
      d._children = null;
    }
  });
  update(root);
}

function collapseAll() {
  root.descendants().forEach((d: any) => {
    if (d.children && d.depth > 0) {
      d._children = d.children;
      d.children = null;
    }
  });
  update(root);
}

onMounted(() => {
  calculateStats(treeData);
  initializeTree();

  // Handle window resize
  const handleResize = () => {
    initializeTree();
  };
  window.addEventListener('resize', handleResize);

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
  });
});
</script>