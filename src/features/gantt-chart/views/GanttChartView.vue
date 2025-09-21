<template>
  <div class="gantt-chart">
    <div class="gantt-chart__header">
      <div class="gantt-chart__title-section">
        <el-button 
          :icon="ArrowLeft" 
          @click="goBack"
          class="gantt-chart__back-btn"
        >
          返回
        </el-button>
        <div class="gantt-chart__title-info">
          <h1 class="gantt-chart__title">{{ project?.name || '项目甘特图' }}</h1>
          <div class="gantt-chart__subtitle">
            <span class="gantt-chart__date-range">
              {{ formatDateRange(project?.startDate, project?.endDate) }}
            </span>
          </div>
        </div>
      </div>
      
      <div class="gantt-chart__actions">
        <el-button :icon="Edit" @click="editProject">
          编辑项目
        </el-button>
        <el-button type="primary" :icon="Plus" @click="addTask">
          添加任务
        </el-button>
        <!-- Phase 1 紧急修复：数据清理功能 -->
        <el-button 
          type="warning" 
          :icon="Tools" 
          @click="cleanDuplicateTasks"
          title="清理重复任务"
        >
          清理重复
        </el-button>
      </div>
    </div>

    <!-- 项目概览 -->
    <div class="gantt-chart__overview">
      <div class="overview-cards">
        <div class="overview-card">
          <div class="overview-card__icon">
            <el-icon><List /></el-icon>
          </div>
          <div class="overview-card__content">
            <div class="overview-card__value">{{ project?.tasks?.length || 0 }}</div>
            <div class="overview-card__label">总任务数</div>
          </div>
        </div>
        
        <div class="overview-card">
          <div class="overview-card__icon">
            <el-icon><Check /></el-icon>
          </div>
          <div class="overview-card__content">
            <div class="overview-card__value">{{ completedTasksCount }}</div>
            <div class="overview-card__label">已完成</div>
          </div>
        </div>
        
        <div class="overview-card">
          <div class="overview-card__icon">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="overview-card__content">
            <div class="overview-card__value">{{ inProgressTasksCount }}</div>
            <div class="overview-card__label">进行中</div>
          </div>
        </div>
        
        <div class="overview-card">
          <div class="overview-card__icon">
            <el-icon><Warning /></el-icon>
          </div>
          <div class="overview-card__content">
            <div class="overview-card__value">{{ overdueTasksCount }}</div>
            <div class="overview-card__label">超期</div>
          </div>
        </div>
      </div>
      
      <div class="overview-progress">
        <div class="overview-progress__label">
          项目进度: {{ projectProgress }}%
        </div>
        <el-progress 
          :percentage="projectProgress" 
          :color="getProgressColor(projectProgress)"
          :stroke-width="8"
        />
      </div>
    </div>

    <!-- 任务管理区域 -->
    <div class="gantt-chart__content">
      <div class="gantt-chart__toolbar">
        <ViewSwitcher 
          :current-view="viewMode"
          :time-scale="timeScale"
          :can-zoom-in="canZoomIn"
          :can-zoom-out="canZoomOut"
          @update:view="viewMode = $event"
          @update:time-scale="timeScale = $event"
          @zoom-in="handleZoomIn"
          @zoom-out="handleZoomOut"
          @fit-to-content="handleFitToContent"
          @scroll-to-today="handleScrollToToday"
        />
        
        <div class="gantt-chart__filters">
          <el-select v-model="statusFilter" placeholder="筛选状态" size="small" clearable>
            <el-option label="全部状态" value="" />
            <el-option label="未开始" value="not_started" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="超期" value="overdue" />
          </el-select>
        </div>
      </div>

      <!-- 主要内容区域 -->
      <div class="gantt-chart__main">
        <!-- 任务表格 -->
        <div v-if="viewMode === 'table'" class="task-table-container" :class="{ 'with-detail-panel': selectedTask }">
          <el-table 
            :data="filteredTasks" 
            style="width: 100%"
            @row-click="handleRowClick"
            :row-class-name="getRowClassName"
            height="600"
          >
            <!-- 任务基本信息 -->
            <el-table-column prop="name" label="任务名称" width="180" fixed="left">
              <template #default="scope">
                <div class="task-name-cell">
                  <el-icon v-if="scope.row.isMilestone" class="milestone-icon">
                    <Flag />
                  </el-icon>
                  <span>{{ scope.row.name }}</span>
                </div>
              </template>
            </el-table-column>
            
            <el-table-column prop="assignee" label="责任人" width="100">
              <template #default="scope">
                <el-tag size="small" type="info">{{ scope.row.assignee || '未分配' }}</el-tag>
              </template>
            </el-table-column>

            <!-- 计划时间 -->
            <el-table-column label="计划开始" width="130">
              <template #header>
                <span class="planned-header">📅 计划开始</span>
              </template>
              <template #default="scope">
                <div class="time-cell planned">
                  {{ formatDate(scope.row.startDate) }}
                </div>
              </template>
            </el-table-column>

            <el-table-column label="计划结束" width="130">
              <template #header>
                <span class="planned-header">📅 计划结束</span>
              </template>
              <template #default="scope">
                <div class="time-cell planned">
                  {{ formatDate(scope.row.endDate) }}
                </div>
              </template>
            </el-table-column>

            <!-- 实际时间 (可编辑) -->
            <el-table-column label="实际开始" width="130">
              <template #header>
                <span class="actual-header">✅ 实际开始</span>
              </template>
              <template #default="scope">
                <div 
                  class="time-cell actual editable"
                  :class="{ 'has-value': scope.row.actualStartDate }"
                  @dblclick="editActualStartDate(scope.row)"
                >
                  <span v-if="scope.row.actualStartDate">
                    {{ formatDate(scope.row.actualStartDate) }}
                  </span>
                  <span v-else class="placeholder">双击设置</span>
                  <el-icon class="edit-icon"><Edit /></el-icon>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="实际结束" width="130">
              <template #header>
                <span class="actual-header">✅ 实际结束</span>
              </template>
              <template #default="scope">
                <div 
                  class="time-cell actual editable"
                  :class="{ 
                    'has-value': scope.row.actualEndDate,
                    'overdue': isOverdue(scope.row)
                  }"
                  @dblclick="editActualEndDate(scope.row)"
                >
                  <span v-if="scope.row.actualEndDate">
                    {{ formatDate(scope.row.actualEndDate) }}
                  </span>
                  <span v-else class="placeholder">双击设置</span>
                  <el-icon class="edit-icon"><Edit /></el-icon>
                </div>
              </template>
            </el-table-column>

            <!-- 进度和状态 -->
            <el-table-column label="进度" width="120">
              <template #default="scope">
                <div class="progress-cell">
                  <el-progress 
                    :percentage="scope.row.progress || 0" 
                    :stroke-width="6"
                    :color="getProgressColor(scope.row)"
                    :show-text="false"
                  />
                  <span class="progress-text">{{ scope.row.progress || 0 }}%</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag 
                  :type="getTaskStatusType(scope.row.status)" 
                  size="small"
                  :class="{ 'status-overdue': isOverdue(scope.row) }"
                >
                  {{ getTaskStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>

            <!-- 备注列 -->
            <el-table-column label="备注" width="150">
              <template #default="scope">
                <div class="notes-cell">
                  <span v-if="scope.row.notes && scope.row.notes.trim()" 
                        class="notes-content" 
                        :title="scope.row.notes">
                    {{ scope.row.notes.length > 20 ? scope.row.notes.substring(0, 20) + '...' : scope.row.notes }}
                  </span>
                  <span v-else class="notes-placeholder">暂无备注</span>
                </div>
              </template>
            </el-table-column>

            <!-- 操作列 -->
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="scope">
                <div class="action-buttons">
                  <el-button 
                    :icon="View" 
                    size="small" 
                    text 
                    @click.stop="showTaskDetail(scope.row)"
                    title="查看详情"
                  />
                  <el-button 
                    :icon="Edit" 
                    size="small" 
                    text 
                    @click.stop="editTask(scope.row)"
                    title="编辑任务"
                  />
                  <el-button 
                    :icon="Delete" 
                    size="small" 
                    text 
                    type="danger"
                    @click.stop="deleteTask(scope.row)"
                    title="删除任务"
                    class="delete-btn"
                  />
                </div>
              </template>
            </el-table-column>
          </el-table>
          
          <div v-if="filteredTasks.length === 0" class="empty-state">
            <el-empty description="暂无任务数据">
              <el-button type="primary" @click="addTask">添加第一个任务</el-button>
            </el-empty>
          </div>
        </div>

        <!-- 时间轴视图 -->
        <div v-if="viewMode === 'timeline'" class="timeline-view-container">
          <GanttTimeline 
            :tasks="filteredTasks"
            :project="project"
            :time-scale="timeScale"
            :is-task-overdue="isOverdue"
            @edit-task="editTask"
          />
        </div>

        <!-- 任务详情面板 -->
        <div v-if="selectedTask" class="task-detail-panel">
          <div class="detail-panel-header">
            <h3>任务详情</h3>
            <el-button :icon="Close" size="small" text @click="closeDetailPanel" />
          </div>
          
          <div class="detail-panel-content">
            <!-- 基本信息区域 -->
            <div class="detail-section">
              <h4>基本信息</h4>
              <div class="detail-form">
                <el-form :model="selectedTask" label-width="80px" size="small">
                  <el-form-item label="任务名称">
                    <el-input v-model="selectedTask.name" @blur="updateTask" />
                  </el-form-item>
                  <el-form-item label="描述">
                    <el-input 
                      v-model="selectedTask.description" 
                      type="textarea" 
                      :rows="2"
                      @blur="updateTask"
                    />
                  </el-form-item>
                  <el-form-item label="责任人">
                    <el-input v-model="selectedTask.assignee" @blur="updateTask" />
                  </el-form-item>
                </el-form>
              </div>
            </div>

            <!-- 快捷操作区域 -->
            <div class="detail-section">
              <h4>快捷操作</h4>
              <div class="quick-actions">
                <el-button 
                  size="small" 
                  @click="setActualStartToday"
                  :disabled="!!selectedTask.actualStartDate"
                >
                  今天开始
                </el-button>
                <el-button 
                  size="small" 
                  @click="setActualEndToday"
                  :disabled="!!selectedTask.actualEndDate"
                >
                  今天完成
                </el-button>
                <el-button 
                  size="small" 
                  type="warning"
                  @click="resetActualTimes"
                >
                  重置实际时间
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑项目对话框 -->
    <el-dialog
      v-model="showEditDialog"
      title="编辑项目"
      width="900px"
      :before-close="handleCloseEditDialog"
    >
      <div class="project-edit-dialog">
        <!-- 项目基本信息 -->
        <div class="edit-section">
          <h3 class="section-title">
            <el-icon><Edit /></el-icon>
            项目基本信息
          </h3>
          <el-form :model="editingProject" label-width="100px" size="default">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="项目名称">
                  <el-input v-model="editingProject.name" placeholder="请输入项目名称" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="项目状态">
                  <el-tag :type="getStatusType(project?.status)" size="default">
                    {{ getStatusText(project?.status) }}
                  </el-tag>
                  <span class="status-note">（状态由任务自动计算）</span>
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="项目描述">
              <el-input 
                v-model="editingProject.description" 
                type="textarea" 
                :rows="3"
                placeholder="请输入项目描述"
              />
            </el-form-item>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="计划开始">
                  <el-date-picker
                    v-model="editingProject.startDate"
                    type="date"
                    placeholder="选择开始日期"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="计划结束">
                  <el-date-picker
                    v-model="editingProject.endDate"
                    type="date"
                    placeholder="选择结束日期"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>

        <!-- 任务执行情况 -->
        <div class="edit-section">
          <h3 class="section-title">
            <el-icon><Clock /></el-icon>
            任务执行情况
          </h3>
          
          <div v-if="editingProject.tasks && editingProject.tasks.length > 0" class="tasks-edit-area">
            <div 
              v-for="(task, index) in editingProject.tasks" 
              :key="task.id || index"
              class="task-edit-item"
            >
              <div class="task-header">
                <div class="task-info">
                  <span class="task-name">{{ task.name }}</span>
                  <el-tag :type="getTaskStatusType(task.status)" size="small">
                    {{ getTaskStatusText(task.status) }}
                  </el-tag>
                  <span v-if="task.isMilestone" class="milestone-badge">
                    <el-icon><Flag /></el-icon>
                    里程碑
                  </span>
                </div>
                <div class="task-assignee">
                  <span v-if="task.assignee">负责人: {{ task.assignee }}</span>
                </div>
              </div>
              
              <div class="task-times">
                <el-row :gutter="16">
                  <el-col :span="6">
                    <div class="time-item">
                      <label>计划开始:</label>
                      <div class="time-value planned">
                        {{ DateUtils.format(task.startDate, 'YYYY-MM-DD') }}
                      </div>
                    </div>
                  </el-col>
                  <el-col :span="6">
                    <div class="time-item">
                      <label>计划结束:</label>
                      <div class="time-value planned">
                        {{ DateUtils.format(task.endDate, 'YYYY-MM-DD') }}
                      </div>
                    </div>
                  </el-col>
                  <el-col :span="6">
                    <div class="time-item">
                      <label>实际开始:</label>
                      <el-date-picker
                        v-model="task.actualStartDate"
                        type="datetime"
                        placeholder="选择实际开始时间"
                        size="small"
                        style="width: 100%"
                        @change="handleActualTimeChange(task, 'start')"
                      />
                      <div class="quick-actions">
                        <el-button 
                          size="small" 
                          text 
                          type="primary"
                          @click="setActualStartTodayInDialog(task)"
                        >
                          今天开始
                        </el-button>
                      </div>
                    </div>
                  </el-col>
                  <el-col :span="6">
                    <div class="time-item">
                      <label>实际结束:</label>
                      <el-date-picker
                        v-model="task.actualEndDate"
                        type="datetime"
                        placeholder="选择实际结束时间"
                        size="small"
                        style="width: 100%"
                        :disabled="!task.actualStartDate"
                        :disabled-date="(date) => date > maxActualEndDate"
                        :max="maxActualEndDate"
                        @change="handleActualTimeChange(task, 'end')"
                      />
                      <div class="quick-actions">
                        <el-button 
                          size="small" 
                          text 
                          type="success"
                          :disabled="!task.actualStartDate"
                          @click="setActualEndTodayInDialog(task)"
                        >
                          今天完成
                        </el-button>
                      </div>
                    </div>
                  </el-col>
                </el-row>
              </div>
              
              <div class="task-notes">
                <el-form-item label="备注:">
                  <el-input
                    v-model="task.notes"
                    type="textarea"
                    :rows="2"
                    placeholder="记录任务执行情况、遇到的问题、解决方案等..."
                    @blur="handleNotesChange(task)"
                  />
                  <div class="notes-templates">
                    <span class="template-label">常用备注:</span>
                    <el-button 
                      size="small" 
                      text 
                      @click="setNoteTemplate(task, '按时完成，无问题')"
                    >
                      按时完成
                    </el-button>
                    <el-button 
                      size="small" 
                      text 
                      @click="setNoteTemplate(task, '提前完成')"
                    >
                      提前完成
                    </el-button>
                    <el-button 
                      size="small" 
                      text 
                      @click="setNoteTemplate(task, '遇到技术难题，需要支持')"
                    >
                      遇到问题
                    </el-button>
                    <el-button 
                      size="small" 
                      text 
                      @click="setNoteTemplate(task, '等待其他任务完成')"
                    >
                      等待依赖
                    </el-button>
                  </div>
                </el-form-item>
              </div>
            </div>
          </div>
          
          <div v-else class="no-tasks">
            <el-empty description="暂无任务" size="small">
              <el-button type="primary" @click="addTask">添加第一个任务</el-button>
            </el-empty>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelEditProject">取消</el-button>
          <el-button type="primary" @click="saveProject" :loading="saving">
            保存项目
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 添加/编辑任务对话框 -->
    <el-dialog
      v-model="showTaskDialog"
      :title="editingTask ? '编辑任务' : '添加任务'"
      width="700px"
      :before-close="handleCloseTaskDialog"
    >
      <div class="task-edit-dialog">
        <el-form :model="editingTaskForm" label-width="100px" size="default">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="任务名称" required>
                <el-input v-model="editingTaskForm.name" placeholder="请输入任务名称" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="责任人">
                <el-input v-model="editingTaskForm.assignee" placeholder="请输入责任人" />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item label="任务描述">
            <el-input 
              v-model="editingTaskForm.description" 
              type="textarea" 
              :rows="3"
              placeholder="请输入任务描述"
            />
          </el-form-item>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="计划开始">
                <el-date-picker
                  v-model="editingTaskForm.startDate"
                  type="date"
                  placeholder="选择开始日期"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="计划结束">
                <el-date-picker
                  v-model="editingTaskForm.endDate"
                  type="date"
                  placeholder="选择结束日期"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="实际开始">
                <el-date-picker
                  v-model="editingTaskForm.actualStartDate"
                  type="datetime"
                  placeholder="选择实际开始时间"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="实际结束">
                <el-date-picker
                  v-model="editingTaskForm.actualEndDate"
                  type="datetime"
                  placeholder="选择实际结束时间"
                  style="width: 100%"
                  :disabled-date="(date) => date > maxActualEndDate"
                  :max="maxActualEndDate"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="里程碑">
            <el-switch v-model="editingTaskForm.isMilestone" />
          </el-form-item>

          <el-form-item label="备注">
            <el-input 
              v-model="editingTaskForm.notes" 
              type="textarea" 
              :rows="3"
              placeholder="请输入任务备注"
            />
            <div class="notes-templates" style="margin-top: 8px;">
              <span class="template-label">常用备注:</span>
              <el-button size="small" text @click="setTaskNoteTemplate('进展顺利')">进展顺利</el-button>
              <el-button size="small" text @click="setTaskNoteTemplate('遇到困难')">遇到困难</el-button>
              <el-button size="small" text @click="setTaskNoteTemplate('需要支持')">需要支持</el-button>
              <el-button size="small" text @click="setTaskNoteTemplate('已完成')">已完成</el-button>
            </div>
          </el-form-item>

          <!-- 快捷操作 -->
          <el-form-item label="快捷操作">
            <div class="quick-actions">
              <el-button 
                size="small" 
                @click="setTaskActualStartToday"
                :disabled="!!editingTaskForm.actualStartDate"
              >
                今天开始
              </el-button>
              <el-button 
                size="small" 
                @click="setTaskActualEndToday"
                :disabled="!!editingTaskForm.actualEndDate"
              >
                今天完成
              </el-button>
              <el-button 
                size="small" 
                type="warning"
                @click="resetTaskActualTimes"
              >
                重置实际时间
              </el-button>
            </div>
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCloseTaskDialog">取消</el-button>
          <el-button type="primary" @click="saveTask">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  ArrowLeft, Edit, Plus, List, Check, Clock, Warning, 
  Delete, View, Close, Flag, ArrowRight, Tools
} from '@element-plus/icons-vue'

// 数据服务
import { getGlobalProjectDataCenter } from '../composables/useProjectDataCenter.js'
import { TaskDataService } from '@shared/services/data/TaskDataService.js'
import { DateUtils } from '@shared/utils/date.js'
import GanttTimeline from '../components/GanttTimeline.vue'
import ViewSwitcher from '../components/ViewSwitcher.vue'

const route = useRoute()
const router = useRouter()

// 使用全局数据中心
const dataCenter = getGlobalProjectDataCenter()

// 创建TaskDataService实例
const taskDataService = new TaskDataService()

// 解构数据中心的状态和方法
const {
  projectsData,
  loading,
  loadAllProjects,
  updateProject,
  deleteProject,
  calculateProjectStatus,
  calculateTaskStats,
  isTaskOverdue,
  isProjectOverdue,
  updateProjectWithCalculatedStatus
} = dataCenter

// 响应式数据
const project = ref(null)
const projectId = computed(() => route.params.id)
const viewMode = ref('table')
const timeScale = ref('daily')
const statusFilter = ref('')

// 时间轴相关状态
const canZoomIn = ref(true)
const canZoomOut = ref(true)
const showEditDialog = ref(false)
const showTaskDialog = ref(false)
const editingTask = ref(null)

// 日期限制 - 实际完成时间不能晚于当天
const maxActualEndDate = computed(() => {
  const today = new Date()
  today.setHours(23, 59, 59, 999) // 设置为当天最后一刻
  return today
})
const selectedTask = ref(null)
const editingProject = ref({})
const editingTaskForm = ref({})
const saving = ref(false)

// 计算属性
const completedTasksCount = computed(() => {
  return project.value?.tasks?.filter(task => task.status === 'completed').length || 0
})

const inProgressTasksCount = computed(() => {
  return project.value?.tasks?.filter(task => task.status === 'in_progress').length || 0
})

const overdueTasksCount = computed(() => {
  return project.value?.tasks?.filter(task => isTaskOverdue(task)).length || 0
})

const projectProgress = computed(() => {
  const tasks = project.value?.tasks || []
  if (tasks.length === 0) return 0
  
  const completedTasks = tasks.filter(task => task.status === 'completed').length
  return Math.round((completedTasks / tasks.length) * 100)
})

const filteredTasks = computed(() => {
  let tasks = project.value?.tasks || []
  
  if (statusFilter.value) {
    tasks = tasks.filter(task => task.status === statusFilter.value)
  }
  
  // 按开始时间排序
  return tasks.sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
})

// 时间轴视图控制方法
const handleZoomIn = () => {
  // 缩放功能可以后续扩展
  console.log('Zoom in')
}

const handleZoomOut = () => {
  // 缩放功能可以后续扩展
  console.log('Zoom out')
}

const handleFitToContent = () => {
  // 适应内容功能可以后续扩展
  console.log('Fit to content')
}

const handleScrollToToday = () => {
  // 滚动到今天功能可以后续扩展
  console.log('Scroll to today')
}

// 任务去重函数 - Phase 1 紧急修复
const deduplicateTasks = (tasks) => {
  if (!tasks || tasks.length === 0) return []
  
  const uniqueTasks = []
  const seenTasks = new Set()
  
  for (const task of tasks) {
    // 使用任务名称、开始时间、结束时间作为唯一标识
    const taskKey = `${task.name}_${task.startDate}_${task.endDate}_${task.assignee || ''}`
    
    if (!seenTasks.has(taskKey)) {
      seenTasks.add(taskKey)
      uniqueTasks.push(task)
    } else {
      console.warn('发现重复任务，已去除:', task.name, 'ID:', task.id)
    }
  }
  
  if (uniqueTasks.length < tasks.length) {
    console.log(`任务去重完成: ${tasks.length} → ${uniqueTasks.length}`)
  }
  
  return uniqueTasks
}

// 方法
const loadProject = async () => {
  if (!projectId.value) return
  
  try {
    // 确保数据中心已加载所有项目
    await loadAllProjects()
    
    // 从数据中心获取项目
    const loadedProject = projectsData.value.find(p => p.id === projectId.value)
    if (!loadedProject) {
      ElMessage.error('项目不存在')
      router.push('/project-management')
      return
    }
    
    // 修复：添加任务去重逻辑，防止重复任务显示
    const deduplicatedProject = {
      ...loadedProject,
      tasks: deduplicateTasks(loadedProject.tasks || [])
    }
    
    project.value = deduplicatedProject
    console.log('甘特图页面：已从数据中心加载项目', project.value.name, '任务数量:', project.value.tasks.length)
    
  } catch (error) {
    console.error('Failed to load project:', error)
    ElMessage.error('加载项目失败')
  }
}

const goBack = () => {
  router.go(-1)
}

// Phase 1 紧急修复：手动清理重复任务功能
const cleanDuplicateTasks = async () => {
  try {
    await ElMessageBox.confirm(
      '此操作将清理当前项目中的重复任务，是否继续？',
      '清理重复任务',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    if (!project.value || !project.value.tasks) {
      ElMessage.info('当前项目没有任务需要清理')
      return
    }
    
    const originalCount = project.value.tasks.length
    const cleanedTasks = deduplicateTasks(project.value.tasks)
    
    if (cleanedTasks.length < originalCount) {
      // 更新项目数据
      project.value.tasks = cleanedTasks
      
      // 保存到数据中心
      await updateProject(projectId.value, project.value)
      
      ElMessage.success(`清理完成！已移除 ${originalCount - cleanedTasks.length} 个重复任务`)
    } else {
      ElMessage.info('未发现重复任务')
    }
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('清理重复任务失败:', error)
      ElMessage.error('清理失败，请稍后重试')
    }
  }
}

const editProject = () => {
  // 深拷贝项目数据用于编辑
  editingProject.value = JSON.parse(JSON.stringify(project.value))
  
  // 确保任务有notes字段
  if (editingProject.value.tasks) {
    editingProject.value.tasks.forEach(task => {
      if (!task.notes) {
        task.notes = ''
      }
    })
  }
  
  showEditDialog.value = true
}

const addTask = () => {
  editingTask.value = null
  // 初始化新任务表单数据
  editingTaskForm.value = {
    id: '',
    name: '',
    description: '',
    assignee: '',
    startDate: null,
    endDate: null,
    actualStartDate: null,
    actualEndDate: null,
    isMilestone: false,
    notes: '',
    status: 'not_started',
    progress: 0
  }
  showTaskDialog.value = true
}

const editTask = (task) => {
  editingTask.value = { ...task }
  // 初始化编辑表单数据
  editingTaskForm.value = {
    id: task.id,
    name: task.name || '',
    description: task.description || '',
    assignee: task.assignee || '',
    startDate: task.startDate ? new Date(task.startDate) : null,
    endDate: task.endDate ? new Date(task.endDate) : null,
    actualStartDate: task.actualStartDate ? new Date(task.actualStartDate) : null,
    actualEndDate: task.actualEndDate ? new Date(task.actualEndDate) : null,
    isMilestone: task.isMilestone || false,
    notes: task.notes || '',
    status: task.status || 'not_started',
    progress: task.progress || 0
  }
  showTaskDialog.value = true
}

const deleteTask = async (task) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除任务"${task.name}"吗？此操作不可撤销。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    // 1. 从TaskDataService中删除任务
    await taskDataService.delete(task.id)
    
    // 2. 从项目的tasks数组中移除任务
    const taskIndex = project.value.tasks.findIndex(t => t.id === task.id)
    if (taskIndex > -1) {
      project.value.tasks.splice(taskIndex, 1)
    }
    
    // 3. 使用数据中心更新项目（确保数据同步）
    await updateProject(projectId.value, project.value)
    
    // 4. 刷新任务列表以确保UI同步
    await loadTasks()
    
    ElMessage.success('任务删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to delete task:', error)
      ElMessage.error('删除任务失败: ' + (error.message || '未知错误'))
    }
  }
}

