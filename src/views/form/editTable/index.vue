<script setup>
/**
 * 编辑表格页
 * 职责（编排层）：持有全部数据与业务规则，串联 查询栏 / 表格 / 弹窗 三个子组件。
 * 当前无后端，用本地 mock 数据 + setTimeout 模拟接口延迟；接入接口时只需把
 * loadData / handleSubmit / 删除处理替换为 api 调用，子组件与 ProTable 无需改动。
 */
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import UserSearchBar from './components/UserSearchBar.vue'
import UserTable from './components/UserTable.vue'
import UserFormDialog from './components/UserFormDialog.vue'

// ---------- 常量选项（页面层统一维护，下发给查询栏与弹窗） ----------
const DEPT_OPTIONS = ['研发部', '产品部', '市场部', '运营部']
const ROLE_OPTIONS = ['管理员', '运营', '普通用户']

// ---------- mock 数据 ----------
const users = ref([
  { id: 1, name: '张伟', account: 'zhangwei', dept: '研发部', role: '管理员', status: 1, createDate: '2026-08-02 09:12:30' },
  { id: 2, name: '李娜', account: 'lina', dept: '产品部', role: '运营', status: 1, createDate: '2026-08-05 14:05:11' },
  { id: 3, name: '王强', account: 'wangqiang', dept: '研发部', role: '普通用户', status: 0, createDate: '2026-08-08 10:41:52' },
  { id: 4, name: '刘洋', account: 'liuyang', dept: '市场部', role: '运营', status: 1, createDate: '2026-08-10 16:20:43' },
  { id: 5, name: '陈静', account: 'chenjing', dept: '运营部', role: '普通用户', status: 1, createDate: '2026-08-12 11:30:07' },
  { id: 6, name: '杨帆', account: 'yangfan', dept: '研发部', role: '普通用户', status: 1, createDate: '2026-08-15 08:55:19' },
  { id: 7, name: '赵敏', account: 'zhaomin', dept: '产品部', role: '普通用户', status: 0, createDate: '2026-08-18 13:47:26' },
  { id: 8, name: '孙磊', account: 'sunlei', dept: '市场部', role: '普通用户', status: 1, createDate: '2026-08-20 17:02:38' },
  { id: 9, name: '周婷', account: 'zhouting', dept: '运营部', role: '运营', status: 1, createDate: '2026-08-23 09:26:54' },
  { id: 10, name: '吴鹏', account: 'wupeng', dept: '研发部', role: '普通用户', status: 1, createDate: '2026-08-26 15:14:02' },
  { id: 11, name: '郑爽', account: 'zhengshuang', dept: '产品部', role: '普通用户', status: 1, createDate: '2026-08-29 10:38:45' },
  { id: 12, name: '冯雪', account: 'fengxue', dept: '运营部', role: '普通用户', status: 0, createDate: '2026-09-02 14:51:13' },
  { id: 13, name: '褚亮', account: 'chuliang', dept: '市场部', role: '运营', status: 1, createDate: '2026-09-07 09:03:27' },
  { id: 14, name: '卫东', account: 'weidong', dept: '研发部', role: '管理员', status: 1, createDate: '2026-09-12 16:29:58' },
])

// ---------- 查询 / 分页 / 加载状态 ----------
// query：查询栏正在编辑的草稿；appliedQuery：点「查询」后才生效的条件快照。
// 两者分离，保证改部门/状态时不会即时过滤，必须点查询（或回车）才生效。
const query = reactive({ keyword: '', dept: '', status: '' })
const appliedQuery = reactive({ keyword: '', dept: '', status: '' })
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const loading = ref(false)
const selectedRows = ref([])
const userTableRef = ref(null)

// 前端过滤（接接口时此 computed 换成接口返回值即可），只依赖「已生效」的条件
const filteredUsers = computed(() => {
  const keyword = appliedQuery.keyword.trim().toLowerCase()
  return users.value.filter((user) => {
    const matchKeyword =
      !keyword ||
      user.name.toLowerCase().includes(keyword) ||
      user.account.toLowerCase().includes(keyword)
    const matchDept = !appliedQuery.dept || user.dept === appliedQuery.dept
    const matchStatus = appliedQuery.status === '' || user.status === Number(appliedQuery.status)
    return matchKeyword && matchDept && matchStatus
  })
})

// 当前页切片
const pagedUsers = computed(() => {
  const start = (pagination.page - 1) * pagination.pageSize
  return filteredUsers.value.slice(start, start + pagination.pageSize)
})

// 总数随过滤结果同步
watch(filteredUsers, (list) => {
  pagination.total = list.length
}, { immediate: true })

