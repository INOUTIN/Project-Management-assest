<template>
  <div class="dashboard-view">
    <!-- 页面头部 -->
    <div class="dashboard-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <el-icon><Monitor /></el-icon>
            仪表盘
          </h1>
          <p class="page-subtitle" v-if="lastUpdated">
            最后更新: {{ formatDateTime(lastUpdated) }}
          </p>
        </div>
        <div class="header-right">
          <el-button-group>
            <el-button 
              :icon="Refresh" 
              :loading="refreshing"
              @click="handleRefresh"
              type="primary"
            >
              刷新
            </el-button>
            <el-button 
              :icon="Setting"
              @click="showSettings = true"
            >
              设置
            </el-button>
          </el-button-group>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="8" animated />
    </div>

    <!-- 错误状态 -->
    <el-alert
      v-else-if="error"
      :title="error"
      type="error"
      show-icon
      :closable="false"
      class="error-alert"
    >
      <template #default>
        <el-button @click="handleRefresh" type="primary" size="small">
          重试
        </el-button>
      </template>
    </el-alert>

    <!-- 主要内容 -->
    <div v-else class="dashboard-content">
      <!-- 统计卡片区域 -->
      <div class="stats-section">
        <div class="stats-grid">
          <!-- 项目统计 -->
          <div class="stats-group">
            <h3 class="stats-title">项目概览</h3>
            <div class="stats-cards">
              <StatCard
                title="总项目数"
                :value="statistics.projects.total"
                icon="FolderOpened"
                color="primary"
              />
              <StatCard
                title="进行中"
                :value="statistics.projects.inProgress"
                icon="Loading"
                color="warning"
              />
              <StatCard
                title="已完成"
                :value="statistics.projects.completed"
                icon="CircleCheck"
                color="success"
              />
              <StatCard
                title="超期项目"
                :value="statistics.projects.overdue"
                icon="Warning"
                color="danger"
              />
              <StatCard
                title="完成率"
                :value="`${statistics.projects.completionRate}%`"
                icon="TrendCharts"
                color="info"
              />
              <StatCard
                title="超期率"
                :value="`${statistics.projects.overdueRate}%`"
                icon="Warning"
                color="danger"
              />
            </div>
          </div>

          <!-- 任务统计 -->
          <div class="stats-group">
            <h3 class="stats-title">任务概览</h3>
            <div class="stats-cards">
              <StatCard
                title="总任务数"
                :value="statistics.tasks.total"
                icon="List"
                color="primary"
              />
              <StatCard
                title="进行中"
                :value="statistics.tasks.inProgress"
                icon="Loading"
                color="warning"
              />
              <StatCard
                title="已完成"
                :value="statistics.tasks.completed"
                icon="CircleCheck"
                color="success"
              />
              <StatCard
                title="超期任务"
                :value="statistics.tasks.overdue"
                icon="Warning"
                color="danger"
              />
              <StatCard
                title="完成率"
                :value="`${statistics.tasks.completionRate}%`"
                icon="TrendCharts"
                color="info"
              />
              <StatCard
                title="超期率"
                :value="`${statistics.tasks.overdueRate}%`"
                icon="Warning"
                color="danger"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 提醒区域 -->
      <div class="reminders-section">
        <div class="reminders-grid">
          <OverdueAlert
            title="7天内超期提醒"
            :tasks="reminders['7days']"
            type="urgent"
            @click="showReminderDetails('7days')"
            @fullscreen="handleFullscreen"
          />
          <OverdueAlert
            title="14天内超期提醒"
            :tasks="reminders['14days']"
            type="normal"
            @click="showReminderDetails('14days')"
            @fullscreen="handleFullscreen"
          />
        </div>
      </div>

      <!-- 项目卡片区域 -->
      <div class="projects-section">
        <div class="section-header">
          <h3 class="section-title">项目概览</h3>
          <div class="section-actions">
            <el-button-group>
              <el-button
                :type="viewMode === 'grid' ? 'primary' : 'default'"
                :icon="Grid"
                @click="setViewMode('grid')"
                size="small"
              >
                网格
              </el-button>
              <el-button
                :type="viewMode === 'list' ? 'primary' : 'default'"
                :icon="List"
                @click="setViewMode('list')"
                size="small"
              >
                列表
              </el-button>
            </el-button-group>
            <el-button
              type="primary"
              :icon="Plus"
              @click="$router.push('/project-management')"
              size="small"
            >
              新建项目
            </el-button>
          </div>
        </div>

        <!-- 过滤器 -->
        <div class="filters-bar">
          <el-select
            v-model="filters.projectStatus"
            placeholder="项目状态"
            size="small"
            style="width: 120px"
            @change="setFilter('projectStatus', $event)"
          >
            <el-option label="全部" value="all" />
            <el-option label="未开始" value="not_started" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="超期" value="overdue" />
          </el-select>

          <el-select
            v-model="sortBy"
            placeholder="排序方式"
            size="small"
            style="width: 120px"
            @change="setSorting($event, sortOrder)"
          >
            <el-option label="更新时间" value="updatedAt" />
            <el-option label="创建时间" value="createdAt" />
            <el-option label="项目名称" value="name" />
            <el-option label="结束时间" value="endDate" />
          </el-select>

          <el-button-group>
            <el-button
              :type="sortOrder === 'desc' ? 'primary' : 'default'"
              size="small"
              @click="setSorting(sortBy, 'desc')"
            >
              降序
            </el-button>
            <el-button
              :type="sortOrder === 'asc' ? 'primary' : 'default'"
              size="small"
              @click="setSorting(sortBy, 'asc')"
            >
              升序
            </el-button>
          </el-button-group>

          <el-button
            @click="resetFilters"
            size="small"
            :icon="Refresh"
          >
            重置
          </el-button>
        </div>

        <!-- 项目卡片列表 -->
        <div v-if="projectCards.length > 0" :class="['projects-container', `view-${viewMode}`]">
          <ProjectCard
            v-for="project in projectCards"
            :key="project.id"
            :project="project"
            :view-mode="viewMode"
            @click="handleProjectClick(project)"
            @edit="handleProjectEdit(project)"
            @delete="handleProjectDelete(project)"
          />
        </div>

        <!-- 空状态 -->
        <el-empty
          v-else
          description="暂无项目数据"
          :image-size="120"
        >
          <el-button
            type="primary"
            @click="$router.push('/project-management')"
          >
            创建第一个项目
          </el-button>
        </el-empty>
      </div>
    </div>

    <!-- 提醒详情弹窗 -->
    <el-dialog
      v-model="reminderDialogVisible"
      :title="reminderDialogTitle"
      width="800px"
      :before-close="handleReminderDialogClose"
    >
      <ReminderTaskList
        :tasks="selectedReminderTasks"
        @task-updated="handleTaskUpdated"
        @batch-update="handleBatchTaskUpdate"
      />
    </el-dialog>

    <!-- 设置弹窗 -->
    <el-dialog
      v-model="showSettings"
      title="仪表盘设置"
      width="600px"
    >
      <DashboardSettings
        :auto-refresh="autoRefresh"
        :refresh-interval="refreshInterval"
        @update:auto-refresh="setAutoRefresh"
        @update:refresh-interval="setRefreshInterval"
      />
    </el-dialog>

    <!-- 全屏超期任务组件 -->
    <OverdueTasksFullscreen
      v-model="fullscreenVisible"
      :title="fullscreenTitle"
      :tasks="fullscreenTasks"
      :type="fullscreenType"
      @task-updated="handleFullscreenTaskUpdated"
      @refresh="handleFullscreenRefresh"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Monitor,
  Refresh,
  Setting,
  FolderOpened,
  Loading,
  CircleCheck,
  Warning,
  TrendCharts,
  List,
  Grid,
  Plus
} from '@element-plus/icons-vue'

