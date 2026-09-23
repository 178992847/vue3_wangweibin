<script setup>
/**
 * 通用文件上传组件
 * 基于 el-upload 二次封装，常用能力：
 *  - 拖拽 / 点击上传、多文件批量、数量限制、类型与大小校验、重名拦截
 *  - 实时进度、成功 / 失败状态、失败一键重试、上传中可取消
 *  - 文件列表（text）与图片墙（picture-card）两种展示形态
 *  - 图片弹窗预览、文件下载、清空列表、只读模式
 *  - v-model 双向绑定文件元数据；支持自定义上传、真实接口、内置模拟三种模式
 *
 * v-model 数据项结构：
 *   { uid, name, size, status: 'uploading' | 'success' | 'fail', percent, url, type }
 */
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getToken } from '@/utils/auth'

const props = defineProps({
  // v-model 绑定的文件列表
  modelValue: { type: Array, default: () => [] },
  // 上传接口地址：传入则走真实 XHR 上传；不传使用内置模拟上传（本地生成预览地址）
  action: { type: String, default: '' },
  // 文件字段名（真实上传时 FormData 的 key）
  name: { type: String, default: 'file' },
  // 自定义上传实现，优先级最高：({ file, onProgress }) => Promise<{ url }>
  httpRequest: { type: Function, default: null },
  // 真实上传时的额外请求头 / 表单字段
  headers: { type: Object, default: () => ({}) },
  data: { type: Object, default: () => ({}) },
  multiple: { type: Boolean, default: true },
  // 最大文件数量，0 表示不限制
  limit: { type: Number, default: 0 },
  // 允许的文件类型，同原生 accept，如 '.png,.doc'、'image/*'
  accept: { type: String, default: '' },
  // 单个文件大小上限（MB），0 表示不限制
  maxSize: { type: Number, default: 0 },
  // 只读：隐藏上传入口与删除 / 重试，保留预览下载
  disabled: { type: Boolean, default: false },
  // text 模式下是否使用拖拽区
  drag: { type: Boolean, default: true },
  // 列表形态：text（文件列表） | picture-card（图片墙）
  listType: { type: String, default: 'text' },
  // 自定义提示文案（大小 / 数量限制会自动追加）
  tip: { type: String, default: '' },
  // 数量单位（文件用「个」，图片墙可传「张」），用于提示文案拼接
  unit: { type: String, default: '个' },
  // 是否校验同名同大小文件重复上传
  duplicateCheck: { type: Boolean, default: true },
  // 仅内置模拟上传使用：随机失败概率 0~1，方便演示失败重试
  mockFailRate: { type: Number, default: 0 },
})

const emit = defineEmits([
  'update:modelValue',
  'change',
  'success',
  'error',
  'remove',
  'exceed',
  'preview',
])

const uploadRef = ref(null)
const previewVisible = ref(false)
const previewUrl = ref('')

// uid 由组件内部统一生成，保证列表 key 与重试 / 取消定位稳定
let uidSeed = 0
function genUid() {
  uidSeed += 1
  return `fu-${Date.now()}-${uidSeed}`
}

// ---------- 文件类型 → 图标 / 主题色 ----------
function getFileMeta(item) {
  const type = item.fileType || ''
  const fileName = item.name.toLowerCase()
  if (type.startsWith('image/')) return { icon: 'Picture', color: '#13c2c2' }
  if (type.startsWith('video/')) return { icon: 'VideoCamera', color: '#722ed1' }
  if (type.startsWith('audio/')) return { icon: 'Headset', color: '#fa8c16' }
  if (/\.pdf$/.test(fileName) || type === 'application/pdf') {
    return { icon: 'Document', color: '#f5222d' }
  }
  if (/\.(docx?|wps|pages|rtf)$/.test(fileName)) return { icon: 'Notebook', color: '#1677ff' }
  if (/\.(xlsx?|csv|numbers)$/.test(fileName)) return { icon: 'Tickets', color: '#52c41a' }
  if (/\.(pptx?|key)$/.test(fileName)) return { icon: 'Monitor', color: '#fa8c16' }
  if (/\.(zip|rar|7z|gz|tar)$/.test(fileName)) return { icon: 'Files', color: '#faad14' }
  if (/\.(js|ts|vue|json|html?|css|py|java|go|rs|c|cpp|sql)$/.test(fileName)) {
    return { icon: 'Monitor', color: '#2f54eb' }
  }
  if (/\.(txt|md|log)$/.test(fileName)) return { icon: 'Notebook', color: '#8c8c8c' }
  return { icon: 'Document', color: '#409eff' }
}

