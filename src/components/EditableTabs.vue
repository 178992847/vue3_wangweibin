<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Setting, Plus, Delete } from '@element-plus/icons-vue'
import TabFormPanel from './TabFormPanel.vue'

let uid = 0
const createTab = (name) => {
  uid += 1
  return { id: uid, name }
}

// 初始 4 个标签页
const tabs = ref([
  createTab('基础信息'),
  createTab('活动配置'),
  createTab('资源管理'),
  createTab('其他设置'),
])
const activeId = ref(tabs.value[0].id)
const drawerVisible = ref(false)

// 新增标签页：默认命名，追加到末尾并激活
const addTab = () => {
  const tab = createTab(`新标签页${tabs.value.length + 1}`)
  tabs.value.push(tab)
  activeId.value = tab.id
  ElMessage.success(`已新增「${tab.name}」`)
}

// 删除标签页：至少保留一个；删除当前激活项时自动切换到相邻标签页
const removeTab = (tab) => {
  if (tabs.value.length <= 1) {
    ElMessage.warning('至少需要保留一个标签页')
    return
  }
  const index = tabs.value.findIndex((item) => item.id === tab.id)
  tabs.value.splice(index, 1)
  if (activeId.value === tab.id) {
    const next = tabs.value[index] ?? tabs.value[index - 1]
    activeId.value = next.id
  }
  ElMessage.success(`已删除「${tab.name}」`)
}

// 切换标签页不丢数据：el-tabs 默认非 lazy，所有 tab-pane 始终挂载（仅 v-show 隐藏），
// 每个面板内的 TabFormPanel 实例独立持有自己的表单状态，切换后数据保留。
</script>

<template>
  <div class="editable-tabs">
    <div class="tabs-toolbar">
      <el-alert
        title="切换标签页不会丢失已填写的数据；通过「管理标签页」可新增、删除、重命名选项卡"
        type="info"
        :closable="false"
        show-icon
        class="tabs-tip"
      />
      <el-button type="primary" :icon="Setting" @click="drawerVisible = true">
        管理标签页
      </el-button>
    </div>

    <el-tabs v-model="activeId" type="card">
      <el-tab-pane
        v-for="tab in tabs"
        :key="tab.id"
        :name="tab.id"
        :label="tab.name"
      >
        <TabFormPanel :tab-name="tab.name" />
      </el-tab-pane>
    </el-tabs>

    <!-- 标签页管理抽屉：新增 / 删除 / 重命名 -->
    <el-drawer v-model="drawerVisible" title="标签页管理" size="440px">
      <div class="drawer-toolbar">
        <el-button type="primary" :icon="Plus" @click="addTab">新增标签页</el-button>
        <span class="drawer-count">当前 {{ tabs.length }} 个标签页</span>
      </div>
      <div class="drawer-list">
        <div v-for="(tab, index) in tabs" :key="tab.id" class="drawer-row">
          <el-tag type="info" class="row-index">{{ index + 1 }}</el-tag>
          <el-input
            v-model="tab.name"
            maxlength="12"
            show-word-limit
            placeholder="请输入标签页名称"
          />
          <el-button type="danger" plain :icon="Delete" @click="removeTab(tab)">
            删除
          </el-button>
        </div>
      </div>
      <p class="drawer-tip">名称修改后即时生效，当前激活的标签页不可被删除后置空（自动切换相邻项）。</p>
    </el-drawer>
  </div>
</template>

<style scoped>
.tabs-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.tabs-tip {
  flex: 1;
}

.drawer-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.drawer-count {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.drawer-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.drawer-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.row-index {
  width: 28px;
  justify-content: center;
}

.drawer-tip {
  margin-top: 16px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
}
</style>