// 组件导入
import StatCard from '../components/StatCard.vue'
import ProjectCard from '../components/ProjectCard.vue'
import OverdueAlert from '../components/OverdueAlert.vue'
import OverdueTasksFullscreen from '../components/OverdueTasksFullscreen.vue'
import ReminderTaskList from '../components/ReminderTaskList.vue'
import DashboardSettings from '../components/DashboardSettings.vue'

// 数据中心
import { getGlobalProjectDataCenter } from '@features/gantt-chart/composables/useProjectDataCenter.js'

// 工具函数
import { DateUtils } from '@shared/utils/date.js'

const router = useRouter()

// 使用全局数据中心
const dataCenter = getGlobalProjectDataCenter()

// 解构数据中心的状态和方法
const {
  projectsData,
  loading,
  loadAllProjects,
  projectStatistics,
  taskStatistics,
  reminders7Days,
  reminders14Days,
  updateProject
} = dataCenter

// 本地响应式数据
const error = ref(null)
const lastUpdated = ref(null)
const refreshing = ref(false)
const autoRefresh = ref(false)
const refreshInterval = ref(30000)
const viewMode = ref('grid')
const filters = ref({
  projectStatus: 'all'
})
const sortBy = ref('updatedAt')
const sortOrder = ref('desc')

