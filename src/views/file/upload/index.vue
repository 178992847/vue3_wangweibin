<script setup>
/**
 * 文件上传页
 * 展示通用 FileUpload 组件的两种典型用法：
 *  1) 通用文件：拖拽上传、批量、进度、失败重试、预览下载
 *  2) 图片墙：图片专用、缩略图遮罩操作
 * 当前使用组件内置模拟上传（无需后端）；接入真实接口时给组件传 action 即可。
 */
import { computed, ref } from 'vue'
import FileUpload from '@/components/FileUpload/index.vue'

const files = ref([])
const images = ref([])

// 演示用：开启后模拟上传有 30% 概率失败，可体验失败重试
const mockFailRate = ref(0)

const stats = computed(() => {
  const list = files.value
  return {
    total: list.length,
    success: list.filter((file) => file.status === 'success').length,
    uploading: list.filter((file) => file.status === 'uploading').length,
    fail: list.filter((file) => file.status === 'fail').length,
    size: list.reduce((sum, file) => sum + (Number(file.size) || 0), 0),
    imageCount: images.value.length,
  }
})

function formatSize(bytes) {
  const size = Number(bytes) || 0
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

const statCards = computed(() => [
  { label: '文件总数', value: stats.value.total, suffix: '个', icon: 'Files', color: '#409eff', bg: '#ecf5ff' },
  { label: '上传成功', value: stats.value.success, suffix: '个', icon: 'CircleCheckFilled', color: '#67c23a', bg: '#f0f9eb' },
  { label: '上传中', value: stats.value.uploading, suffix: '个', icon: 'Loading', color: '#e6a23c', bg: '#fdf6ec', spin: true },
  { label: '上传失败', value: stats.value.fail, suffix: '个', icon: 'WarningFilled', color: '#f56c6c', bg: '#fef0f0' },
  { label: '总占用空间', value: formatSize(stats.value.size), suffix: '', icon: 'Coin', color: '#7c3aed', bg: '#f3effe' },
])
</script>

<template>
  <div class="upload-page">
    <!-- 顶部渐变 Banner -->
    <section class="hero">
      <span class="hero__deco hero__deco--1">☁️</span>
      <span class="hero__deco hero__deco--2">📎</span>
      <span class="hero__deco hero__deco--3">🗂️</span>
      <div class="hero__inner">
        <div class="hero__badge">
          <el-icon :size="13"><UploadFilled /></el-icon>
          文件中心
        </div>
        <h2 class="hero__title">文件上传</h2>
        <p class="hero__desc">
          支持拖拽批量上传、类型 / 大小校验、实时进度、失败一键重试，以及在线预览与下载
        </p>
        <div class="hero__tools">
          <el-switch
            v-model="mockFailRate"
            :active-value="0.3"
            :inactive-value="0"
            inline-prompt
            active-text="弱网"
            inactive-text="正常"
            size="small"
            style="--el-switch-on-color: #f56c6c"
          />
          <span class="hero__tools-text">模拟弱网环境（随机失败，体验重试）</span>
        </div>
      </div>
    </section>

    <!-- 统计卡片 -->
    <section class="stat-grid">
      <div v-for="card in statCards" :key="card.label" class="stat-card">
        <div class="stat-card__icon" :style="{ color: card.color, backgroundColor: card.bg }">
          <el-icon :size="22" :class="{ 'is-loading': card.spin && card.value > 0 }">
            <component :is="card.icon" />
          </el-icon>
        </div>
        <div class="stat-card__body">
          <div class="stat-card__value">
            {{ card.value }}<small>{{ card.suffix }}</small>
          </div>
          <div class="stat-card__label">{{ card.label }}</div>
        </div>
      </div>
    </section>

    <!-- 上传区：通用文件 + 图片墙 -->
    <section class="content-grid">
      <el-card shadow="never" class="panel panel--files">
        <template #header>
          <div class="panel__header">
            <el-icon :size="18" color="#409eff"><FolderOpened /></el-icon>
            <span class="panel__title">通用文件</span>
            <el-tag size="small" type="primary" effect="plain" round>文档 / 压缩包 / 音视频</el-tag>
          </div>
        </template>

        <FileUpload
          v-model="files"
          :limit="10"
          :max-size="50"
          :mock-fail-rate="mockFailRate"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.zip,.rar,.7z,image/*,video/*,audio/*"
          tip="文档、压缩包、图片、音视频等常见格式"
        />
      </el-card>

      <el-card shadow="never" class="panel panel--images">
        <template #header>
          <div class="panel__header">
            <el-icon :size="18" color="#13c2c2"><Picture /></el-icon>
            <span class="panel__title">图片上传</span>
            <el-tag size="small" type="success" effect="plain" round>已选 {{ stats.imageCount }} 张</el-tag>
          </div>
        </template>

        <FileUpload
          v-model="images"
          list-type="picture-card"
          :drag="false"
          :limit="8"
          :max-size="5"
          :mock-fail-rate="mockFailRate"
          accept="image/*"
          unit="张"
          tip="支持 JPG / PNG / GIF 格式"
        />
      </el-card>
    </section>
  </div>
</template>

<style scoped>
.upload-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  max-width: 1280px;
  /* 高度链：占满主内容区但不超出。内容少时卡片按内容自然撑高（无内部空白）；
     文件多时剩余空间全部分给卡片，由卡片内部列表滚动承接，页面本身不出现滚动条 */
  height: 100%;
  margin: 0 auto;
}

