<template>
  <div class="project-form">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      label-position="left"
    >
      <!-- 基本信息 -->
      <div class="form-section">
        <h3 class="section-title">基本信息</h3>
        
        <el-form-item label="项目名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="请输入项目名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="项目描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            placeholder="请输入项目描述"
            :rows="3"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始时间" prop="startDate">
              <el-date-picker
                v-model="formData.startDate"
                type="date"
                placeholder="选择开始时间"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间" prop="endDate">
              <el-date-picker
                v-model="formData.endDate"
                type="date"
                placeholder="选择结束时间"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="项目状态" prop="status">
          <el-select v-model="formData.status" placeholder="选择项目状态" style="width: 100%">
            <el-option label="未开始" value="not_started" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="已暂停" value="paused" />
          </el-select>
        </el-form-item>
      </div>

      <!-- 任务节点 -->
      <div class="form-section">
        <div class="section-header">
          <h3 class="section-title">任务节点</h3>
          <el-button
            type="primary"
            size="small"
            :icon="Plus"
            @click="addTask"
          >
            添加任务
          </el-button>
        </div>

        <div v-if="formData.tasks.length === 0" class="empty-tasks">
          <el-empty description="暂无任务节点" :image-size="80">
            <el-button type="primary" @click="addTask">添加第一个任务</el-button>
          </el-empty>
        </div>

        <div v-else class="tasks-list">
          <div
            v-for="(task, index) in formData.tasks"
            :key="task.tempId"
            class="task-item"
          >
            <div class="task-header">
              <span class="task-index">任务 {{ index + 1 }}</span>
              <el-button
                type="danger"
                size="small"
                text
                :icon="Delete"
                @click="removeTask(index)"
              >
                删除
              </el-button>
            </div>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item
                  :prop="`tasks.${index}.name`"
                  :rules="taskRules.name"
                  label="任务名称"
                >
                  <el-input
                    v-model="task.name"
                    placeholder="请输入任务名称"
                    maxlength="50"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="责任人">
                  <el-input
                    v-model="task.assignee"
                    placeholder="请输入责任人"
                    maxlength="20"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="任务描述">
              <el-input
                v-model="task.description"
                type="textarea"
                placeholder="请输入任务描述"
                :rows="2"
                maxlength="100"
              />
            </el-form-item>

            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item
                  :prop="`tasks.${index}.startDate`"
                  :rules="taskRules.startDate"
                  label="开始时间"
                >
                  <el-date-picker
                    v-model="task.startDate"
                    type="date"
                    placeholder="选择开始时间"
                    style="width: 100%"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item
                  :prop="`tasks.${index}.endDate`"
                  :rules="taskRules.endDate"
                  label="结束时间"
                >
                  <el-date-picker
                    v-model="task.endDate"
                    type="date"
                    placeholder="选择结束时间"
                    style="width: 100%"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="里程碑">
                  <el-switch
                    v-model="task.isMilestone"
                    active-text="是"
                    inactive-text="否"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </div>
      </div>
    </el-form>

    <!-- 操作按钮 -->
    <div class="form-actions">
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="submitting">
        {{ isEdit ? '更新项目' : '创建项目' }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import { DateUtils } from '@shared/utils/date.js'

// Props
const props = defineProps({
  project: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['submit', 'cancel'])

// 响应式数据
const formRef = ref()
const submitting = ref(false)

// 计算属性
const isEdit = computed(() => !!props.project)

// 表单数据
const formData = ref({
  name: '',
  description: '',
  startDate: '',
  endDate: '',
  status: 'not_started',
  tasks: []
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
    { min: 2, max: 50, message: '项目名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '项目描述不能超过 200 个字符', trigger: 'blur' }
  ],
  startDate: [
    { required: true, message: '请选择开始时间', trigger: 'change' }
  ],
  endDate: [
    { required: true, message: '请选择结束时间', trigger: 'change' },
    {
      validator: (rule, value, callback) => {
        if (value && formData.value.startDate && value <= formData.value.startDate) {
          callback(new Error('结束时间必须晚于开始时间'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  status: [
    { required: true, message: '请选择项目状态', trigger: 'change' }
  ]
}

// 任务验证规则
const taskRules = {
  name: [
    { required: true, message: '请输入任务名称', trigger: 'blur' },
    { min: 2, max: 50, message: '任务名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  startDate: [
    { required: true, message: '请选择任务开始时间', trigger: 'change' }
  ],
  endDate: [
    { required: true, message: '请选择任务结束时间', trigger: 'change' }
  ]
}

// 监听项目数据变化
watch(() => props.project, (newProject) => {
  if (newProject) {
    // 编辑模式，填充现有数据
    formData.value = {
      name: newProject.name || '',
      description: newProject.description || '',
      startDate: newProject.startDate || '',
      endDate: newProject.endDate || '',
      status: newProject.status || 'not_started',
      tasks: newProject.tasks ? newProject.tasks.map(task => ({
        ...task,
        tempId: Date.now() + Math.random()
      })) : []
    }
  } else {
    // 新建模式，重置表单
    resetForm()
  }
}, { immediate: true })

// 方法
const resetForm = () => {
  formData.value = {
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'not_started',
    tasks: []
  }
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

const addTask = () => {
  const newTask = {
    tempId: Date.now() + Math.random(),
    name: '',
    description: '',
    startDate: formData.value.startDate || '',
    endDate: formData.value.endDate || '',
    assignee: '',
    isMilestone: false,
    status: 'not_started'
  }
  formData.value.tasks.push(newTask)
}

const removeTask = (index) => {
  formData.value.tasks.splice(index, 1)
}

const handleSubmit = async () => {
  try {
    // 验证表单
    const valid = await formRef.value.validate()
    if (!valid) return

    submitting.value = true

    // 准备提交数据
    const submitData = {
      ...formData.value,
      tasks: formData.value.tasks.map(task => {
        const { tempId, ...taskData } = task
        return {
          ...taskData,
          id: task.id || `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
      })
    }

    // 如果是编辑模式，保留原有ID
    if (isEdit.value) {
      submitData.id = props.project.id
    }

    emit('submit', submitData)
    ElMessage.success(isEdit.value ? '项目更新成功' : '项目创建成功')
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
</script>

<style lang="scss" scoped>
.project-form {
  .form-section {
    margin-bottom: 24px;
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    
    .section-title {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      border-bottom: 2px solid var(--el-color-primary);
      padding-bottom: 8px;
    }
  }

  .empty-tasks {
    text-align: center;
    padding: 20px;
    border: 1px dashed var(--el-border-color);
    border-radius: 6px;
    background-color: var(--el-fill-color-lighter);
  }

  .tasks-list {
    .task-item {
      margin-bottom: 20px;
      padding: 16px;
      border: 1px solid var(--el-border-color);
      border-radius: 6px;
      background-color: var(--el-fill-color-extra-light);
      
      .task-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        
        .task-index {
          font-weight: 600;
          color: var(--el-color-primary);
        }
      }
    }
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 20px;
    border-top: 1px solid var(--el-border-color);
    margin-top: 20px;
  }
}
</style>