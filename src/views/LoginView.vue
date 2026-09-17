<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: '',
})

const formRules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleLogin() {
  if (!loginFormRef.value) return
  try {
    await loginFormRef.value.validate()
  } catch {
    return
  }

  loading.value = true
  try {
    await authStore.login({ ...loginForm })
    ElMessage.success('登录成功 🎉')
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/home'
    router.replace(redirect)
  } catch (error) {
    ElMessage.error(error.message || '登录失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <!-- 背景装饰 -->
    <span class="deco deco-1">🌸</span>
    <span class="deco deco-2">☁️</span>
    <span class="deco deco-3">🌿</span>
    <span class="deco deco-4">✨</span>

    <el-card class="login-card" shadow="never">
      <div class="login-header">
        <div class="login-logo">🌸</div>
        <h1 class="login-title">管理系统</h1>
        <p class="login-subtitle">欢迎回来，请登录后继续使用</p>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="formRules"
        size="large"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入账号"
            clearable
          >
            <template #prefix><el-icon><User /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
          >
            <template #prefix><el-icon><Lock /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="login-btn" :loading="loading" @click="handleLogin">
            登 录
          </el-button>
        </el-form-item>
      </el-form>

      <p class="login-tip">演示账号：admin　密码：123456</p>
    </el-card>
  </div>
</template>

<style scoped>
.login-page {
  position: relative;
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: hidden;
  background: linear-gradient(135deg, #e0edff 0%, #f3e8ff 55%, #fef0f6 100%);
}

/* 漂浮的可爱装饰 */
.deco {
  position: absolute;
  font-size: 34px;
  opacity: 0.55;
  user-select: none;
  pointer-events: none;
  animation: float 6s ease-in-out infinite;
}

.deco-1 {
  top: 12%;
  left: 14%;
}

.deco-2 {
  top: 18%;
  right: 16%;
  font-size: 42px;
  animation-delay: 1.2s;
}

.deco-3 {
  bottom: 14%;
  left: 18%;
  font-size: 40px;
  animation-delay: 2s;
}

.deco-4 {
  bottom: 20%;
  right: 13%;
  animation-delay: 0.6s;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-14px);
  }
}

.login-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 400px;
  border: none;
  border-radius: 18px;
  box-shadow: 0 18px 50px rgba(124, 58, 237, 0.12);
}

.login-card :deep(.el-card__body) {
  padding: 40px 36px 28px;
}

.login-header {
  text-align: center;
  margin-bottom: 28px;
}

.login-logo {
  width: 64px;
  height: 64px;
  margin: 0 auto 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e8f1ff, #f5e9ff);
}

.login-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  background: linear-gradient(120deg, #409eff, #7c3aed);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.login-subtitle {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.login-form {
  margin-top: 8px;
}

.login-form :deep(.el-input__wrapper) {
  border-radius: 10px;
}

.login-btn {
  width: 100%;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  letter-spacing: 4px;
  background: linear-gradient(120deg, #409eff, #7c3aed);
}

.login-btn:hover {
  opacity: 0.92;
}

.login-tip {
  margin: 4px 0 0;
  text-align: center;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
</style>
