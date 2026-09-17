<script setup>
import AppMenu from '@/components/AppMenu.vue'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
</script>

<template>
  <el-container class="layout">
    <!-- 左侧固定菜单 -->
    <el-aside width="210px" class="layout-aside">
      <div class="layout-logo">
        <span class="logo-icon">🌸</span>
        <span class="logo-text">管理系统</span>
      </div>
      <AppMenu />
    </el-aside>

    <el-container>
      <!-- 顶部：面包屑 -->
      <el-header class="layout-header">
        <AppBreadcrumb />
      </el-header>

      <!-- 主内容区 -->
      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.layout {
  height: 100vh;
}

.layout-aside {
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-right: 1px solid var(--el-border-color-light);
}

.layout-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 60px;
  flex-shrink: 0;
  padding: 0 20px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.logo-icon {
  font-size: 20px;
}

.logo-text {
  font-size: 16px;
  font-weight: 700;
  background: linear-gradient(120deg, #409eff, #7c3aed);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.layout-header {
  display: flex;
  align-items: center;
  background-color: #fff;
  border-bottom: 1px solid var(--el-border-color-light);
}

.layout-main {
  background-color: var(--el-fill-color-lighter);
}
</style>