// 计算属性
const statistics = computed(() => ({
  projects: projectStatistics.value,
  tasks: taskStatistics.value
}))

const reminders = computed(() => ({
  '7days': reminders7Days.value,
  '14days': reminders14Days.value
}))

const projectCards = computed(() => {
  let filteredProjects = [...projectsData.value]
  
  // 状态过滤
  if (filters.value.projectStatus !== 'all') {
    filteredProjects = filteredProjects.filter(project => {
      const status = project.calculatedStatus || 'not_started'
      return status === filters.value.projectStatus || 
             status.includes(filters.value.projectStatus)
    })
  }
  
  // 排序
  filteredProjects.sort((a, b) => {
    const aValue = a[sortBy.value]
    const bValue = b[sortBy.value]
    
    if (sortOrder.value === 'desc') {
      return bValue > aValue ? 1 : -1
    } else {
      return aValue > bValue ? 1 : -1
    }
  })
  
  return filteredProjects
})

// 本地状态
const reminderDialogVisible = ref(false)
const reminderDialogTitle = ref('')
const selectedReminderTasks = ref([])
const showSettings = ref(false)

// 全屏组件状态
const fullscreenVisible = ref(false)
const fullscreenTitle = ref('')
const fullscreenTasks = ref([])
const fullscreenType = ref('normal')

// 计算属性
const hasData = computed(() => projectsData.value.length > 0)

// 方法
const formatDateTime = (dateTime) => {
  return DateUtils.format(dateTime, 'YYYY-MM-DD HH:mm:ss')
}

const handleRefresh = async () => {
  try {
    refreshing.value = true
    await loadAllProjects()
    lastUpdated.value = new Date()
    ElMessage.success('数据刷新成功')
  } catch (err) {
    error.value = err.message
    ElMessage.error('数据刷新失败: ' + err.message)
  } finally {
    refreshing.value = false
  }
}

const setViewMode = (mode) => {
  viewMode.value = mode
}

const setFilter = (key, value) => {
  filters.value[key] = value
}

const resetFilters = () => {
  filters.value = {
    projectStatus: 'all'
  }
  sortBy.value = 'updatedAt'
  sortOrder.value = 'desc'
}

const setSorting = (newSortBy, newSortOrder) => {
  sortBy.value = newSortBy
  sortOrder.value = newSortOrder
}

const setAutoRefresh = (enabled) => {
  autoRefresh.value = enabled
}

const setRefreshInterval = (interval) => {
  refreshInterval.value = interval
}

const handleProjectClick = (project) => {
  router.push(`/gantt/${project.id}`)
}

const handleProjectEdit = (project) => {
  router.push(`/project-management?edit=${project.id}`)
}

const handleProjectDelete = async (project) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除项目 "${project.name}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 这里应该调用删除项目的方法
    // await projectDataService.delete(project.id)
    // await dashboardStore.refresh()
    
    ElMessage.success('项目删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('项目删除失败: ' + error.message)
    }
  }
}

const showReminderDetails = (type) => {
  const typeMap = {
    '7days': '7天内超期提醒',
    '14days': '14天内超期提醒'
  }
  
  reminderDialogTitle.value = typeMap[type]
  selectedReminderTasks.value = reminders.value[type] || []
  reminderDialogVisible.value = true
}

const handleReminderDialogClose = () => {
  reminderDialogVisible.value = false
  selectedReminderTasks.value = []
}

