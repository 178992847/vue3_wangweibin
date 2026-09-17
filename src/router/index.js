import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { hasExpiredToken, isTokenValid } from '@/utils/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/home',
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/LoginView.vue'),
      meta: { title: '登录', public: true, layout: false },
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

// 全局前置守卫：校验登录态与 token 有效期（1 小时）
router.beforeEach((to) => {
  const authStore = useAuthStore()
  // 每次路由切换都「实时」读取 localStorage 校验，不能用带缓存的响应式状态——
  // localStorage 被手动删除时没有任何响应式信号，缓存会导致校验失效
  const valid = isTokenValid()
  // 场景一：本地存在已过期的登录记录（如 1 小时到期后刷新页面）
  const expiredRecord = hasExpiredToken()
  // 场景二：本次页面运行期间曾登录（内存会话仍在），但本地 token 已失效
  //         ——包括到期、localStorage 中的 token 被手动删除
  const sessionLost = Boolean(authStore.token) && !valid

  // 已登录时访问登录页，直接进入首页
  if (to.meta.public) {
    if (to.name === 'Login' && valid) {
      return { path: '/home' }
    }
    return true
  }

  // 非公开页面必须持有有效 token，否则跳转登录页
  if (!valid) {
    // 登录过期 / token 被清除时给出提示；从未登录则静默跳转
    if (expiredRecord || sessionLost) {
      ElMessage.warning('登录已过期，请重新登录')
    }
    authStore.logout()
    return {
      path: '/login',
      query: to.fullPath && to.fullPath !== '/home' ? { redirect: to.fullPath } : undefined,
    }
  }

  return true
})

export default router