// 单任务编辑相关方法
const handleCloseTaskDialog = () => {
  editingTaskForm.value = {}
  showTaskDialog.value = false
}

const saveTask = async () => {
  try {
    // 验证必填字段
    if (!editingTaskForm.value.name || !editingTaskForm.value.name.trim()) {
      ElMessage.error('请输入任务名称')
      return
    }

    // 验证实际完成时间不能晚于当天
    if (editingTaskForm.value.actualEndDate) {
      const actualEndDate = new Date(editingTaskForm.value.actualEndDate)
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      
      if (actualEndDate > today) {
        ElMessage.error('实际完成时间不能晚于当天时间')
        return
      }
    }

    // 更新任务状态基于实际时间
    updateTaskStatusBasedOnActualTimes()

    if (editingTask.value) {
      // 编辑现有任务
      const taskIndex = project.value.tasks.findIndex(t => t.id === editingTask.value.id)
      if (taskIndex > -1) {
        // 更新任务数据
        project.value.tasks[taskIndex] = {
          ...project.value.tasks[taskIndex],
          ...editingTaskForm.value,
          updatedAt: new Date().toISOString()
        }
      }
    } else {
      // 添加新任务
      const newTask = {
        id: Date.now().toString(),
        ...editingTaskForm.value,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      if (!project.value.tasks) {
        project.value.tasks = []
      }
      project.value.tasks.push(newTask)
    }

    // 使用数据中心更新项目
    await updateProject(projectId.value, project.value)
    
    ElMessage.success(editingTask.value ? '任务更新成功' : '任务添加成功')
    handleCloseTaskDialog()
    
  } catch (error) {
    console.error('Failed to save task:', error)
    ElMessage.error('保存任务失败')
  }
}

const updateTaskStatusBasedOnActualTimes = () => {
  const form = editingTaskForm.value
  const now = new Date()
  
  if (form.actualEndDate) {
    form.status = 'completed'
    form.progress = 100
  } else if (form.actualStartDate) {
    form.status = 'in_progress'
    if (!form.progress || form.progress === 0) {
      form.progress = 50 // 默认进度
    }
  } else {
    form.status = 'not_started'
    form.progress = 0
  }
  
  // 检查是否超期
  if (form.endDate && new Date(form.endDate) < now && form.status !== 'completed') {
    if (form.status === 'not_started') {
      form.status = 'overdue'
    } else if (form.status === 'in_progress') {
      form.status = 'overdue'
    }
  }
}

const setTaskNoteTemplate = (template) => {
  if (editingTaskForm.value.notes && editingTaskForm.value.notes.trim()) {
    ElMessageBox.confirm(
      '当前任务已有备注，是否要替换为模板内容？',
      '确认替换',
      {
        confirmButtonText: '替换',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      editingTaskForm.value.notes = template
    }).catch(() => {
      // 用户取消，不做任何操作
    })
  } else {
    editingTaskForm.value.notes = template
  }
}

const setTaskActualStartToday = () => {
  editingTaskForm.value.actualStartDate = new Date()
  updateTaskStatusBasedOnActualTimes()
}

const setTaskActualEndToday = () => {
  editingTaskForm.value.actualEndDate = new Date()
  updateTaskStatusBasedOnActualTimes()
}

const resetTaskActualTimes = () => {
  editingTaskForm.value.actualStartDate = null
  editingTaskForm.value.actualEndDate = null
  updateTaskStatusBasedOnActualTimes()
}

// 工具方法
const getStatusType = (status) => {
  const statusMap = {
    'not_started': '',
    'in_progress': 'warning',
    'completed': 'success',
    'overdue': 'danger',
    // 复合状态类型（主要状态决定颜色）
    'overdue_not_started': 'danger',
    'overdue_in_progress': 'warning',
    'completed_overdue': 'success'
  }
  return statusMap[status] || ''
}

const getStatusText = (status) => {
  const statusMap = {
    'not_started': '未开始',
    'in_progress': '进行中',
    'completed': '已完成',
    'overdue': '超期',
    // 复合状态文本
    'overdue_not_started': '超期+未开始',
    'overdue_in_progress': '超期+进行中',
    'completed_overdue': '已完成+超期'
  }
  return statusMap[status] || '未知'
}

const getTaskStatusType = (status) => {
  return getStatusType(status)
}

const getTaskStatusText = (status) => {
  return getStatusText(status)
}

const formatDate = (date) => {
  if (!date) return ''
  return DateUtils.format(date, 'YYYY-MM-DD')
}

const formatDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return ''
  return `${DateUtils.format(startDate, 'YYYY-MM-DD')} ~ ${DateUtils.format(endDate, 'YYYY-MM-DD')}`
}

