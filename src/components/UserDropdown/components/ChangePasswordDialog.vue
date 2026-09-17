<script setup>
import { nextTick, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const visible = defineModel({ type: Boolean, default: false })

// 其他示例
// 无参数 v-model —— 名字固定省略，对应父组件 v-model
// const visible = defineModel({ type: Boolean, default: false })

// 带参数 v-model:title —— 第一个参数就是名字
// const title = defineModel('title', { type: String, default: '修改密码' })

// 带参数 v-model:loading —— 第一个参数就是名字
// const loading = defineModel('loading', { type: Boolean, default: false })

const authStore = useAuthStore()

const formRef = ref(null)
const submitting = ref(false)

const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// 新密码不能与原密码相同
const validateNewPassword = (_rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入新密码'))
  } else if (value.length < 6) {
    callback(new Error('新密码长度不能少于 6 位'))
  } else if (value === form.oldPassword) {
    callback(new Error('新密码不能与原密码相同'))
  } else {
    if (form.confirmPassword) {
      formRef.value?.validateField('confirmPassword')
    }
    callback()
  }
}

// 两次输入的新密码必须一致
const validateConfirmPassword = (_rule, value, callback) => {
  if (!value) {
    callback(new Error('请再次输入新密码'))
  } else if (value !== form.newPassword) {
    callback(new Error('两次输入的新密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [{ required: true, validator: validateNewPassword, trigger: 'blur' }],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' },
  ],
}

// 每次打开弹窗时重置表单
watch(
  visible,
  async (value) => {
    if (!value) return
    form.oldPassword = ''
    form.newPassword = ''
    form.confirmPassword = ''
    await nextTick()
    formRef.value?.clearValidate()
  },
)

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  submitting.value = true
  try {
    await authStore.changePassword({
      oldPassword: form.oldPassword,
      newPassword: form.newPassword,
    })
    ElMessage.success('密码修改成功，下次登录请使用新密码')
    visible.value = false
  } catch (error) {
    ElMessage.error(error.message || '密码修改失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <el-dialog v-model="visible" title="修改密码" width="420px" :close-on-click-modal="false">
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="84px"
      class="password-form"
      @keyup.enter="handleSubmit"
    >
      <el-form-item label="原密码" prop="oldPassword">
        <el-input
          v-model="form.oldPassword"
          type="password"
          placeholder="请输入原密码"
          show-password
        >
          <template #prefix><el-icon><Lock /></el-icon></template>
        </el-input>
      </el-form-item>
      <el-form-item label="新密码" prop="newPassword">
        <el-input
          v-model="form.newPassword"
          type="password"
          placeholder="不少于 6 位"
          show-password
        >
          <template #prefix><el-icon><Lock /></el-icon></template>
        </el-input>
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input
          v-model="form.confirmPassword"
          type="password"
          placeholder="请再次输入新密码"
          show-password
        >
          <template #prefix><el-icon><Lock /></el-icon></template>
        </el-input>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        确认修改
      </el-button>
    </template>
  </el-dialog>
</template>
