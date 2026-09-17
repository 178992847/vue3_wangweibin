import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { login as loginApi, changePassword as changePasswordApi } from '@/api/auth'
import { getToken, getUsername, setAuth, clearAuth } from '@/utils/auth'

export const useAuthStore = defineStore('auth', () => {
  // 初始化时从本地存储恢复登录态
  const token = ref(getToken())
  const username = ref(getUsername())

  // 会话状态：仅反映内存中的登录态（登录 / 退出时响应式更新）。
  // 注意：token 是否「实时有效」（过期 / 被手动删除）请在路由守卫中
  // 直接调用 isTokenValid() 实时读取 localStorage，不要依赖此 computed——
  // localStorage 的外部变化不是响应式的，computed 会缓存旧结果。
  const isAuthenticated = computed(() => Boolean(token.value))

  /**
   * 登录：请求接口 -> 持久化 token（含 1 小时过期时间）
   */
  async function login(form) {
    const data = await loginApi(form)
    setAuth(data.token, data.username)
    token.value = data.token
    username.value = data.username
    return data
  }

  /**
   * 修改密码
   * @param {{ oldPassword: string, newPassword: string }} payload
   */
  async function changePassword(payload) {
    return changePasswordApi({ username: username.value, ...payload })
  }

  /**
   * 退出登录：清空状态与本地存储
   */
  function logout() {
    clearAuth()
    token.value = ''
    username.value = ''
  }

  return { token, username, isAuthenticated, login, changePassword, logout }
})