const getProgressColor = (task) => {
  const percentage = task.progress || 0
  if (isOverdue(task)) return '#f56c6c'
  if (percentage < 30) return '#909399'
  if (percentage < 70) return '#e6a23c'
  return '#67c23a'
}

// ===== 使用数据中心的统一逻辑 =====

// 兼容性函数（保持原有接口）
const isOverdue = (task) => {
  return isTaskOverdue(task)
}

const handleRowClick = (row) => {
  selectedTask.value = row
}

const showTaskDetail = (task) => {
  selectedTask.value = task
}

const closeDetailPanel = () => {
  selectedTask.value = null
}

const getRowClassName = ({ row }) => {
  let className = ''
  if (selectedTask.value && selectedTask.value.id === row.id) {
    className += 'selected-row '
  }
  if (isOverdue(row)) {
    className += 'overdue-row '
  }
  if (row.isMilestone) {
    className += 'milestone-row '
  }
  return className.trim()
}

// 统一的编辑方法 - 双击时打开完整编辑对话框
const editActualStartDate = (task) => {
  // 直接打开任务编辑对话框
  editTask(task)
}

const editActualEndDate = (task) => {
  // 直接打开任务编辑对话框
  editTask(task)
}

// 任务更新方法
const updateTask = async () => {
  if (selectedTask.value) {
    await updateTaskInProject(selectedTask.value)
  }
}