function normalize(raw) {
  const item = {
    uid: raw.uid || genUid(),
    name: raw.name || '未命名文件',
    size: Number(raw.size) || 0,
    status: raw.status === 'uploading' ? 'uploading' : raw.status === 'fail' ? 'fail' : 'success',
    percent: Number(raw.percent) || 0,
    url: raw.url || '',
    fileType: raw.fileType || raw.type || '',
  }
  item.meta = getFileMeta(item)
  return item
}

// ---------- 列表状态（内部唯一数据源，对外通过 v-model 同步元数据） ----------
const fileList = ref((props.modelValue || []).map(normalize))
// 记录最近一次对外抛出的数组，避免父组件回写把上传中的内部状态覆盖掉
let lastEmitted = props.modelValue

function serialize(list) {
  return list.map(({ uid, name, size, status, percent, url, fileType }) => ({
    uid,
    name,
    size,
    status,
    percent,
    url,
    type: fileType,
  }))
}

function sync() {
  const payload = serialize(fileList.value)
  lastEmitted = payload
  emit('update:modelValue', payload)
  emit('change', payload)
}

watch(
  () => props.modelValue,
  (val) => {
    // 仅处理外部主动重置 / 赋值，组件自身 emit 引起的回写忽略
    if (val !== lastEmitted) {
      fileList.value = (val || []).map(normalize)
    }
  },
)

// ---------- 派生状态 ----------
const isPictureCard = computed(() => props.listType === 'picture-card')
const limitReached = computed(() => props.limit > 0 && fileList.value.length >= props.limit)
const uploadOff = computed(() => props.disabled || limitReached.value)

const hintText = computed(() => {
  const parts = []
  if (props.tip) parts.push(props.tip)
  if (props.maxSize > 0) parts.push(`单个文件不超过 ${props.maxSize}MB`)
  if (props.limit > 0) parts.push(`最多上传 ${props.limit} ${props.unit}`)
  return parts.join('，')
})

// ---------- 工具函数 ----------
function formatSize(bytes) {
  const size = Number(bytes) || 0
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function isImage(item) {
  return (
    item.fileType?.startsWith('image/') ||
    /\.(png|jpe?g|gif|bmp|webp|svg|avif|ico)$/i.test(item.name)
  )
}

function matchAccept(file) {
  if (!props.accept) return true
  const ext = file.name.includes('.')
    ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    : ''
  return props.accept
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)
    .some((token) => {
      if (token.startsWith('.')) return ext === token.toLowerCase()
      if (token.endsWith('/*')) return file.type.startsWith(token.slice(0, -1))
      return file.type === token
    })
}

// 原始 File 对象与上传中止器不放入响应式数据：按 uid 单独存放，
// 既避免 File 被响应式代理，也保证更新状态时永远能定位到最新的列表代理对象
const rawFiles = new Map()
const aborters = new Map()

// 统一的状态更新入口：通过 uid 从响应式数组中查找最新对象后再修改，
// 不依赖任何闭包里持有的 item 引用（防止引用过期导致进度不刷新）
function patchItem(uid, patch) {
  const target = fileList.value.find((item) => item.uid === uid)
  if (target) Object.assign(target, patch)
  return target
}

