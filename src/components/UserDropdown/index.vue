<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import ChangePasswordDialog from './components/ChangePasswordDialog.vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const passwordDialogVisible = ref(false)

async function handleUserCommand(command) {
  if (command === 'password') {
    passwordDialogVisible.value = true
    return
  }

  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出当前登录吗？', '退出登录', {
        confirmButtonText: '退出',
        cancelButtonText: '取消',
        type: 'warning',
      })
    } catch {
      return
    }
    authStore.logout()
    ElMessage.success('已退出登录')
    router.replace('/login')
  }
}
</script>

<template>
  <el-dropdown trigger="hover" class="user-dropdown" @command="handleUserCommand">
    <div class="user-info">
      <el-avatar :size="32" class="user-avatar">🌸</el-avatar>
      <span class="user-name">{{ authStore.username || '用户' }}</span>
      <el-icon class="user-arrow"><CaretBottom /></el-icon>
    </div>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="password">
          <el-icon><Key /></el-icon>
          修改密码
        </el-dropdown-item>
        <el-dropdown-item command="logout" divided>
          <el-icon><SwitchButton /></el-icon>
          退出登录
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>

  <!-- 修改密码弹窗 -->
  <ChangePasswordDialog v-model="passwordDialogVisible" />
</template>

<style scoped>
.user-dropdown {
  margin-left: auto;
  outline: none;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 18px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.user-info:hover {
  background-color: var(--el-fill-color-light);
}

.user-avatar {
  font-size: 18px;
  background: linear-gradient(135deg, #e8f1ff, #f5e9ff);
  flex-shrink: 0;
}

.user-name {
  font-size: 14px;
  color: var(--el-text-color-primary);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-arrow {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