const updateTaskInProject = async (task) => {
  try {
    const taskIndex = project.value.tasks.findIndex(t => t.id === task.id)
    if (taskIndex > -1) {
      project.value.tasks[taskIndex] = { ...task }
      
      // 使用数据中心更新项目
      await updateProject(projectId.value, project.value)
    }
  } catch (error) {
    console.error('Failed to update task:', error)
    ElMessage.error('更新任务失败')
  }
}

// 快捷操作方法
const setActualStartToday = async () => {
  if (selectedTask.value) {
    selectedTask.value.actualStartDate = DateUtils.format(new Date(), 'YYYY-MM-DD')
    if (selectedTask.value.status === 'not_started') {
      selectedTask.value.status = 'in_progress'
    }
    await updateTaskInProject(selectedTask.value)
    ElMessage.success('已设置今天为实际开始时间')
  }
}

const setActualEndToday = async () => {
  if (selectedTask.value) {
    selectedTask.value.actualEndDate = DateUtils.format(new Date(), 'YYYY-MM-DD')
    selectedTask.value.status = 'completed'
    selectedTask.value.progress = 100
    await updateTaskInProject(selectedTask.value)
    ElMessage.success('已设置今天为实际结束时间')
  }
}

const resetActualTimes = async () => {
  if (selectedTask.value) {
    try {
      await ElMessageBox.confirm(
        '确定要重置实际时间吗？',
        '确认重置',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
      )
      
      selectedTask.value.actualStartDate = null
      selectedTask.value.actualEndDate = null
      selectedTask.value.status = 'not_started'
      selectedTask.value.progress = 0
      
      await updateTaskInProject(selectedTask.value)
      ElMessage.success('实际时间已重置')
    } catch (error) {
      // 用户取消操作
    }
  }
}

