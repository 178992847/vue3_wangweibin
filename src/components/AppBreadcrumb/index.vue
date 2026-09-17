<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// 根据路由 meta 生成面包屑：首页 / 分组名 / 当前页面名
const items = computed(() => {
  const list = [{ title: '首页', to: '/home' }]
  if (route.path !== '/home') {
    if (route.meta.group) {
      list.push({ title: route.meta.group })
    }
    list.push({ title: route.meta.title || '' })
  }
  return list
})
</script>

<template>
  <el-breadcrumb separator="/" class="app-breadcrumb">
    <el-breadcrumb-item
      v-for="(item, index) in items"
      :key="item.title + index"
      :to="item.to"
    >
      {{ item.title }}
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>

<style scoped>
.app-breadcrumb {
  line-height: var(--el-header-height);
}
</style>
