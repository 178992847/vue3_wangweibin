<script setup>
/**
 * ProTable —— 通用表格组件
 *
 * 设计要点（配置驱动 + 插槽扩展，借鉴 vxe-table / ant-design ProTable 的常用约定）：
 * 1. columns 配置化：每一项对应一个 el-table-column，避免业务页堆一长串模板列；
 * 2. slot 扩展：列配置 slot: true 时，业务方通过 #cell-{prop} 作用域插槽自定义单元格
 *    （标签、开关、操作按钮等），插槽参数同 el-table 默认插槽 { row, column, $index }；
 * 3. 分页内置：传 pagination 对象即显示分页器，变更统一通过 pagination-change 抛出，
 *    按「服务端分页」模式由父层重新取数；传 null 不显示；
 * 4. 属性/事件透传：el-table 的原生 props 与事件（如 @selection-change、@row-click）
 *    直接写在 <ProTable> 上即可，经 $attrs 透传给内部 el-table；
 * 5. 通过 defineExpose 转发常用 el-table 实例方法，父层拿 ref 即可清空选择等。
 */
import { computed, ref } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  // 当前页表格数据
  data: {
    type: Array,
    default: () => [],
  },
  /**
   * 列配置：
   * - 特殊列：{ type: 'selection' | 'index', width?, fixed?, align? }
   * - 普通列：{
   *     prop, label, width?, minWidth?, fixed?, align?, headerAlign?,
   *     sortable?: boolean | 'custom',
   *     showOverflowTooltip?: boolean, // 默认 true
   *     slot?: boolean,                // true 时使用 #cell-{prop} 插槽渲染
   *     formatter?: (row, column, value, index) => string,
   *   }
   */
  columns: {
    type: Array,
    default: () => [],
  },
  // 加载态（自带 v-loading）
  loading: {
    type: Boolean,
    default: false,
  },
  // 行数据唯一标识，selection 跨页保留等场景必需
  rowKey: {
    type: [String, Function],
    default: 'id',
  },
  // 分页配置 { page, pageSize, total }；传 null 不渲染分页器
  pagination: {
    type: Object,
    default: null,
  },
  // 可选每页条数
  pageSizes: {
    type: Array,
    default: () => [10, 20, 50, 100],
  },
})

const emit = defineEmits(['pagination-change'])

const tableRef = ref(null)

const showPagination = computed(() => Boolean(props.pagination))

// 翻页：保持每页条数
function handleCurrentChange(page) {
  emit('pagination-change', { page, pageSize: props.pagination.pageSize })
}

// 切换每页条数：重置到第一页，避免空页
function handleSizeChange(pageSize) {
  emit('pagination-change', { page: 1, pageSize })
}

// 转发 el-table 常用命令式方法
defineExpose({
  clearSelection: () => tableRef.value?.clearSelection(),
  toggleRowSelection: (row, selected) => tableRef.value?.toggleRowSelection(row, selected),
  getSelectionRows: () => tableRef.value?.getSelectionRows() ?? [],
  setCurrentRow: (row) => tableRef.value?.setCurrentRow(row),
})
</script>

<template>
  <div class="pro-table">
    <!-- 工具栏：新增/批量操作/自定义按钮等，由业务页通过插槽填充 -->
    <div v-if="$slots.toolbar" class="pro-table__toolbar">
      <slot name="toolbar" />
    </div>

    <!-- v-bind="$attrs" 放在最后，业务传入的同名属性可覆盖默认的 border / stripe -->
    <el-table
      ref="tableRef"
      v-loading="loading"
      :data="data"
      :row-key="rowKey"
      border
      stripe
      class="pro-table__body"
      v-bind="$attrs"
    >
      <template v-for="col in columns" :key="col.type ?? col.prop">
        <!-- 多选列 -->
        <el-table-column
          v-if="col.type === 'selection'"
          type="selection"
          :width="col.width ?? 48"
          :align="col.align ?? 'center'"
          :fixed="col.fixed"
          :reserve-selection="col.reserveSelection"
        />
        <!-- 序号列 -->
        <el-table-column
          v-else-if="col.type === 'index'"
          type="index"
          :label="col.label ?? '#'"
          :width="col.width ?? 56"
          :align="col.align ?? 'center'"
          :fixed="col.fixed"
        />
        <!-- 普通数据列 -->
        <el-table-column
          v-else
          :prop="col.prop"
          :label="col.label"
          :width="col.width"
          :min-width="col.minWidth"
          :fixed="col.fixed"
          :align="col.align ?? 'left'"
          :header-align="col.headerAlign"
          :sortable="col.sortable"
          :show-overflow-tooltip="col.showOverflowTooltip ?? true"
        >
          <!-- 自定义单元格：业务页提供 #cell-{prop} 作用域插槽 -->
          <template v-if="col.slot" #default="scope">
            <slot :name="`cell-${col.prop}`" v-bind="scope" />
          </template>
          <!-- 格式化函数 -->
          <template v-else-if="col.formatter" #default="scope">
            {{ col.formatter(scope.row, scope.column, scope.row[col.prop], scope.$index) }}
          </template>
        </el-table-column>
      </template>

      <!-- 表格末尾追加行（合计行等） -->
      <template v-if="$slots.append" #append>
        <slot name="append" />
      </template>

      <!-- 空数据自定义 -->
      <template v-if="$slots.empty" #empty>
        <slot name="empty" />
      </template>
    </el-table>

    <div v-if="showPagination" class="pro-table__pagination">
      <el-pagination
        background
        :current-page="pagination.page"
        :page-size="pagination.pageSize"
        :page-sizes="pageSizes"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handleCurrentChange"
        @size-change="handleSizeChange"
      />
    </div>
  </div>
</template>

<style scoped>
.pro-table__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.pro-table__body {
  width: 100%;
}

.pro-table__pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