// 项目编辑相关方法
const handleCloseEditDialog = () => {
  showEditDialog.value = false
}

const cancelEditProject = () => {
  showEditDialog.value = false
}

const saveProject = async () => {
  try {
    saving.value = true
    
    // 使用数据中心更新项目
    await updateProject(projectId.value, editingProject.value)
    project.value = editingProject.value
    
    showEditDialog.value = false
    ElMessage.success('项目保存成功')
  } catch (error) {
    console.error('Failed to save project:', error)
    ElMessage.error('保存项目失败')
  } finally {
    saving.value = false
  }
}

// 项目编辑对话框中的方法
const handleActualTimeChange = (task, type) => {
  if (type === 'start' && task.actualStartDate) {
    if (task.status === 'not_started') {
      task.status = 'in_progress'
    }
  } else if (type === 'end' && task.actualEndDate) {
    task.status = 'completed'
    task.progress = 100
  }
}

const setActualStartTodayInDialog = (task) => {
  task.actualStartDate = new Date()
  handleActualTimeChange(task, 'start')
}

const setActualEndTodayInDialog = (task) => {
  task.actualEndDate = new Date()
  handleActualTimeChange(task, 'end')
}

// 备注处理方法
const handleNotesChange = (task) => {
  // 备注变更时的处理逻辑（如果需要的话）
  console.log(`Task ${task.name} notes updated:`, task.notes)
}

