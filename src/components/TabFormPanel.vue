<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  tabName: {
    type: String,
    default: '',
  },
})

const formRef = ref(null)

// 每个标签页持有独立表单状态（组件实例常驻，切换标签页数据不丢失）
const form = reactive({
  name: '',
  region: '',
  date: '',
  delivery: false,
  type: [],
  resource: '',
  desc: '',
  rate: 0,
})

const regionOptions = ['区域一', '区域二', '区域三']
const typeOptions = ['美食', '线上活动', '品牌推广', '线下活动']
const resourceOptions = ['线上品牌商赞助', '线下场地免费']

const rules = {
  name: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
  region: [{ required: true, message: '请选择活动区域', trigger: 'change' }],
  date: [{ required: true, message: '请选择活动时间', trigger: 'change' }],
  type: [
    {
      type: 'array',
      required: true,
      message: '请至少选择一项活动性质',
      trigger: 'change',
    },
  ],
  resource: [{ required: true, message: '请选择活动资源', trigger: 'change' }],
  desc: [{ required: true, message: '请填写活动形式', trigger: 'blur' }],
}

const onSubmit = () => {
  formRef.value.validate((valid) => {
    if (valid) {
      ElMessage.success(`「${props.tabName}」表单校验通过`)
    } else {
      ElMessage.error(`「${props.tabName}」表单校验未通过，请检查填写内容`)
      return false
    }
  })
}

const onReset = () => {
  formRef.value.resetFields()
}
</script>

<template>
  <div class="tab-form-panel">
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      class="form-body"
    >
      <el-form-item label="活动名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入活动名称" clearable />
      </el-form-item>
      <el-form-item label="活动区域" prop="region">
        <el-select v-model="form.region" placeholder="请选择活动区域" clearable>
          <el-option
            v-for="item in regionOptions"
            :key="item"
            :label="item"
            :value="item"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="活动时间" prop="date">
        <el-date-picker
          v-model="form.date"
          type="datetime"
          placeholder="请选择活动时间"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </el-form-item>
      <el-form-item label="即时配送" prop="delivery">
        <el-switch v-model="form.delivery" />
      </el-form-item>
      <el-form-item label="活动性质" prop="type">
        <el-checkbox-group v-model="form.type">
          <el-checkbox v-for="item in typeOptions" :key="item" :value="item">
            {{ item }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>
      <el-form-item label="特殊资源" prop="resource">
        <el-radio-group v-model="form.resource">
          <el-radio v-for="item in resourceOptions" :key="item" :value="item">
            {{ item }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="活动形式" prop="desc">
        <el-input
          v-model="form.desc"
          type="textarea"
          :rows="3"
          placeholder="请填写活动形式"
        />
      </el-form-item>
      <el-form-item label="满意度" prop="rate">
        <el-rate v-model="form.rate" allow-half show-text />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit">提交</el-button>
        <el-button @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped>
.form-body {
  max-width: 640px;
  padding-top: 8px;
}
</style>