// ---------- 校验 ----------
function handleBeforeUpload(file) {
  if (props.limit > 0 && fileList.value.length >= props.limit) {
    ElMessage.warning(`最多只能上传 ${props.limit} 个文件`)
    return false
  }
  if (props.maxSize > 0 && file.size > props.maxSize * 1024 * 1024) {
    ElMessage.error(`「${file.name}」超出大小限制（最大 ${props.maxSize}MB）`)
    return false
  }
  if (!matchAccept(file)) {
    ElMessage.error(`「${file.name}」文件格式不支持`)
    return false
  }
  if (
    props.duplicateCheck &&
    fileList.value.some((item) => item.name === file.name && item.size === file.size)
  ) {
    ElMessage.warning(`「${file.name}」已在上传列表中，请勿重复选择`)
    return false
  }
  return true
}

function handleExceed() {
  emit('exceed')
  ElMessage.warning(`最多只能上传 ${props.limit} 个文件`)
}

// ---------- 上传 ----------
async function handleHttpRequest(option) {
  const file = option.file
  const useMock = !props.action && !props.httpRequest
  const uid = genUid()
  rawFiles.set(uid, file)
  // 模拟模式下推入时即生成 blob 本地地址：上传过程中可预览，成功 / 重试时复用
  const localUrl = useMock ? URL.createObjectURL(file) : ''
  fileList.value.push(
    normalize({
      uid,
      name: file.name,
      size: file.size,
      status: 'uploading',
      percent: 0,
      url: localUrl,
      type: file.type,
    }),
  )
  sync()
  await runUpload(uid)
}

async function runUpload(uid) {
  const file = rawFiles.get(uid)
  if (!file) return

  patchItem(uid, { status: 'uploading', percent: 0 })
  sync()

  const onProgress = (percent) => {
    patchItem(uid, { percent: Math.min(99, Math.round(percent)) })
    sync()
  }

  // 每次需要对外暴露 item 时都实时从响应式列表取，杜绝闭包旧引用
  const current = () => fileList.value.find((item) => item.uid === uid)

  try {
    // 上传方式分发：自定义上传 > 真实接口 > 内置模拟
    const result = await dispatchUpload({
      file,
      onProgress,
      uid,
      item: serialize([current()])[0],
      localUrl: current()?.url || '',
    })
    if (!result || !result.url) throw new Error('上传响应中缺少文件访问地址 url')
    patchItem(uid, { url: result.url, status: 'success', percent: 100 })
    aborters.delete(uid)
    rawFiles.delete(uid) // 成功后原始文件不再需要（失败时保留以供重试）
    sync()
    emit('success', serialize([current()])[0])
  } catch (error) {
    aborters.delete(uid)
    // 用户主动取消的不渲染失败态
    if (error?.message === 'aborted') return
    patchItem(uid, { status: 'fail' })
    sync()
    emit('error', { file: serialize([current()])[0], error })
    ElMessage.error(`「${current()?.name || '文件'}」上传失败，可点击重试`)
  }
}

// 上传方式分发：业务方自定义上传 > 配置 action 的真实接口 > 零配置内置模拟
function dispatchUpload({ file, onProgress, uid, item, localUrl }) {
  if (props.httpRequest) return props.httpRequest({ file, onProgress, item })
  if (props.action) return xhrUpload(file, onProgress, uid)
  return mockUpload(file, onProgress, uid, localUrl)
}

// 内置模拟上传：定时器驱动进度，结尾按概率随机失败
function mockUpload(file, onProgress, uid, localUrl = '') {
  return new Promise((resolve, reject) => {
    let percent = 0
    let timer = null
    let settled = false
    aborters.set(uid, () => {
      if (settled) return
      settled = true
      clearInterval(timer)
      reject(new Error('aborted'))
    })
    timer = setInterval(() => {
      // 前快后慢：每步涨幅按"剩余进度的 12%~30%"衰减，至少前进 1% 保证必定收尾
      const remaining = 99 - percent
      const step = Math.max(1, Math.round(remaining * (0.12 + Math.random() * 0.18)))
      percent = Math.min(99, percent + step)
      onProgress(percent)
      if (percent >= 99) {
        clearInterval(timer)
        setTimeout(() => {
          if (settled) return
          settled = true
          if (Math.random() < props.mockFailRate) {
            reject(new Error('模拟网络异常'))
            return
          }
          // 复用推入列表时生成的 blob 地址（图片墙上传中也能预览）
          resolve({ url: localUrl || URL.createObjectURL(file) })
        }, 300)
      }
    }, 200)
  })
}