const setNoteTemplate = (task, template) => {
  if (task.notes && task.notes.trim()) {
    // 如果已有备注，询问是否替换
    ElMessageBox.confirm(
      '当前任务已有备注，是否要替换为模板内容？',
      '确认替换',
      {
        confirmButtonText: '替换',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      task.notes = template
    }).catch(() => {
      // 用户取消，不做任何操作
    })
  } else {
    task.notes = template
  }
}

// 生命周期
onMounted(() => {
  loadProject()
})

// 监听路由变化
watch(() => route.params.id, () => {
  if (route.params.id) {
    loadProject()
  }
})
</script>

<style lang="scss" scoped>
.gantt-chart {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: 100vh;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    background: white;
    padding: 20px 24px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &__title-section {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  &__back-btn {
    border: none;
    background: #f0f2f5;
    color: #606266;
    
    &:hover {
      background: #e4e7ed;
      color: #409eff;
    }
  }

  &__title-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__title {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: #303133;
  }

  &__subtitle {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    color: #909399;
  }

  &__date-range {
    color: #909399;
  }

  &__actions {
    display: flex;
    gap: 12px;
  }

  &__overview {
    background: white;
    padding: 24px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 24px;
  }

  &__content {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  &__toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    border-bottom: 1px solid #ebeef5;
    background: #fafafa;
  }

  &__main {
    display: flex;
    height: 600px;
  }
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.overview-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  &:nth-child(2) {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }

  &:nth-child(3) {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  }

  &:nth-child(4) {
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  }

  &__icon {
    font-size: 32px;
    margin-right: 16px;
    opacity: 0.8;
  }

  &__content {
    flex: 1;
  }

  &__value {
    font-size: 28px;
    font-weight: bold;
    margin-bottom: 4px;
  }

  &__label {
    font-size: 14px;
    opacity: 0.9;
  }
}

.overview-progress {
  &__label {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 12px;
    color: #303133;
  }
}

.task-table-container {
  flex: 1;
  overflow: hidden;

  &.with-detail-panel {
    border-right: 1px solid #ebeef5;
  }
}

.task-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;

  .milestone-icon {
    color: #f56c6c;
  }
}

