<template>
  <el-dialog
    v-model="visible"
    :fullscreen="true"
    :show-close="false"
    class="overdue-fullscreen-dialog"
    :before-close="handleClose"
  >
    <!-- 全屏头部 -->
    <template #header>
      <div class="fullscreen-header">
        <div class="header-left">
          <el-icon class="header-icon" :size="24">
            <component :is="headerIcon" />
          </el-icon>
          <div class="header-title">
            <h2>{{ title }} - 全屏视图</h2>
            <p class="header-subtitle">共 {{ tasks.length }} 个任务</p>
          </div>
        </div>
        <div class="header-actions">
          <el-button-group>
            <el-button 
              :icon="Grid" 
              :type="viewMode === 'table' ? 'primary' : ''"
              @click="viewMode = 'table'"
              title="表格视图"
            />
            <el-button 
              :icon="List" 
              :type="viewMode === 'list' ? 'primary' : ''"
              @click="viewMode = 'list'"
              title="列表视图"
            />
          </el-button-group>
          <el-button :icon="Download" @click="exportTasks">导出</el-button>
          <el-button :icon="Refresh" @click="refreshTasks">刷新</el-button>
          <el-button :icon="Close" @click="handleClose">关闭</el-button>
        </div>
      </div>
    </template>

    <!-- 全屏内容 -->
    <div class="fullscreen-content">
      <!-- 筛选工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索任务名称或项目..."
            :prefix-icon="Search"
            clearable
            style="width: 300px"
          />
          <el-select
            v-model="statusFilter"
            placeholder="状态筛选"
            clearable
            style="width: 150px"
          >
            <el-option label="全部" value="" />
            <el-option label="未开始" value="not_started" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
          </el-select>
          <el-select
            v-model="projectFilter"
            placeholder="项目筛选"
            clearable
            style="width: 200px"
          >
            <el-option label="全部项目" value="" />
            <el-option 
              v-for="project in uniqueProjects" 
              :key="project"
              :label="project"
              :value="project"
            />
          </el-select>
        </div>
        <div class="toolbar-right">
          <el-text class="task-count">
            显示 {{ filteredTasks.length }} / {{ tasks.length }} 个任务
          </el-text>
        </div>
      </div>

      <!-- 任务列表 -->
      <div class="task-list-container">
        <!-- 表格视图 -->
        <el-table
          v-if="viewMode === 'table'"
          :data="filteredTasks"
          stripe
          height="100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="name" label="任务名称" min-width="200">
            <template #default="{ row }">
              <div class="task-name-cell">
                <el-text class="task-name" :type="getTaskNameType(row)">
                  {{ row.name }}
                </el-text>
                <el-tag v-if="row.isMilestone" size="small" type="info">里程碑</el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="projectName" label="所属项目" width="180" />
          <el-table-column prop="assignee" label="责任人" width="120" />
          <el-table-column label="计划完成" width="120">
            <template #default="{ row }">
              {{ formatDate(row.endDate) }}
            </template>
          </el-table-column>
          <el-table-column label="超期天数" width="100">
            <template #default="{ row }">
              <el-tag :type="getOverdueTagType(row)" size="small">
                {{ getOverdueDays(row) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)" size="small">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button-group size="small">
                <el-button :icon="View" @click="viewTask(row)" title="查看详情" />
                <el-button :icon="Edit" @click="editTask(row)" title="编辑任务" />
                <el-button 
                  :icon="Clock" 
                  type="warning" 
                  @click="extendDeadline(row)"
                  title="延期"
                />
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>

        <!-- 列表视图 -->
        <div v-else-if="viewMode === 'list'" class="list-view">
          <div 
            v-for="task in filteredTasks" 
            :key="task.id"
            class="task-card"
            :class="{ 'task-card--overdue': isOverdue(task) }"
          >
            <div class="task-card-header">
              <div class="task-info">
                <h4 class="task-title">{{ task.name }}</h4>
                <p class="task-project">{{ task.projectName || '未知项目' }}</p>
              </div>
              <div class="task-status">
                <el-tag :type="getOverdueTagType(task)" size="small">
                  {{ getOverdueDays(task) }}
                </el-tag>
              </div>
            </div>
            <div class="task-card-body">
              <div class="task-details">
                <div class="detail-item">
                  <el-icon><User /></el-icon>
                  <span>{{ task.assignee || '未分配' }}</span>
                </div>
                <div class="detail-item">
                  <el-icon><Calendar /></el-icon>
                  <span>{{ formatDate(task.endDate) }}</span>
                </div>
                <div class="detail-item">
                  <el-icon><Flag /></el-icon>
                  <el-tag :type="getStatusTagType(task.status)" size="small">
                    {{ getStatusText(task.status) }}
                  </el-tag>
                </div>
              </div>
              <div class="task-actions">
                <el-button-group size="small">
                  <el-button :icon="View" @click="viewTask(task)">查看</el-button>
                  <el-button :icon="Edit" @click="editTask(task)">编辑</el-button>
                  <el-button :icon="Clock" type="warning" @click="extendDeadline(task)">延期</el-button>
                </el-button-group>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 批量操作栏 -->
      <div v-if="selectedTasks.length > 0" class="batch-actions">
        <div class="batch-info">
          已选择 {{ selectedTasks.length }} 个任务
        </div>
        <div class="batch-buttons">
          <el-button :icon="Clock" type="warning" @click="batchExtendDeadline">
            批量延期
          </el-button>
          <el-button :icon="User" @click="batchAssign">
            批量分配
          </el-button>
          <el-button :icon="Edit" @click="batchEdit">
            批量编辑
          </el-button>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Close, Grid, List, Download, Refresh, Search, View, Edit, Clock,
  User, Calendar, Flag, Warning
} from '@element-plus/icons-vue'
import { DateUtils } from '@shared/utils/date.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    required: true
  },
  tasks: {
    type: Array,
    default: () => []
  },
  type: {
    type: String,
    default: 'normal',
    validator: (value) => ['urgent', 'normal'].includes(value)
  }
})

