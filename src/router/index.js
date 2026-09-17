import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/home',
    },
    {
      path: '/home',
      name: 'Home',
      component: () => import('@/views/HomeView.vue'),
      meta: { title: '首页' },
    },
    {
      path: '/form/editable-tabs',
      name: 'FormEditableTabs',
      component: () => import('@/views/FormTabsView.vue'),
      meta: { title: '可编辑标签页', group: '表单管理' },
    },
  ],
})

export default router