.time-cell {
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 13px;
  position: relative;

  &.planned {
    background-color: #f0f9ff;
    color: #1e40af;
    border: 1px solid #e0f2fe;
  }

  &.actual {
    background-color: #f0fdf4;
    color: #166534;
    border: 1px solid #dcfce7;

    &.editable {
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background-color: #ecfdf5;
        border-color: #bbf7d0;

        .edit-icon {
          opacity: 1;
        }
      }
    }

    &.has-value {
      background-color: #dcfce7;
      border-color: #bbf7d0;
    }

    &.overdue {
      background-color: #fef2f2;
      color: #dc2626;
      border-color: #fecaca;
    }
  }

  .placeholder {
    color: #9ca3af;
    font-style: italic;
  }

  .edit-icon {
    position: absolute;
    top: 2px;
    right: 2px;
    font-size: 12px;
    opacity: 0;
    transition: opacity 0.2s;
  }
}

.progress-cell {
  display: flex;
  align-items: center;
  gap: 8px;

  .progress-text {
    font-size: 12px;
    color: #606266;
    min-width: 35px;
  }
}

.action-buttons {
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: flex-start;
}

.delete-btn {
  color: #f56c6c !important;
}

.delete-btn:hover {
  background-color: #fef0f0 !important;
  color: #f56c6c !important;
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
}