const emit = defineEmits(['update:modelValue', 'task-updated', 'refresh'])

// 响应式数据
const visible = ref(false)
const viewMode = ref('table')
const searchKeyword = ref('')
const statusFilter = ref('')
const projectFilter = ref('')
const selectedTasks = ref([])

// 计算属性
const headerIcon = computed(() => {
  return props.type === 'urgent' ? Warning : Clock
})

const uniqueProjects = computed(() => {
  const projects = [...new Set(props.tasks.map(task => task.projectName).filter(Boolean))]
  return projects.sort()
})

const filteredTasks = computed(() => {
  let filtered = [...props.tasks]

  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(task => 
      task.name.toLowerCase().includes(keyword) ||
      (task.projectName && task.projectName.toLowerCase().includes(keyword))
    )
  }

  // 状态过滤
  if (statusFilter.value) {
    filtered = filtered.filter(task => task.status === statusFilter.value)
  }

  // 项目过滤
  if (projectFilter.value) {
    filtered = filtered.filter(task => task.projectName === projectFilter.value)
  }

  return filtered
})

// 监听器
watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
})

watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
  if (!newVal) {
    // 关闭时重置状态
    searchKeyword.value = ''
    statusFilter.value = ''
    projectFilter.value = ''
    selectedTasks.value = []
  }
})

// 方法
const handleClose = () => {
  visible.value = false
}

const handleSelectionChange = (selection) => {
  selectedTasks.value = selection
}

const formatDate = (dateStr) => {
  return DateUtils.format(new Date(dateStr), 'MM-DD')
}

const isOverdue = (task) => {
  return new Date(task.endDate) < new Date()
}

const getOverdueDays = (task) => {
  const endDate = new Date(task.endDate)
  const now = new Date()
  const diffDays = Math.ceil((now - endDate) / (1000 * 60 * 60 * 24))
  
  if (diffDays > 0) {
    return `超期${diffDays}天`
  } else if (diffDays === 0) {
    return '今天截止'
  } else {
    return `剩余${Math.abs(diffDays)}天`
  }
}

const getOverdueTagType = (task) => {
  const endDate = new Date(task.endDate)
  const now = new Date()
  const diffDays = Math.ceil((now - endDate) / (1000 * 60 * 60 * 24))
  
  if (diffDays > 0) return 'danger'
  if (diffDays === 0) return 'warning'
  return 'info'
}

const getTaskNameType = (task) => {
  return isOverdue(task) ? 'danger' : 'primary'
}

