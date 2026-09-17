<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

// 菜单配置：图标为全局注册的组件名（字符串），模板通过 <component :is> 渲染
const menuItems = [
  {
    index: '/home',
    title: '首页',
    icon: 'HomeFilled',
  },
  {
    index: '/form',
    title: '表单管理',
    icon: 'Document',
    children: [
      {
        index: '/form/editable-tabs',
        title: '可编辑标签页',
        icon: 'Edit',
      },
      {
        index: '/form/editTable',
        title: '编辑表格',
        icon: 'EditPen',
      },
    ],
  },
]
</script>

<template>
  <el-menu class="app-menu" :default-active="route.path" router>
    <template v-for="item in menuItems" :key="item.index">
      <el-sub-menu v-if="item.children" :index="item.index">
        <template #title>
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.title }}</span>
        </template>
        <el-menu-item v-for="child in item.children" :key="child.index" :index="child.index">
          <el-icon v-if="child.icon"><component :is="child.icon" /></el-icon>
          <template #title>{{ child.title }}</template>
        </el-menu-item>
      </el-sub-menu>
      <el-menu-item v-else :index="item.index">
        <el-icon><component :is="item.icon" /></el-icon>
        <template #title>{{ item.title }}</template>
      </el-menu-item>
    </template>
  </el-menu>
</template>

<style scoped>
.app-menu {
  border-right: none;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
</style>