.task-detail-panel {
  width: 350px;
  border-left: 1px solid #ebeef5;
  background: #fafafa;
  display: flex;
  flex-direction: column;
}

.detail-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
  background: white;

  h3 {
    margin: 0;
    font-size: 16px;
    color: #303133;
  }
}

.detail-panel-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 24px;

  h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    color: #606266;
    font-weight: 500;
  }
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .el-button {
    justify-content: flex-start;
  }
}

// 项目编辑对话框样式
.project-edit-dialog {
  .edit-section {
    margin-bottom: 32px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    padding-bottom: 8px;
    border-bottom: 2px solid #f0f2f5;

    .el-icon {
      color: #409eff;
    }
  }

  .status-note {
    font-size: 12px;
    color: #909399;
    margin-left: 8px;
  }

  .tasks-edit-area {
    max-height: 400px;
    overflow-y: auto;
  }

  .task-edit-item {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .task-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .task-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .task-name {
    font-weight: 500;
    color: #303133;
  }

  .milestone-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #f56c6c;
  }

  .task-assignee {
    font-size: 12px;
    color: #909399;
  }

  .task-times {
    margin-bottom: 16px;
  }

  .time-item {
    label {
      display: block;
      font-size: 12px;
      color: #606266;
      margin-bottom: 4px;
    }

    .time-value {
      padding: 6px 8px;
      background: #e3f2fd;
      border-radius: 4px;
      font-size: 12px;
      color: #1565c0;
      margin-bottom: 8px;

      &.planned {
        background: #e8f5e8;
        color: #2e7d32;
      }
    }

    .quick-actions {
      display: flex;
      justify-content: center;
    }
  }

  .task-notes {
    .notes-templates {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      margin-top: 8px;

      .template-label {
        font-size: 12px;
        color: #909399;
      }

      .el-button {
        font-size: 12px;
        padding: 4px 8px;
        height: auto;
      }
    }
  }

  .no-tasks {
    text-align: center;
    padding: 40px 20px;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .project-edit-dialog {
    .task-times {
      .el-row {
        .el-col {
          margin-bottom: 16px;
        }
      }
    }
    
    .notes-templates {
      flex-direction: column;
      align-items: flex-start;
      
      .el-button {
        width: 100%;
        justify-content: flex-start;
      }
    }
  }
}

// 备注列样式
.notes-cell {
  .notes-content {
    color: #606266;
    font-size: 13px;
    line-height: 1.4;
    cursor: help;
    
    &:hover {
      color: #409eff;
    }
  }
  
  .notes-placeholder {
    color: #c0c4cc;
    font-size: 12px;
    font-style: italic;
  }
}

// 单任务编辑对话框样式
.task-edit-dialog {
  .el-form {
    .el-form-item {
      margin-bottom: 18px;
    }
  }
  
  .notes-templates {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    
    .template-label {
      font-size: 12px;
      color: #909399;
      margin-right: 4px;
    }
    
    .el-button {
      font-size: 12px;
      padding: 4px 8px;
      height: auto;
      
      &:hover {
        background-color: #ecf5ff;
        color: #409eff;
      }
    }
  }
  
  .quick-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    
    .el-button {
      flex: 1;
      min-width: 100px;
    }
  }
}

// 表格行样式增强
.el-table {
  .notes-cell {
    padding: 8px 12px;
  }
}
</style>