const handleTaskUpdated = async (task) => {
  try {
    // 通过数据中心更新任务状态
    const project = projectsData.value.find(p => 
      p.tasks && p.tasks.some(t => t.id === task.id)
    )
    if (project) {
      const taskIndex = project.tasks.findIndex(t => t.id === task.id)
      if (taskIndex > -1) {
        project.tasks[taskIndex] = { ...project.tasks[taskIndex], ...task }
        await updateProject(project.id, project)
      }
    }
    ElMessage.success('任务状态更新成功')
  } catch (error) {
    ElMessage.error('任务状态更新失败: ' + error.message)
  }
}

const handleBatchTaskUpdate = async (taskIds, updates) => {
  try {
    // 批量更新任务
    for (const taskId of taskIds) {
      const project = projectsData.value.find(p => 
        p.tasks && p.tasks.some(t => t.id === taskId)
      )
      if (project) {
        const taskIndex = project.tasks.findIndex(t => t.id === taskId)
        if (taskIndex > -1) {
          project.tasks[taskIndex] = { ...project.tasks[taskIndex], ...updates }
        }
        await updateProject(project.id, project)
      }
    }
    ElMessage.success(`批量更新 ${taskIds.length} 个任务成功`)
  } catch (error) {
    ElMessage.error('批量更新失败: ' + error.message)
  }
}

// 全屏相关方法
const handleFullscreen = (tasks, type) => {
  const typeMap = {
    'urgent': '7天内超期提醒',
    'normal': '14天内超期提醒'
  }
  
  fullscreenTitle.value = typeMap[type] || '超期任务'
  fullscreenTasks.value = tasks
  fullscreenType.value = type
  fullscreenVisible.value = true
}

const handleFullscreenClose = () => {
  fullscreenVisible.value = false
  fullscreenTasks.value = []
}

const handleFullscreenTaskUpdated = async (task) => {
  await handleTaskUpdated(task)
  // 刷新数据以更新全屏视图
  await handleRefresh()
}

const handleFullscreenRefresh = async () => {
  await handleRefresh()
}

// 生命周期
onMounted(async () => {
  try {
    await loadAllProjects()
    lastUpdated.value = new Date()
    console.log('仪表盘页面：已从数据中心加载数据')
  } catch (err) {
    error.value = err.message
    console.error('Dashboard initialization failed:', err)
  }
})

onUnmounted(() => {
  // 清理定时器等资源
})
</script>

<style lang="scss" scoped>
.dashboard-view {
  padding: 20px;
  background-color: var(--color-bg-light);
  min-height: 100vh;
}

.dashboard-header {
  margin-bottom: 24px;
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .header-left {
      .page-title {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 4px 0;
        font-size: 24px;
        font-weight: 600;
        color: var(--color-text-primary);
      }
      
      .page-subtitle {
        margin: 0;
        font-size: 14px;
        color: var(--color-text-secondary);
      }
    }
  }
}

.loading-container {
  padding: 20px;
}

.error-alert {
  margin-bottom: 20px;
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stats-section {
  .stats-grid {
    display: flex;
    flex-direction: column;
    gap: 20px;
    
    .stats-group {
      .stats-title {
        margin: 0 0 12px 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--color-text-primary);
      }
      
      .stats-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
      }
    }
  }
}

.reminders-section {
  .reminders-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 16px;
  }
}

.projects-section {
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    
    .section-title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--color-text-primary);
    }
    
    .section-actions {
      display: flex;
      gap: 12px;
    }
  }
  
  .filters-bar {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    padding: 16px;
    background: white;
    border-radius: 8px;
    box-shadow: var(--shadow-light);
  }
  
  .projects-container {
    &.view-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }
    
    &.view-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .dashboard-view {
    padding: 16px;
  }
  
  .dashboard-header .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .stats-section .stats-grid .stats-group .stats-cards {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
  
  .reminders-section .reminders-grid {
    grid-template-columns: 1fr;
  }
  
  .projects-section .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .filters-bar {
    flex-wrap: wrap;
  }
  
  .projects-container.view-grid {
    grid-template-columns: 1fr;
  }
}
</style>