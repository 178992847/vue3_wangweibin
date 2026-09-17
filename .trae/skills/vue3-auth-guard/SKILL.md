---
name: vue3-auth-guard
description: Vue3 + Pinia + Vue Router + Element Plus 登录鉴权与 token 过期拦截的实现及排障。新增登录页、注册路由守卫、管理 token 有效期，或排查删除/过期 token 后切换页面仍不跳登录页的问题时使用。
---

# Vue3 登录鉴权与 Token 过期拦截

本项目（vue3_wangweibin）登录鉴权的标准实现规范。涉及登录页、token、路由守卫的需求按此执行，不要另起一套机制。

## 标准分层（已存在，改动前先读）

| 文件 | 职责 |
|------|------|
| `src/utils/auth.js` | token 唯一出入口：`setAuth` / `isTokenValid` / `getToken` / `hasExpiredToken` / `getUsername` / `clearAuth`，业务代码禁止直接读写 localStorage 的 `admin_*` 键 |
| `src/api/auth.js` | 鉴权接口层。当前为 mock（演示账号 admin / 123456），接真实后端时只替换函数实现，保持返回结构 `{ token, username }` 不变 |
| `src/stores/auth.js` | Pinia store：`login` / `changePassword` / `logout`；`token`、`username`、`isAuthenticated` |
| `src/router/index.js` | 路由表 + `beforeEach` 全局守卫，是登录态校验的唯一统一入口 |
| `src/views/LoginView.vue` | 简约全屏登录页（账号密码必填校验、回车提交、redirect 回跳） |
| `src/App.vue` | 用 `route.meta.layout === false` 让登录页脱离后台布局；右上角头像下拉含修改密码、退出登录 |

## 关键约定

1. **token 有效期 1 小时**：登录时同时写入 `admin_token` 与 `admin_token_expire_at`（时间戳 = `Date.now() + TOKEN_DURATION`）。改时长只改 `src/utils/auth.js` 的 `TOKEN_DURATION`。
2. **守卫必须每次实时读取 localStorage**：`beforeEach` 内直接调用 `isTokenValid()`，并区分两种失效场景决定提示语：
   - `hasExpiredToken()` 为 true —— 本地有过期记录（1 小时到期 / 刷新后打开），提示「登录已过期，请重新登录」。
   - `authStore.token` 存在但 `isTokenValid()` 为 false —— 本次会话内 token 被删或刚过期，同样提示过期。
   - 两者都不满足 —— 从未登录，静默跳 `/login`，不弹提示。
3. **非公开路由无有效 token 一律拦截**，并携带 `redirect=to.fullPath`（`/home` 除外），登录成功后 `router.replace(redirect)`。
4. 全屏页（登录页）路由必须加 `meta: { public: true, layout: false }`。
5. 修改密码走 `api/auth.js` → store action 的正常分层；退出登录需二次确认，再 `logout()` + `router.replace('/login')`。

## 三大高频坑（排障先核对）

### 1. 删 token 后不刷新、切菜单仍能进页面 —— computed 缓存

`localStorage` 不是 Vue 响应式数据。这样写的 computed 只会在 `token` ref 变化时重算，外部删除 localStorage 时守卫读到的是缓存旧值 true：

```js
// 错误写法
const isAuthenticated = computed(() => {
  void token.value
  return isTokenValid()   // localStorage 外部变化永远感知不到
})
```

正确做法：store 的 `isAuthenticated` 只表达内存会话（`Boolean(token.value)`）；守卫里**直接调用** `isTokenValid()` 实时读 localStorage。凡是需要「此刻是否有效」的判定，都不能依赖 computed 缓存。

### 2. 改了守卫代码但行为不变 —— 模块热替换 ≠ 应用重新初始化

守卫是启动时注册在 router 实例上的回调：`main.js` 执行 `app.use(router)` 后 app 永久持有该实例。热替换 `router/index.js` 只会让新模块再 `createRouter()` 出一个没人 `app.use` 的「孤儿实例」，已挂载 app 仍跑旧实例上的旧守卫；`main.js` 不会随 HMR 重跑。

- Vite 默认规则：模块没有 `import.meta.hot.accept` 时更新沿 import 链冒泡，到入口仍无边界会触发 **full reload（自动整页刷新）**，本项目即属此类，刷新后守卫正常重注册。
- 例外（真的不生效）：HMR 通道失效（dev server 重启过、WebSocket 断开、标签长期后台节流）导致 full-reload 消息没执行；或模块链上有人 accept 了更新却没重新 `app.use`。
- `.vue` 由 @vitejs/plugin-vue 注册为组件级 HMR 边界，只换组件定义、不动 app/router 实例，所以组件改动即时生效。
- 实操：修改 `src/router/index.js`、`src/main.js` 后行为不符预期，先 **Ctrl+F5** 再下结论；可在守卫里临时加 `console.log`（点菜单看是否打印）区分「新代码没挂载」还是「逻辑有问题」。交付时主动提醒用户硬刷新。

### 3. 提示语逻辑误判 —— 先检测再取 store

`getToken()`/store 初始化可能清理过期记录，因此守卫中「是否有过期记录」的判断（`hasExpiredToken()`）要放在读取/可能触发清理的操作附近并在当次导航内完成，不能先 `logout()` 再判断。判定顺序：`isTokenValid()` → `hasExpiredToken()` → 会话丢失 → 提示 → `logout()` → 跳转。

## Windows 环境注意

本机 PowerShell 禁用了脚本执行，`npm`（.ps1）会报 PSSecurityException，命令一律用 `npm.cmd`，例如 `npm.cmd run dev`、`npm.cmd run build`。

## 验证清单

- `npm.cmd run build` 通过、`GetDiagnostics` 无报错。
- 手测路径：登录（admin/123456）→ 进首页；Application 面板删除 `admin_*` 键 → **不刷新**点左侧菜单 → 立即提示过期并跳登录页，登录后回跳原页面。
- 1 小时到期（可用 `localStorage.setItem('admin_token_expire_at', String(Date.now()-1000))` 模拟）切菜单同样拦截。
- 1 小时内 F5 整页刷新应免登录直接进入。