// 真实接口上传：XHR + 进度回调，默认携带本地 token
function xhrUpload(file, onProgress, uid) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const formData = new FormData()
    formData.append(props.name, file)
    Object.entries(props.data || {}).forEach(([key, value]) => formData.append(key, value))

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress((event.loaded / event.total) * 100)
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        let response = {}
        try {
          response = JSON.parse(xhr.responseText)
        } catch {
          response = { url: xhr.responseText }
        }
        // 兼容常见后端结构：{ url } / { data: { url } } / { path }
        const url = response.url || response.data?.url || response.data?.path || response.path
        if (!url) {
          reject(new Error('上传响应中缺少文件访问地址 url'))
          return
        }
        resolve({ ...response, url })
      } else {
        reject(new Error(`上传失败（HTTP ${xhr.status}）`))
      }
    }
    xhr.onerror = () => reject(new Error('网络错误，上传失败'))
    xhr.open('POST', props.action)

    const token = getToken()
    const headers = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...props.headers,
    }
    Object.entries(headers).forEach(([key, value]) => {
      if (value != null && value !== '') xhr.setRequestHeader(key, value)
    })
    aborters.set(uid, () => xhr.abort())
    xhr.send(formData)
  })
}

// ---------- 行内操作 ----------
function handleRetry(item) {
  if (!rawFiles.has(item.uid)) {
    ElMessage.info('原始文件已失效，请重新选择上传')
    return
  }
  runUpload(item.uid)
}

function revokeUrl(item) {
  if (item.url && item.url.startsWith('blob:')) {
    URL.revokeObjectURL(item.url)
  }
}

function handleRemove(item) {
  aborters.get(item.uid)?.()
  aborters.delete(item.uid)
  revokeUrl(item)
  // 同步移除 el-upload 内部记录，保证数量限制判断准确
  const raw = rawFiles.get(item.uid)
  if (raw) {
    try {
      uploadRef.value?.handleRemove?.(raw)
    } catch {
      /* el-upload 内部无此记录时忽略 */
    }
  }
  rawFiles.delete(item.uid)
  fileList.value = fileList.value.filter((file) => file.uid !== item.uid)
  sync()
  emit('remove', serialize([item])[0])
}

function handleClear() {
  fileList.value.forEach((item) => {
    aborters.get(item.uid)?.()
    revokeUrl(item)
  })
  aborters.clear()
  rawFiles.clear()
  fileList.value = []
  uploadRef.value?.clearFiles?.()
  sync()
  ElMessage.success('已清空文件列表')
}

function handlePreview(item) {
  if (item.status !== 'success') {
    ElMessage.info('文件上传成功后才可预览')
    return
  }
  emit('preview', serialize([item])[0])
  if (isImage(item)) {
    previewUrl.value = item.url
    previewVisible.value = true
  } else if (item.url) {
    window.open(item.url, '_blank')
  }
}