/* ---------- Banner ---------- */
.hero {
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  padding: 22px 28px;
  border-radius: 16px;
  color: #fff;
  background: linear-gradient(120deg, #409eff 0%, #6a5ae0 55%, #7c3aed 100%);
  box-shadow: 0 10px 30px rgba(124, 58, 237, 0.22);
}

.hero__inner {
  position: relative;
  z-index: 1;
}

.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 12px;
  font-size: 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(4px);
}

.hero__title {
  margin: 10px 0 4px;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 1px;
}

.hero__desc {
  margin: 0;
  font-size: 13px;
  opacity: 0.85;
}

.hero__tools {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  font-size: 12px;
}

.hero__tools-text {
  opacity: 0.85;
}

.hero__deco {
  position: absolute;
  font-size: 92px;
  opacity: 0.14;
  user-select: none;
  pointer-events: none;
}

.hero__deco--1 {
  right: 40px;
  top: -18px;
  animation: float-up 5s ease-in-out infinite;
}

.hero__deco--2 {
  right: 150px;
  bottom: -34px;
  font-size: 70px;
  opacity: 0.12;
  animation: float-up 6.5s ease-in-out infinite 0.8s;
}

.hero__deco--3 {
  right: 8px;
  bottom: -20px;
  font-size: 58px;
  opacity: 0.1;
  animation: float-up 7.5s ease-in-out infinite 1.6s;
}

@keyframes float-up {
  0%,
  100% {
    transform: translateY(0) rotate(-4deg);
  }
  50% {
    transform: translateY(-10px) rotate(4deg);
  }
}

/* ---------- 统计卡片 ---------- */
.stat-grid {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 16px;
  background: var(--el-bg-color);
  border-radius: 14px;
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 2px 10px rgba(31, 45, 61, 0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(31, 45, 61, 0.09);
}

.stat-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  flex-shrink: 0;
}

.stat-card__value {
  font-size: 21px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--el-text-color-primary);
}

.stat-card__value small {
  margin-left: 2px;
  font-size: 12px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}

.stat-card__label {
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* ---------- 内容面板（占满剩余高度，顶部对齐；卡片封顶不超高，内部列表滚动） ---------- */
.content-grid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(320px, 1fr);
  grid-template-rows: minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.panel {
  /* 只封顶不强制撑满：内容短卡片就短，内容多也不会顶破视口 */
  max-height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 14px;
  border-color: var(--el-border-color-lighter);
}

.panel :deep(.el-card__header) {
  flex-shrink: 0;
  padding: 13px 18px;
}

.panel :deep(.el-card__body) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 16px 18px;
}

.panel__header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.panel__header .el-tag {
  margin-left: auto;
}

/* ---------- 响应式 ---------- */
@media (max-width: 1180px) {
  .stat-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  /* 单列布局高度不足以双卡片并排封顶，回退自然高度，由页面滚动承接 */
  .upload-page {
    height: auto;
  }

  .content-grid {
    flex: none;
    grid-template-columns: 1fr;
    grid-template-rows: none;
  }

  .panel {
    max-height: none;
  }

  .panel :deep(.el-card__body) {
    overflow: visible;
  }
}

/* 矮视口下同样回退，避免上传区 / 列表被过度压缩 */
@media (max-height: 640px) {
  .upload-page {
    height: auto;
  }

  .content-grid {
    flex: none;
    grid-template-rows: none;
  }

  .panel {
    max-height: none;
  }

  .panel :deep(.el-card__body) {
    overflow: visible;
  }
}

@media (max-width: 640px) {
  .hero {
    padding: 20px;
  }

  .stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
