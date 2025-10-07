import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/views/Dashboard.vue'),
  },
  {
    path: '/tree',
    name: 'tree',
    component: () => import('@/views/AgentTree.vue'),
  },
  {
    path: '/commissions',
    name: 'commissions',
    component: () => import('@/views/Commissions.vue'),
  },
  {
    path: '/customers',
    name: 'customers',
    component: () => import('@/views/Customers.vue'),
  },
  {
    path: '/deposits',
    name: 'deposits',
    component: () => import('@/views/Deposits.vue'),
  },
  {
    path: '/affiliate',
    name: 'affiliate',
    component: () => import('@/views/AffiliateHub.vue'),
  },
  {
    path: '/super-agent',
    name: 'super-agent',
    component: () => import('@/views/SuperAgentPanel.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;