function handleDownload(item) {
  if (item.status !== 'success' || !item.url) {
    ElMessage.info('文件上传成功后才可下载')
    return
  }
  const anchor = document.createElement('a')
  anchor.href = item.url
  anchor.download = item.name
  anchor.target = '_blank'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

defineExpose({
  clear: handleClear,
  getFileList: () => serialize(fileList.value),
})
</script>

<template>
  <div class="file-upload">
    <!-- ============ 图片墙模式 ============ -->
    <template v-if="isPictureCard">
      <div class="fu-pictures">
        <div
          v-for="item in fileList"
          :key="item.uid"
          class="fu-picture"
          :class="[`is-${item.status}`]"
        >
          <img v-if="isImage(item) && item.url" :src="item.url" :alt="item.name">
          <div v-else class="fu-picture__placeholder">
            <el-icon :size="26" :style="{ color: item.meta.color }">
              <component :is="item.meta.icon" />
            </el-icon>
          </div>

          <!-- 上传中遮罩 -->
          <div v-if="item.status === 'uploading'" class="fu-picture__overlay">
            <el-icon :size="22" class="is-loading"><Loading /></el-icon>
            <span>{{ item.percent }}%</span>
          </div>

          <!-- 失败遮罩 -->
          <div v-else-if="item.status === 'fail'" class="fu-picture__overlay is-fail">
            <el-icon :size="20"><WarningFilled /></el-icon>
            <span>上传失败</span>
            <el-button
              v-if="!disabled"
              size="small"
              circle
              @click.stop="handleRetry(item)"
            >
              <el-icon><RefreshRight /></el-icon>
            </el-button>
          </div>

          <!-- 成功遮罩 -->
          <div v-else class="fu-picture__mask">
            <el-icon :size="18" title="预览" @click.stop="handlePreview(item)"><ZoomIn /></el-icon>
            <el-icon :size="18" title="下载" @click.stop="handleDownload(item)"><Download /></el-icon>
            <el-icon
              v-if="!disabled"
              :size="18"
              title="删除"
              @click.stop="handleRemove(item)"
            >
              <Delete />
            </el-icon>
          </div>
        </div>

        <el-upload
          v-if="!uploadOff"
          ref="uploadRef"
          class="fu-tile-uploader"
          :accept="accept"
          :multiple="multiple"
          :show-file-list="false"
          :before-upload="handleBeforeUpload"
          :http-request="handleHttpRequest"
          :on-exceed="handleExceed"
        >
          <div class="fu-tile">
            <el-icon :size="22"><Plus /></el-icon>
            <span>上传图片</span>
          </div>
        </el-upload>
      </div>

      <div v-if="hintText" class="fu-side-hint">{{ hintText }}</div>

      <div v-if="fileList.length" class="fu-list-header">
        <span class="fu-list-header__title">
          已选图片
          <el-tag size="small" round effect="plain">{{ fileList.length }}<template v-if="limit">/{{ limit }}</template></el-tag>
        </span>
        <el-button v-if="!disabled" link type="danger" @click="handleClear">
          <el-icon><Delete /></el-icon>清空
        </el-button>
      </div>
    </template>

    <!-- ============ 文件列表模式 ============ -->
    <template v-else>
      <el-upload
        v-if="drag"
        ref="uploadRef"
        drag
        class="fu-upload"
        :class="{ 'fu-upload--off': uploadOff }"
        :accept="accept"
        :multiple="multiple"
        :limit="limit || undefined"
        :disabled="uploadOff"
        :show-file-list="false"
        :before-upload="handleBeforeUpload"
        :http-request="handleHttpRequest"
        :on-exceed="handleExceed"
      >
        <el-icon :size="42" class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或 <em>点击上传</em>
        </div>
        <div v-if="hintText" class="fu-hint">{{ hintText }}</div>
      </el-upload>

      <el-upload
        v-else
        ref="uploadRef"
        class="fu-upload"
        :accept="accept"
        :multiple="multiple"
        :limit="limit || undefined"
        :disabled="uploadOff"
        :show-file-list="false"
        :before-upload="handleBeforeUpload"
        :http-request="handleHttpRequest"
        :on-exceed="handleExceed"
      >
        <el-button type="primary" plain :disabled="uploadOff">
          <el-icon><Plus /></el-icon>
          <span style="margin-left: 6px">选择文件</span>
        </el-button>
        <span v-if="hintText" class="fu-hint fu-hint--inline">{{ hintText }}</span>
      </el-upload>

      <div v-if="fileList.length" class="fu-list-header">
        <span class="fu-list-header__title">
          文件列表
          <el-tag size="small" round effect="plain">{{ fileList.length }}<template v-if="limit">/{{ limit }}</template></el-tag>
        </span>
        <el-button v-if="!disabled" link type="danger" @click="handleClear">
          <el-icon><Delete /></el-icon>清空列表
        </el-button>
      </div>

      <transition-group v-if="fileList.length" tag="div" name="fu" class="fu-list">
        <div
          v-for="item in fileList"
          :key="item.uid"
          class="fu-item"
          :class="`is-${item.status}`"
        >
          <div
            class="fu-item__icon"
            :style="{ color: item.meta.color, backgroundColor: `${item.meta.color}14` }"
          >
            <el-icon :size="20"><component :is="item.meta.icon" /></el-icon>
          </div>

          <div class="fu-item__main">
            <div class="fu-item__row">
              <span class="fu-item__name" :title="item.name">{{ item.name }}</span>
              <span class="fu-item__state" :class="`is-${item.status}`">
                <el-icon v-if="item.status === 'uploading'" :size="13" class="is-loading">
                  <Loading />
                </el-icon>
                <el-icon v-else-if="item.status === 'success'" :size="13">
                  <CircleCheckFilled />
                </el-icon>
                <el-icon v-else :size="13"><CircleCloseFilled /></el-icon>
                {{ item.status === 'uploading' ? `上传中 ${item.percent}%` : item.status === 'success' ? '已完成' : '上传失败' }}
              </span>
            </div>

            <el-progress
              v-if="item.status === 'uploading'"
              :percentage="item.percent"
              :stroke-width="4"
              :show-text="false"
              class="fu-item__progress"
            />
            <el-progress
              v-else-if="item.status === 'fail'"
              :percentage="Math.max(item.percent, 15)"
              :stroke-width="4"
              :show-text="false"
              status="exception"
              class="fu-item__progress"
            />

            <div class="fu-item__sub">
              <span>{{ formatSize(item.size) }}</span>
              <el-tag
                v-if="limitReached && item.status === 'fail'"
                size="small"
                type="danger"
                effect="plain"
              >
                可删除后重试
              </el-tag>
            </div>
          </div>

          <div class="fu-item__actions">
            <el-tooltip content="预览" placement="top">
              <el-button
                circle
                text
                :disabled="item.status !== 'success'"
                @click="handlePreview(item)"
              >
                <el-icon><ZoomIn /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip content="下载" placement="top">
              <el-button
                circle
                text
                :disabled="item.status !== 'success'"
                @click="handleDownload(item)"
              >
                <el-icon><Download /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip v-if="item.status === 'fail' && !disabled" content="重试" placement="top">
              <el-button circle text type="primary" @click="handleRetry(item)">
                <el-icon><RefreshRight /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip
              :content="item.status === 'uploading' ? '取消上传' : '删除'"
              placement="top"
            >
              <el-button
                v-if="!disabled"
                circle
                text
                :type="item.status === 'uploading' ? 'warning' : 'danger'"
                @click="handleRemove(item)"
              >
                <el-icon><Close v-if="item.status === 'uploading'" /><Delete v-else /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </transition-group>
    </template>

    <!-- 图片预览弹窗 -->
    <el-dialog
      v-model="previewVisible"
      title="图片预览"
      width="auto"
      align-center
      append-to-body
      class="fu-preview-dialog"
    >
      <img :src="previewUrl" class="fu-preview-img" alt="preview">
    </el-dialog>
  </div>
</template>

<style scoped>
.file-upload {
  width: 100%;
  /* 作为 flex 子项参与父容器高度分配：列表区在空间不足时收缩并内部滚动；
     父容器不是 flex 时这些属性被忽略，组件退化为自然高度 + max-height 兜底 */
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* 卡片内滚动区域统一使用细滚动条（Windows 下更精致） */
.fu-list,
.fu-pictures {
  scrollbar-width: thin;
  scrollbar-color: rgba(144, 147, 153, 0.35) transparent;
}

.fu-list::-webkit-scrollbar,
.fu-pictures::-webkit-scrollbar {
  width: 6px;
}

.fu-list::-webkit-scrollbar-thumb,
.fu-pictures::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background-color: rgba(144, 147, 153, 0.3);
}

.fu-list::-webkit-scrollbar-thumb:hover,
.fu-pictures::-webkit-scrollbar-thumb:hover {
  background-color: rgba(144, 147, 153, 0.5);
}

.fu-list::-webkit-scrollbar-track,
.fu-pictures::-webkit-scrollbar-track {
  background: transparent;
}

/* ---------- 拖拽区 ---------- */
.fu-upload {
  flex-shrink: 0;
}

.fu-upload :deep(.el-upload-dragger) {
  width: 100%;
  height: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 20px;
  border-radius: 12px;
  border: 1.5px dashed var(--el-border-color);
  background: var(--el-fill-color-lighter);
  transition: border-color 0.25s ease, background-color 0.25s ease;
}

.fu-upload:hover :deep(.el-upload-dragger),
.fu-upload :deep(.el-upload-dragger.is-dragover) {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.fu-upload :deep(.el-icon--upload) {
  margin-bottom: 10px;
  color: var(--el-color-primary);
}

.fu-upload :deep(.el-upload__text) {
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.fu-upload :deep(.el-upload__text em) {
  color: var(--el-color-primary);
  font-style: normal;
}

.fu-upload--off {
  opacity: 0.55;
  pointer-events: none;
}

.fu-hint {
  margin-top: 10px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.fu-hint--inline {
  margin: 0 0 0 12px;
}

/* ---------- 列表头部 ---------- */
.fu-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.fu-list-header__title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

/* ---------- 文件列表（默认最高 360px；父容器高度受限时自动收缩，滚动只发生在列表内部） ---------- */
.fu-list {
  flex: 0 1 auto;
  min-height: 0;
  max-height: 360px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 4px;
  overflow-y: auto;
}

.fu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background-color: var(--el-bg-color);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.fu-item:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 4px 14px rgba(64, 158, 255, 0.08);
}

.fu-item.is-fail {
  border-color: var(--el-color-danger-light-5);
  background-color: var(--el-color-danger-light-9);
}

.fu-item__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  flex-shrink: 0;
}

.fu-item__main {
  flex: 1;
  min-width: 0;
}

.fu-item__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.fu-item__name {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fu-item__state {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  flex-shrink: 0;
}

.fu-item__state.is-uploading {
  color: var(--el-color-warning);
}

.fu-item__state.is-success {
  color: var(--el-color-success);
}

.fu-item__state.is-fail {
  color: var(--el-color-danger);
}

.fu-item__progress {
  margin-top: 5px;
}

.fu-item__sub {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 3px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.fu-item__actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  opacity: 0.65;
  transition: opacity 0.2s ease;
}

.fu-item:hover .fu-item__actions {
  opacity: 1;
}

/* 列表进出动画 */
.fu-enter-active {
  transition: all 0.25s ease;
}

.fu-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}

.fu-leave-active {
  transition: all 0.2s ease;
}

.fu-leave-to {
  opacity: 0;
  transform: translateX(14px);
}

.fu-move {
  transition: transform 0.25s ease;
}

/* ---------- 图片墙（超过高度后卡片内部滚动） ---------- */
.fu-pictures {
  flex: 0 1 auto;
  min-height: 0;
  max-height: 360px;
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 12px;
  padding-right: 4px;
  overflow-y: auto;
}

/* 图片墙 / 非拖拽模式下方的说明文字 */
.fu-side-hint {
  flex-shrink: 0;
  margin-top: 10px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.fu-picture {
  position: relative;
  width: 108px;
  height: 108px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-lighter);
}

.fu-picture img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.fu-picture__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.fu-picture__mask,
.fu-picture__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #fff;
}

.fu-picture__mask {
  background: rgba(0, 0, 0, 0.45);
  opacity: 0;
  transition: opacity 0.2s ease;
  cursor: pointer;
}

.fu-picture:hover .fu-picture__mask {
  opacity: 1;
}

.fu-picture__overlay {
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  background: rgba(0, 0, 0, 0.4);
}

.fu-picture__overlay.is-fail {
  gap: 8px;
  background: rgba(245, 108, 108, 0.82);
}

.fu-tile-uploader {
  width: 108px;
  height: 108px;
  border: 1.5px dashed var(--el-border-color);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-lighter);
  transition: border-color 0.2s ease, color 0.2s ease, background-color 0.2s ease;
  cursor: pointer;
}

.fu-tile-uploader:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.fu-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 12px;
  padding: 8px;
  text-align: center;
}

/* ---------- 预览弹窗 ---------- */
.fu-preview-img {
  display: block;
  max-width: 80vw;
  max-height: 70vh;
  border-radius: 8px;
}
</style>
