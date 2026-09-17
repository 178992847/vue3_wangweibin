<script setup>
/**
 * 用户表格（业务组件）
 * 职责：列配置 + 单元格展示态 + 操作入口；不持有业务数据，所有写操作通过事件交给页面层。
 * 通用能力（渲染、分页、loading、多选）全部复用 ProTable。
 */
import { ref } from 'vue'
import ProTable from '@/components/ProTable/index.vue'

defineProps({
  // 当前页数据
  data: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  // { page, pageSize, total }
  pagination: {
    type: Object,
    required: true,
  },
  // 当前选中行（控制批量删除按钮态）
  selectedRows: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits([
  'add',
  'edit',
  'delete',
  'batch-delete',
  'selection-change',
  'pagination-change',
])

// 内部持有 ProTable 实例，并向页面层转发清空选择的命令式方法
const proTableRef = ref(null)
defineExpose({
  clearSelection: () => proTableRef.value?.clearSelection(),
})

// 列配置：与 ProTable 的 columns DSL 对应；展示变体用 slot，其余纯文本列零模板
const columns = [
  { type: 'selection', width: 48, fixed: 'left' },
  { type: 'index', label: '#', width: 56 },
  { prop: 'name', label: '姓名', minWidth: 100, fixed: 'left' },
  { prop: 'account', label: '账号', minWidth: 120 },
  { prop: 'dept', label: '部门', minWidth: 110 },
  { prop: 'role', label: '角色', width: 100, align: 'center', slot: true },
  { prop: 'status', label: '状态', width: 90, align: 'center', slot: true },
  { prop: 'createDate', label: '创建时间', width: 170 },
  { prop: 'actions', label: '操作', width: 150, fixed: 'right', align: 'center', slot: true },
]

// 角色标签配色
const roleTagType = (role) => {
  const map = { 管理员: 'danger', 运营: 'warning' }
  return map[role] ?? 'primary'
}
</script>

<template>
  <ProTable
    ref="proTableRef"
    :data="data"
    :columns="columns"
    :loading="loading"
    :pagination="pagination"
    row-key="id"
    @selection-change="(rows) => emit('selection-change', rows)"
    @pagination-change="(payload) => emit('pagination-change', payload)"
  >
    <!-- 工具栏：左侧新增，右侧批量删除 -->
    <template #toolbar>
      <el-button type="primary" @click="emit('add')">
        <el-icon><Plus /></el-icon>新增用户
      </el-button>
      <el-button
        type="danger"
        plain
        :disabled="selectedRows.length === 0"
        @click="emit('batch-delete')"
      >
        <el-icon><Delete /></el-icon>
        批量删除<template v-if="selectedRows.length">（{{ selectedRows.length }}）</template>
      </el-button>
    </template>

    <!-- 角色 -->
    <template #cell-role="{ row }">
      <el-tag :type="roleTagType(row.role)" effect="light" round>{{ row.role }}</el-tag>
    </template>

    <!-- 状态 -->
    <template #cell-status="{ row }">
      <el-tag :type="row.status === 1 ? 'success' : 'info'" effect="plain" round>
        {{ row.status === 1 ? '启用' : '停用' }}
      </el-tag>
    </template>

    <!-- 操作列：编辑 + 删除（二次确认） -->
    <template #cell-actions="{ row }">
      <el-button link type="primary" @click="emit('edit', row)">
        <el-icon><EditPen /></el-icon>编辑
      </el-button>
      <el-popconfirm
        :title="`确认删除用户「${row.name}」吗？`"
        confirm-button-text="删除"
        cancel-button-text="取消"
        confirm-button-type="danger"
        width="220"
        @confirm="emit('delete', row)"
      >
        <template #reference>
          <el-button link type="danger">
            <el-icon><Delete /></el-icon>删除
          </el-button>
        </template>
      </el-popconfirm>
    </template>
  </ProTable>
</template>