const getStatusText = (status) => {
  const statusMap = {
    'not_started': '未开始',
    'in_progress': '进行中',
    'completed': '已完成'
  }
  return statusMap[status] || status
}

const getStatusTagType = (status) => {
  const typeMap = {
    'not_started': 'info',
    'in_progress': 'warning',
    'completed': 'success'
  }
  return typeMap[status] || 'info'
}

const viewTask = (task) => {
  // TODO: 实现查看任务详情
  ElMessage.info(`查看任务: ${task.name}`)
}

const editTask = (task) => {
  // TODO: 实现编辑任务
  ElMessage.info(`编辑任务: ${task.name}`)
}

const extendDeadline = async (task) => {
  try {
    const { value } = await ElMessageBox.prompt(
      `为任务"${task.name}"设置新的截止日期`,
      '延期任务',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputType: 'date',
        inputValue: task.endDate
      }
    )
    
    if (value) {
      // TODO: 实现延期逻辑
      ElMessage.success(`任务"${task.name}"已延期至 ${value}`)
      emit('task-updated', { ...task, endDate: value })
    }
  } catch {
    // 用户取消
  }
}

const refreshTasks = () => {
  emit('refresh')
  ElMessage.success('任务列表已刷新')
}

const exportTasks = () => {
  // TODO: 实现导出功能
  ElMessage.info('导出功能开发中...')
}

const batchExtendDeadline = async () => {
  try {
    const { value } = await ElMessageBox.prompt(
      `为选中的 ${selectedTasks.value.length} 个任务设置新的截止日期`,
      '批量延期',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputType: 'date'
      }
    )
    
    if (value) {
      // TODO: 实现批量延期逻辑
      ElMessage.success(`已为 ${selectedTasks.value.length} 个任务延期至 ${value}`)
      selectedTasks.value = []
    }
  } catch {
    // 用户取消
  }
}

const batchAssign = () => {
  // TODO: 实现批量分配
  ElMessage.info('批量分配功能开发中...')
}

const batchEdit = () => {
  // TODO: 实现批量编辑
  ElMessage.info('批量编辑功能开发中...')
}
</script>

<style lang="scss" scoped>
.overdue-fullscreen-dialog {
  :deep(.el-dialog__header) {
    padding: 0;
    margin: 0;
  }
  
  :deep(.el-dialog__body) {
    padding: 0;
    height: 100vh;
    display: flex;
    flex-direction: column;
  }
}

.fullscreen-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #dee2e6;
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
    
    .header-icon {
      color: var(--el-color-primary);
    }
    
    .header-title {
      h2 {
        margin: 0 0 4px 0;
        font-size: 20px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
      
      .header-subtitle {
        margin: 0;
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }
    }
  }
  
  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

.fullscreen-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  
  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .toolbar-right {
    .task-count {
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }
  }
}

.task-list-container {
  flex: 1;
  overflow: hidden;
  padding: 0 24px;
}

.task-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .task-name {
    font-weight: 500;
  }
}

.list-view {
  height: 100%;
  overflow-y: auto;
  padding: 16px 0;
  
  .task-card {
    background: #fff;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    margin-bottom: 12px;
    transition: all 0.3s ease;
    
    &:hover {
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    }
    
    &--overdue {
      border-left: 4px solid var(--el-color-danger);
    }
    
    &-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 16px 20px 12px;
      
      .task-info {
        flex: 1;
        
        .task-title {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }
        
        .task-project {
          margin: 0;
          font-size: 14px;
          color: var(--el-text-color-secondary);
        }
      }
    }
    
    &-body {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 20px 16px;
      
      .task-details {
        display: flex;
        gap: 24px;
        
        .detail-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: var(--el-text-color-regular);
          
          .el-icon {
            font-size: 16px;
          }
        }
      }
    }
  }
}

.batch-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: var(--el-color-primary-light-9);
  border-top: 1px solid var(--el-color-primary-light-7);
  
  .batch-info {
    font-size: 14px;
    color: var(--el-color-primary);
    font-weight: 500;
  }
  
  .batch-buttons {
    display: flex;
    gap: 8px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .fullscreen-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
    
    .header-actions {
      justify-content: center;
    }
  }
  
  .toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
    
    .toolbar-left {
      flex-wrap: wrap;
    }
  }
  
  .batch-actions {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
}
</style>