// 模拟接口请求：递增序号丢弃过期响应，避免快速操作时旧请求覆盖
let requestSeq = 0
function loadData() {
  const seq = ++requestSeq
  loading.value = true
  setTimeout(() => {
    if (seq !== requestSeq) return
    loading.value = false
  }, 250)
}

// 删除后若当前页已空，回退到上一有效页
function correctPage() {
  const maxPage = Math.max(1, Math.ceil(filteredUsers.value.length / pagination.pageSize))
  if (pagination.page > maxPage) pagination.page = maxPage
}

// ---------- 查询 ----------
function handleSearch() {
  // 提交草稿为生效条件（computed 依赖 appliedQuery，此时才会重新过滤）
  Object.assign(appliedQuery, query)
  pagination.page = 1
  loadData()
}

function handleReset() {
  query.keyword = ''
  query.dept = ''
  query.status = ''
  // 重置是明确动作，草稿与生效条件一并清空，立即恢复全部数据
  Object.assign(appliedQuery, query)
  pagination.page = 1
  loadData()
}

function handlePaginationChange({ page, pageSize }) {
  pagination.page = page
  pagination.pageSize = pageSize
  loadData()
}

function handleSelectionChange(rows) {
  selectedRows.value = rows
}

// ---------- 新增 / 编辑 ----------
const dialogVisible = ref(false)
const submitting = ref(false)
const currentUser = ref(null) // null = 新增；对象 = 编辑其副本

function openAdd() {
  currentUser.value = null
  dialogVisible.value = true
}

function openEdit(row) {
  currentUser.value = { ...row }
  dialogVisible.value = true
}

function formatDateTime(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} `
    + `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function handleSubmit(form) {
  // 账号唯一性校验（编辑时排除自身）
  const duplicated = users.value.some(
    (user) => user.account === form.account && user.id !== form.id,
  )
  if (duplicated) {
    ElMessage.error(`账号「${form.account}」已存在`)
    return
  }

  submitting.value = true
  // 模拟保存接口
  setTimeout(() => {
    if (form.id !== null) {
      const index = users.value.findIndex((user) => user.id === form.id)
      if (index > -1) users.value[index] = { ...users.value[index], ...form }
      ElMessage.success('修改成功 🎉')
    } else {
      const nextId = users.value.reduce((max, user) => Math.max(max, user.id), 0) + 1
      users.value.unshift({ ...form, id: nextId, createDate: formatDateTime() })
      pagination.page = 1 // 新增数据在最前，回到第一页查看
      ElMessage.success('新增成功 🎉')
    }
    submitting.value = false
    dialogVisible.value = false
  }, 300)
}

// ---------- 删除 ----------
function handleDelete(row) {
  users.value = users.value.filter((user) => user.id !== row.id)
  selectedRows.value = selectedRows.value.filter((user) => user.id !== row.id)
  correctPage()
  userTableRef.value?.clearSelection()
  ElMessage.success(`已删除「${row.name}」`)
}

async function handleBatchDelete() {
  const rows = selectedRows.value
  try {
    await ElMessageBox.confirm(
      `确认删除选中的 ${rows.length} 个用户吗？删除后不可恢复。`,
      '批量删除',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        confirmButtonClass: 'el-button--danger',
      },
    )
  } catch {
    return // 取消
  }

  const ids = new Set(rows.map((row) => row.id))
  users.value = users.value.filter((user) => !ids.has(user.id))
  const count = rows.length
  selectedRows.value = []
  correctPage()
  userTableRef.value?.clearSelection()
  ElMessage.success(`已删除 ${count} 个用户`)
}
</script>

<template>
  <div class="edit-table-page">
    <el-card shadow="never">
      <UserSearchBar
        v-model="query"
        :dept-options="DEPT_OPTIONS"
        @search="handleSearch"
        @reset="handleReset"
      />

      <UserTable
        ref="userTableRef"
        :data="pagedUsers"
        :loading="loading"
        :pagination="pagination"
        :selected-rows="selectedRows"
        @add="openAdd"
        @edit="openEdit"
        @delete="handleDelete"
        @batch-delete="handleBatchDelete"
        @selection-change="handleSelectionChange"
        @pagination-change="handlePaginationChange"
      />
    </el-card>

    <UserFormDialog
      v-model="dialogVisible"
      :user="currentUser"
      :dept-options="DEPT_OPTIONS"
      :role-options="ROLE_OPTIONS"
      :submitting="submitting"
      @submit="handleSubmit"
    />
  </div>
</template>

<style scoped>
.edit-table-page {
  width: 100%;
}
</style>
