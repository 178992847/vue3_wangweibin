/**
 * 登录态本地存储工具
 * 统一管理 token 及其过期时间，业务代码不要直接操作 localStorage
 */

const TOKEN_KEY = 'admin_token'
const EXPIRE_AT_KEY = 'admin_token_expire_at'
const USERNAME_KEY = 'admin_username'

// token 有效期：1 小时（毫秒）
export const TOKEN_DURATION = 60 * 60 * 1000

/**
 * 保存登录信息，同时写入过期时间戳
 * @param {string} token
 * @param {string} username
 */
export function setAuth(token, username) {
  const expireAt = Date.now() + TOKEN_DURATION
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(EXPIRE_AT_KEY, String(expireAt))
  if (username) {
    localStorage.setItem(USERNAME_KEY, username)
  }
}

/**
 * 判断 token 是否存在且仍在有效期内
 * @returns {boolean}
 */
export function isTokenValid() {
  const token = localStorage.getItem(TOKEN_KEY)
  const expireAt = Number(localStorage.getItem(EXPIRE_AT_KEY) || 0)
  return Boolean(token) && Boolean(expireAt) && Date.now() < expireAt
}

/**
 * 获取未过期的 token；不存在或已过期则返回 null
 * @returns {string | null}
 */
export function getToken() {
  return isTokenValid() ? localStorage.getItem(TOKEN_KEY) : null
}

/**
 * 判断本地是否存在「已过期」的登录记录
 * 用于区分「从未登录」和「登录已过期」两种场景
 * @returns {boolean}
 */
export function hasExpiredToken() {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return false
  const expireAt = Number(localStorage.getItem(EXPIRE_AT_KEY) || 0)
  return !expireAt || Date.now() >= expireAt
}

export function getUsername() {
  return localStorage.getItem(USERNAME_KEY) || ''
}

/**
 * 清除全部登录信息（退出登录 / 登录过期时调用）
 */
export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(EXPIRE_AT_KEY)
  localStorage.removeItem(USERNAME_KEY)
}
