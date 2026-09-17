<script setup>
/**
 * 用户新增 / 编辑弹窗
 * - visible 用 defineModel 双向绑定
 * - 打开时把传入的 user 拷贝到本地表单，编辑过程中不污染源数据，提交时才 emit('submit')
 * - user 为 null 表示新增
 */
import { nextTick, reactive, ref, watch } from 'vue'

const props = defineProps({
  // 当前编辑的用户；null = 新增
  user: {
    type: Object,
    default: null,
  },
  deptOptions: {
    type: Array,
    default: () => [],
  },
  roleOptions: {
    type: Array,
    default: () => [],
  },
  // 提交中的加载态（父层异步保存时禁用按钮）
  submitting: {
    type: Boolean,
    default: false,
  },
})

const visible = defineModel()

const emit = defineEmits(['submit'])

const formRef = ref(null)

function createEmptyForm() {
  return {
    id: null,
    name: '',
    account: '',
    dept: '',
    role: '',
    status: 1,
  }
}

const form = reactive(createEmptyForm())

const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  account: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z][a-zA-Z0-9_]{2,15}$/,
      message: '3-16 位，字母开头，可含字母/数字/下划线',
      trigger: 'blur',
    },
  ],
  dept: [{ required: true, message: '请选择部门', trigger: 'change' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
}

// 弹窗打开：初始化表单副本并清掉上一次的校验状态
watch(visible, async (open) => {
  if (!open) return
  Object.assign(form, createEmptyForm(), props.user ? { ...props.user } : {})
  await nextTick()
  formRef.value?.clearValidate()
})

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  // 返回副本，避免父层异步保存期间弹窗内部状态继续变化
  emit('submit', { ...form })
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="user ? '编辑用户' : '新增用户'"
    width="460px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="72px"
      class="user-form"
      @keyup.enter="handleSubmit"
    >
      <el-form-item label="姓名" prop="name">
        <el-input v-model="form.name" placeholder="请输入姓名" clearable maxlength="12" />
      </el-form-item>
      <el-form-item label="账号" prop="account">
        <el-input v-model="form.account" placeholder="请输入账号" clearable maxlength="16" />
      </el-form-item>
      <el-form-item label="部门" prop="dept">
        <el-select v-model="form.dept" placeholder="请选择部门" class="form-select">
          <el-option v-for="item in deptOptions" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
      <el-form-item label="角色" prop="role">
        <el-select v-model="form.role" placeholder="请选择角色" class="form-select">
          <el-option v-for="item in roleOptions" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-switch
          v-model="form.status"
          :active-value="1"
          :inactive-value="0"
          active-text="启用"
          inactive-text="停用"
          inline-prompt
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.form-select {
  width: 100%;
}
</style>
