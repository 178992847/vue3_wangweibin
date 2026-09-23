<script setup>
import { onMounted, ref } from 'vue'
// 背景视频
import videoA from '@/assets/2fe9bec2850b714bf56ca8d6b293fe2e.mp4'
import videoB from '@/assets/5d8caa2a531bc60b37eade52faa5ba89_raw.mp4'

const videos = [videoA, videoB]

// 双视频轮流播放：一个播完淡入下一个
const videoRefs = [ref(null), ref(null)]
const activeVideo = ref(0)

async function handleVideoEnd() {
  const next = activeVideo.value === 0 ? 1 : 0
  const nextEl = videoRefs[next].value
  if (nextEl) {
    nextEl.currentTime = 0
    try {
      await nextEl.play()
    } catch {
      /* 浏览器拦截时忽略 */
    }
  }
  activeVideo.value = next
}

onMounted(() => {
  videoRefs[0].value?.play().catch(() => {})
})
</script>

<template>
  <div class="home-view">
    <video
      v-for="(src, index) in videos"
      :key="src"
      :ref="(el) => (videoRefs[index].value = el)"
      :src="src"
      class="bg-video"
      :class="{ 'is-active': activeVideo === index }"
      muted
      playsinline
      preload="auto"
      @ended="handleVideoEnd"
    />
  </div>
</template>

<style scoped>
/* 填满 el-main 内容区（抵消默认 20px padding，减去 60px 头部高度） */
.home-view {
  position: relative;
  margin: -20px;
  height: calc(100vh - 60px);
  min-height: 400px;
  overflow: hidden;
  background: #0a0e18;
}

.bg-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 1.4s ease-in-out;
}

.bg-video.is-active {
  opacity: 1;
}
</style>
