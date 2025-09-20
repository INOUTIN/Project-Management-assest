<template>
  <div class="task-form">
    <el-form 
      ref="formRef" 
      :model="formData" 
      :rules="rules" 
      label-width="100px"
      @submit.prevent="handleSubmit"
    >
      <!-- 基本信息 -->
      <div class="form-section">
        <h4 class="form-section__title">基本信息</h4>
        
        <el-form-item label="任务名称" prop="name">
          <el-input 
            v-model="formData.name" 
            placeholder="请输入任务名称"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="任务描述" prop="description">
          <el-input 
            v-model="formData.description" 
            type="textarea" 
            placeholder="请输入任务描述"
            :rows="3"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="责任人" prop="assignee">
          <el-input 
            v-model="formData.assignee" 
            placeholder="请输入责任人姓名"
            maxlength="50"
          />
        </el-form-item>
      </div>

      <!-- 时间安排 -->
      <div class="form-section">
        <h4 class="form-section__title">时间安排</h4>
        
        <el-form-item label="开始时间" prop="startDate">
          <el-date-picker
            v-model="formData.startDate"
            type="date"
            placeholder="选择开始时间"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="结束时间" prop="endDate">
          <el-date-picker
            v-model="formData.endDate"
            type="date"
            placeholder="选择结束时间"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </div>

      <!-- 任务属性 -->
      <div class="form-section">
        <h4 class="form-section__title">任务属性</h4>
        
        <el-form-item label="任务状态" prop="status">
          <el-select v-model="formData.status" placeholder="选择任务状态" style="width: 100%">
            <el-option label="未开始" value="not_started" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="超期" value="overdue" />
          </el-select>
        </el-form-item>

        <el-form-item label="里程碑" prop="isMilestone">
          <el-switch 
            v-model="formData.isMilestone"
            active-text="是"
            inactive-text="否"
          />
          <div class="form-item__help">
            里程碑任务将在甘特图中特殊标识
          </div>
        </el-form-item>
      </div>

      <!-- 操作按钮 -->
      <div class="form-actions">
        <el-button @click="handleCancel">取消</el-button>
        <el-button 
          type="primary" 
          @click="handleSubmit"
          :loading="submitting"
        >
          {{ task ? '更新任务' : '创建任务' }}
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { DateUtils } from '@/shared/utils/date.js'

// Props
const props = defineProps({
  task: {
    type: Object,
    default: null
  },
  projectId: {
    type: String,
    required: true
  }
})

// Emits
const emit = defineEmits(['submit', 'cancel'])

// 响应式数据
const formRef = ref(null)
const submitting = ref(false)

// 表单数据
const formData = reactive({
  name: '',
  description: '',
  assignee: '',
  startDate: '',
  endDate: '',
  status: 'not_started',
  isMilestone: false
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入任务名称', trigger: 'blur' },
    { min: 2, max: 100, message: '任务名称长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  startDate: [
    { required: true, message: '请选择开始时间', trigger: 'change' }
  ],
  endDate: [
    { required: true, message: '请选择结束时间', trigger: 'change' },
    {
      validator: (rule, value, callback) => {
        if (value && formData.startDate && new Date(value) <= new Date(formData.startDate)) {
          callback(new Error('结束时间必须晚于开始时间'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  status: [
    { required: true, message: '请选择任务状态', trigger: 'change' }
  ]
}

// 方法
const initFormData = () => {
  if (props.task) {
    // 编辑模式 - 填充现有数据
    Object.assign(formData, {
      name: props.task.name || '',
      description: props.task.description || '',
      assignee: props.task.assignee || '',
      startDate: props.task.startDate || '',
      endDate: props.task.endDate || '',
      status: props.task.status || 'not_started',
      isMilestone: props.task.isMilestone || false
    })
  } else {
    // 新建模式 - 设置默认值
    const today = DateUtils.format(new Date(), 'YYYY-MM-DD')
    const nextWeek = DateUtils.format(DateUtils.addDays(new Date(), 7), 'YYYY-MM-DD')
    
    Object.assign(formData, {
      name: '',
      description: '',
      assignee: '',
      startDate: today,
      endDate: nextWeek,
      status: 'not_started',
      isMilestone: false
    })
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    // 表单验证
    await formRef.value.validate()
    
    submitting.value = true

    // 准备提交数据
    const submitData = {
      ...formData,
      projectId: props.projectId,
      createdAt: props.task?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // 触发提交事件
    emit('submit', submitData)
    
  } catch (error) {
    console.error('Form validation failed:', error)
    ElMessage.error('请检查表单填写是否正确')
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  emit('cancel')
}

const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  initFormData()
}

// 监听 task 变化，重新初始化表单
watch(() => props.task, () => {
  nextTick(() => {
    initFormData()
  })
}, { immediate: true })

// 暴露方法给父组件
defineExpose({
  resetForm
})
</script>

<style lang="scss" scoped>
.task-form {
  .form-section {
    margin-bottom: 24px;

    &__title {
      font-size: 16px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 16px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--el-border-color-lighter);
    }

    &:last-of-type {
      margin-bottom: 0;
    }
  }

  .form-item__help {
    font-size: 12px;
    color: var(--color-text-secondary);
    margin-top: 4px;
    line-height: 1.4;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 32px;
    padding-top: 16px;
    border-top: 1px solid var(--el-border-color-lighter);
  }

  // Element Plus 组件样式调整
  :deep(.el-form-item) {
    margin-bottom: 20px;
  }

  :deep(.el-form-item__label) {
    font-weight: 500;
    color: var(--color-text-primary);
  }

  :deep(.el-input__wrapper) {
    border-radius: 6px;
  }

  :deep(.el-textarea__inner) {
    border-radius: 6px;
  }

  :deep(.el-select) {
    width: 100%;
  }

  :deep(.el-date-editor) {
    width: 100%;
  }

  :deep(.el-switch) {
    --el-switch-on-color: var(--el-color-primary);
  }

  // 响应式设计
  @media (max-width: 768px) {
    .form-actions {
      flex-direction: column-reverse;
      
      .el-button {
        width: 100%;
      }
    }
  }
}
</style>