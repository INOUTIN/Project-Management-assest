<template>
  <div class="reminder-task-list">
    <!-- 列表头部 -->
    <div class="task-list-header">
      <div class="header-info">
        <span class="task-count">共 {{ tasks.length }} 个任务</span>
        <el-button 
          v-if="selectedTasks.length > 0"
          type="primary" 
          size="small"
          @click="showBatchActions = !showBatchActions"
        >
          批量操作 ({{ selectedTasks.length }})
        </el-button>
      </div>
      
      <!-- 批量操作栏 -->
      <div v-if="showBatchActions" class="batch-actions">
        <el-button-group>
          <el-button size="small" @click="handleBatchStatusUpdate('completed')">
            标记完成
          </el-button>
          <el-button size="small" @click="handleBatchStatusUpdate('in_progress')">
            标记进行中
          </el-button>
          <el-button size="small" @click="showBatchExtendDialog = true">
            批量延期
          </el-button>
        </el-button-group>
        <el-button size="small" @click="clearSelection">清除选择</el-button>
      </div>
    </div>

    <!-- 任务列表 -->
    <div class="task-list-content">
      <el-table
        :data="tasks"
        @selection-change="handleSelectionChange"
        empty-text="暂无任务"
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column label="任务名称" min-width="200">
          <template #default="{ row }">
            <div class="task-name-cell">
              <span class="task-name">{{ row.name }}</span>
              <el-tag v-if="row.isMilestone" type="warning" size="small">里程碑</el-tag>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="所属项目" width="150">
          <template #default="{ row }">
            <span class="project-name">{{ row.projectName || '未知项目' }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="责任人" width="120">
          <template #default="{ row }">
            <span class="assignee">{{ row.assignee || '未分配' }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="截止时间" width="120">
          <template #default="{ row }">
            <span :class="getDateClass(row.endDate)">
              {{ formatDate(row.endDate) }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column label="剩余时间" width="100">
          <template #default="{ row }">
            <el-tag :type="getTimeTagType(row.endDate)" size="small">
              {{ getTimeRemaining(row.endDate) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-select
              v-model="row.status"
              size="small"
              @change="handleStatusChange(row)"
            >
              <el-option label="未开始" value="not_started" />
              <el-option label="进行中" value="in_progress" />
              <el-option label="已完成" value="completed" />
            </el-select>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <el-button 
                :icon="View" 
                size="small" 
                @click="handleViewTask(row)"
                title="查看详情"
              />
              <el-button 
                :icon="Edit" 
                size="small" 
                @click="handleEditTask(row)"
                title="编辑任务"
              />
              <el-button 
                :icon="Clock" 
                size="small" 
                @click="handleExtendTask(row)"
                title="延期"
              />
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 批量延期对话框 -->
    <el-dialog
      v-model="showBatchExtendDialog"
      title="批量延期任务"
      width="500px"
    >
      <el-form :model="batchExtendForm" label-width="100px">
        <el-form-item label="延期天数">
          <el-input-number
            v-model="batchExtendForm.days"
            :min="1"
            :max="365"
            controls-position="right"
          />
          <span class="form-help">天</span>
        </el-form-item>
        <el-form-item label="延期原因">
          <el-input
            v-model="batchExtendForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入延期原因（可选）"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showBatchExtendDialog = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmBatchExtend">
          确认延期
        </el-button>
      </template>
    </el-dialog>

    <!-- 任务详情对话框 -->
    <el-dialog
      v-model="showTaskDetailDialog"
      :title="selectedTask?.name"
      width="600px"
    >
      <div v-if="selectedTask" class="task-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="任务名称">
            {{ selectedTask.name }}
          </el-descriptions-item>
          <el-descriptions-item label="所属项目">
            {{ selectedTask.projectName || '未知项目' }}
          </el-descriptions-item>
          <el-descriptions-item label="责任人">
            {{ selectedTask.assignee || '未分配' }}
          </el-descriptions-item>
          <el-descriptions-item label="任务状态">
            <el-tag :type="getStatusTagType(selectedTask.status)">
              {{ getStatusText(selectedTask.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="开始时间">
            {{ formatDateTime(selectedTask.startDate) }}
          </el-descriptions-item>
          <el-descriptions-item label="结束时间">
            {{ formatDateTime(selectedTask.endDate) }}
          </el-descriptions-item>
          <el-descriptions-item label="任务描述" :span="2">
            {{ selectedTask.description || '暂无描述' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { View, Edit, Clock } from '@element-plus/icons-vue'
import { DateUtils } from '@shared/utils/date.js'
import { TASK_STATUS } from '@shared/utils/constants.js'

const props = defineProps({
  tasks: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['task-updated', 'batch-update'])

// 响应式数据
const selectedTasks = ref([])
const showBatchActions = ref(false)
const showBatchExtendDialog = ref(false)
const showTaskDetailDialog = ref(false)
const selectedTask = ref(null)

const batchExtendForm = ref({
  days: 7,
  reason: ''
})

// 方法
const handleSelectionChange = (selection) => {
  selectedTasks.value = selection
  if (selection.length === 0) {
    showBatchActions.value = false
  }
}

const clearSelection = () => {
  selectedTasks.value = []
  showBatchActions.value = false
}

const handleStatusChange = (task) => {
  emit('task-updated', task)
}

const handleBatchStatusUpdate = (status) => {
  const taskIds = selectedTasks.value.map(task => task.id)
  emit('batch-update', taskIds, { status })
  clearSelection()
}

const handleConfirmBatchExtend = () => {
  const taskIds = selectedTasks.value.map(task => task.id)
  const updates = {
    endDate: DateUtils.addDays(new Date(), batchExtendForm.value.days).toISOString(),
    extendReason: batchExtendForm.value.reason
  }
  
  emit('batch-update', taskIds, updates)
  showBatchExtendDialog.value = false
  clearSelection()
  
  // 重置表单
  batchExtendForm.value = {
    days: 7,
    reason: ''
  }
}

const handleViewTask = (task) => {
  selectedTask.value = task
  showTaskDetailDialog.value = true
}

const handleEditTask = (task) => {
  // 这里可以跳转到任务编辑页面或打开编辑对话框
  ElMessage.info('任务编辑功能待实现')
}

const handleExtendTask = async (task) => {
  try {
    const { value: days } = await ElMessageBox.prompt(
      '请输入延期天数',
      '延期任务',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /^\d+$/,
        inputErrorMessage: '请输入有效的天数'
      }
    )
    
    const newEndDate = DateUtils.addDays(new Date(task.endDate), parseInt(days))
    const updatedTask = {
      ...task,
      endDate: newEndDate.toISOString()
    }
    
    emit('task-updated', updatedTask)
    ElMessage.success(`任务已延期 ${days} 天`)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('延期失败: ' + error.message)
    }
  }
}

// 工具方法
const formatDate = (date) => {
  return DateUtils.format(date, 'MM-DD')
}

const formatDateTime = (date) => {
  return DateUtils.format(date, 'YYYY-MM-DD HH:mm')
}

const getDateClass = (endDate) => {
  const days = DateUtils.diffInDays(new Date(), new Date(endDate))
  if (days < 0) return 'date-overdue'
  if (days <= 1) return 'date-urgent'
  return 'date-normal'
}

const getTimeRemaining = (endDate) => {
  const days = DateUtils.diffInDays(new Date(), new Date(endDate))
  if (days < 0) return `超期${Math.abs(days)}天`
  if (days === 0) return '今天'
  return `${days}天`
}

const getTimeTagType = (endDate) => {
  const days = DateUtils.diffInDays(new Date(), new Date(endDate))
  if (days < 0) return 'danger'
  if (days <= 1) return 'warning'
  return 'info'
}

const getStatusText = (status) => {
  const statusMap = {
    [TASK_STATUS.NOT_STARTED]: '未开始',
    [TASK_STATUS.IN_PROGRESS]: '进行中',
    [TASK_STATUS.COMPLETED]: '已完成',
    [TASK_STATUS.OVERDUE]: '超期'
  }
  return statusMap[status] || '未知'
}

const getStatusTagType = (status) => {
  const typeMap = {
    [TASK_STATUS.NOT_STARTED]: 'info',
    [TASK_STATUS.IN_PROGRESS]: 'warning',
    [TASK_STATUS.COMPLETED]: 'success',
    [TASK_STATUS.OVERDUE]: 'danger'
  }
  return typeMap[status] || 'info'
}
</script>

<style lang="scss" scoped>
.reminder-task-list {
  .task-list-header {
    margin-bottom: 16px;
    
    .header-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      
      .task-count {
        font-size: 14px;
        color: var(--color-text-secondary);
      }
    }
    
    .batch-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: var(--color-bg-light);
      border-radius: 6px;
      border: 1px solid var(--color-border-light);
    }
  }
  
  .task-name-cell {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .task-name {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
  
  .project-name,
  .assignee {
    color: var(--color-text-secondary);
    font-size: 13px;
  }
  
  .date-overdue {
    color: var(--color-danger);
    font-weight: 600;
  }
  
  .date-urgent {
    color: var(--color-warning);
    font-weight: 600;
  }
  
  .date-normal {
    color: var(--color-text-secondary);
  }
  
  .form-help {
    margin-left: 8px;
    color: var(--color-text-secondary);
    font-size: 13px;
  }
  
  .task-detail {
    .el-descriptions {
      margin-top: 16px;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .reminder-task-list {
    .task-list-header {
      .header-info {
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
      }
      
      .batch-actions {
        flex-direction: column;
        gap: 8px;
        
        .el-button-group {
          width: 100%;
          
          .el-button {
            flex: 1;
          }
        }
      }
    }
  }
}
</style>