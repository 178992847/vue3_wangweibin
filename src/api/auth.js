/**
 * 鉴权相关接口
 * 当前项目无后端，使用 mock 模拟异步登录请求；
 * 接入真实后端时，只需将 login 的实现替换为 request.post('/login', data) 即可，
 * 保持返回数据结构 { token, username } 不变。
 */

// 演示账号
const MOCK_USERS = [
  { username: '王伟斌', password: '123456' },
  { username: 'admin', password: '123456' },
]

function mockRequest(data, delay = 500) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const matched = MOCK_USERS.find(
        (user) => user.username === data.username && user.password === data.password,
      )
      if (!matched) {
        reject(new Error('用户名或密码错误'))
        return
      }
      resolve({
        token: `mock-token-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        username: matched.username,
      })
    }, delay)
  })
}

/**
 * 登录接口
 * @param {{ username: string, password: string }} data
 * @returns {Promise<{ token: string, username: string }>}
 */
export function login(data) {
  return mockRequest(data)
}

/**
 * 修改密码接口（mock）
 * 真实后端替换为：request.post('/user/change-password', data)
 * @param {{ username: string, oldPassword: string, newPassword: string }} data
 * @returns {Promise<{ success: boolean }>}
 */
export function changePassword(data) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = MOCK_USERS.find((item) => item.username === data.username)
      if (!user || user.password !== data.oldPassword) {
        reject(new Error('原密码错误'))
        return
      }
      if (data.oldPassword === data.newPassword) {
        reject(new Error('新密码不能与原密码相同'))
        return
      }
      // mock：更新内存中的密码（刷新页面后重置为 123456）
      user.password = data.newPassword
      resolve({ success: true })
    }, 500)
  })
}
