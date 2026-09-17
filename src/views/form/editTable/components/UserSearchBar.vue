<script setup>
/**
 * 用户查询栏
 * - query 通过 defineModel 双向绑定（子组件直接修改条件，父组件持有数据源）
 * - 点击「查询」「重置」时只发事件，由父组件决定如何重新取数
 */
const props = defineProps({
  // 部门下拉选项（常量由页面层统一维护，避免多处分散）
  deptOptions: {
    type: Array,
    default: () => [],
  },
})

// 双向绑定查询条件：{ keyword, dept, status }
const query = defineModel({
  default: () => ({ keyword: '', dept: '', status: '' }),
})

const emit = defineEmits(['search', 'reset'])
</script>

<template>
  <el-form :model="query" inline class="user-search-bar" @submit.prevent>
    <el-form-item label="关键词">
      <el-input
        v-model="query.keyword"
        placeholder="姓名 / 账号"
        clearable
        class="search-input"
        @keyup.enter="emit('search')"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </el-form-item>

    <el-form-item label="部门">
      <el-select
        v-model="query.dept"
        placeholder="全部部门"
        clearable
        class="search-select"
      >
        <el-option v-for="item in props.deptOptions" :key="item" :label="item" :value="item" />
      </el-select>
    </el-form-item>

    <el-form-item label="状态">
      <el-select
        v-model="query.status"
        placeholder="全部状态"
        clearable
        class="search-select"
      >
        <el-option label="启用" value="1" />
        <el-option label="停用" value="0" />
      </el-select>
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="emit('search')">
        <el-icon><Search /></el-icon>查询
      </el-button>
      <el-button @click="emit('reset')">
        <el-icon><Refresh /></el-icon>重置
      </el-button>
    </el-form-item>
  </el-form>
</template>

<style scoped>
.user-search-bar {
  display: flex;
  flex-wrap: wrap;
}

.search-input {
  width: 200px;
}

.search-select {
  width: 150px;
}
</style>
