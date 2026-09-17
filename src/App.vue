<script setup>
import { useRoute } from 'vue-router'
import AppMenu from '@/components/AppMenu/index.vue'
import AppBreadcrumb from '@/components/AppBreadcrumb/index.vue'
import UserDropdown from '@/components/UserDropdown/index.vue'

const route = useRoute()
</script>

<template>
  <!-- 登录等全屏页面：不使用后台布局 -->
  <router-view v-if="route.meta.layout === false" />

  <!-- 后台主框架 -->
  <el-container v-else class="layout">
    <!-- 左侧固定菜单 -->
    <el-aside width="210px" class="layout-aside">
      <div class="layout-logo">
        <span class="logo-icon">🌸</span>
        <span class="logo-text">管理系统</span>
      </div>
      <AppMenu />
    </el-aside>

    <el-container>
      <!-- 顶部：面包屑 + 用户信息 -->
      <el-header class="layout-header">
        <AppBreadcrumb />

        <UserDropdown />
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
  gap: 12px;
  background-color: #fff;
  border-bottom: 1px solid var(--el-border-color-light);
}

.layout-main {
  background-color: var(--el-fill-color-lighter);
}
</style>
