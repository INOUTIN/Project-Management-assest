<template>
  <div 
    :class="['project-card', `project-card--${viewMode}`, `project-card--${currentStatus}`]"
    @click="handleClick"
  >
    <!-- 项目状态标识 -->
    <div class="project-card__status">
      <el-tag 
        v-for="(tag, index) in statusTags" 
        :key="index"
        :type="tag.type" 
        size="small"
        :style="{ marginLeft: index > 0 ? '4px' : '0' }"
      >
        {{ tag.text }}
      </el-tag>
    </div>
    
    <!-- 项目基本信息 -->
    <div class="project-card__header">
      <div class="project-card__title">
        <h4>{{ project.name }}</h4>
        <p v-if="project.description" class="project-card__description">
          {{ project.description }}
        </p>
      </div>
      
      <!-- 操作按钮 -->
      <div class="project-card__actions" @click.stop>
        <el-dropdown trigger="click" placement="bottom-end">
          <el-button :icon="MoreFilled" circle size="small" />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="$emit('edit', project)">
                <el-icon><Edit /></el-icon>
                编辑项目
              </el-dropdown-item>
              <el-dropdown-item @click="handleViewGantt">
                <el-icon><TrendCharts /></el-icon>
                查看甘特图
              </el-dropdown-item>
              <el-dropdown-item divided @click="$emit('delete', project)">
                <el-icon><Delete /></el-icon>
                删除项目
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    
    <!-- 项目统计信息 -->
    <div class="project-card__stats">
      <div class="stat-item">
        <span class="stat-label">总任务</span>
        <span class="stat-value">{{ taskStats.total }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">已完成</span>
        <span class="stat-value stat-value--success">{{ taskStats.completed }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">超期</span>
        <span class="stat-value stat-value--danger">{{ taskStats.overdue }}</span>
      </div>
    </div>
    
    <!-- 进度条 -->
    <div class="project-card__progress">
      <div class="progress-header">
        <span class="progress-label">完成率</span>
        <span class="progress-value">{{ taskStats.completionRate }}%</span>
      </div>
      <el-progress 
        :percentage="taskStats.completionRate" 
        :stroke-width="8"
        :show-text="false"
        :color="progressColor"
      />
    </div>
    
    <!-- 项目时间信息 -->
    <div class="project-card__timeline">
      <div class="timeline-item">
        <el-icon><Calendar /></el-icon>
        <span>{{ formatDateRange(project.startDate, project.endDate) }}</span>
      </div>
      <div v-if="daysRemaining !== null" class="timeline-item">
        <el-icon><Clock /></el-icon>
        <span :class="daysRemainingClass">{{ daysRemainingText }}</span>
      </div>
    </div>
    
    <!-- 团队成员（如果有） -->
    <div v-if="project.members && project.members.length > 0" class="project-card__members">
      <div class="members-label">团队成员</div>
      <div class="project-members">
        <el-avatar 
          v-for="(member, index) in displayMembers" 
          :key="member.id || index"
          :src="member.avatar"
          :alt="member.name"
          size="small"
          class="member-avatar"
        >
          {{ member.name ? member.name.charAt(0) : 'U' }}
        </el-avatar>
      </div>
      <span v-if="project.members.length > 3" class="members-more">
        +{{ project.members.length - 3 }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  MoreFilled, 
  Edit, 
  Delete, 
  TrendCharts, 
  Calendar, 
  Clock 
} from '@element-plus/icons-vue'
import { DateUtils } from '@shared/utils/date.js'
import { PROJECT_STATUS } from '@shared/utils/constants.js'

const props = defineProps({
  project: {
    type: Object,
    required: true
  },
  viewMode: {
    type: String,
    default: 'grid',
    validator: (value) => ['grid', 'list'].includes(value)
  }
})

const emit = defineEmits(['click', 'edit', 'delete'])

const router = useRouter()

// 计算属性
const taskStats = computed(() => {
  return props.project.taskStats || {
    total: 0,
    completed: 0,
    overdue: 0,
    completionRate: 0
  }
})

const displayMembers = computed(() => {
  const members = props.project.members || []
  return members.slice(0, 3) // 只显示前3个成员
})

// 统一使用 calculatedStatus
const currentStatus = computed(() => {
  return props.project.calculatedStatus || props.project.status || 'not_started'
})

const statusText = computed(() => {
  const statusMap = {
    'not_started': '未开始',
    'in_progress': '进行中', 
    'completed': '已完成',
    'overdue': '超期',
    'completed_overdue': '已完成·超期',
    'overdue_not_started': '超期·未开始',
    'overdue_in_progress': '超期·进行中'
  }
  return statusMap[currentStatus.value] || '未知'
})

const statusTagType = computed(() => {
  const typeMap = {
    'not_started': '', // 灰色
    'in_progress': 'warning', // 黄色
    'completed': 'success', // 绿色
    'overdue': 'danger', // 红色
    'completed_overdue': 'success', // 绿色 (已完成主导)
    'overdue_not_started': 'danger', // 红色
    'overdue_in_progress': 'warning' // 黄色 (进行中主导)
  }
  return typeMap[currentStatus.value] || 'info'
})

// 支持多状态显示
const statusTags = computed(() => {
  const status = currentStatus.value
  
  // 处理复合状态
  switch (status) {
    case 'completed_overdue':
      return [
        { text: '已完成', type: 'success' },
        { text: '超期', type: 'danger' }
      ]
    case 'overdue_not_started':
      return [
        { text: '超期', type: 'danger' },
        { text: '未开始', type: '' }
      ]
    case 'overdue_in_progress':
      return [
        { text: '超期', type: 'danger' },
        { text: '进行中', type: 'warning' }
      ]
    default:
      // 单一状态
      return [{ text: statusText.value, type: statusTagType.value }]
  }
})

const progressColor = computed(() => {
  const rate = taskStats.value.completionRate
  if (rate >= 80) return '#67c23a'
  if (rate >= 60) return '#e6a23c'
  if (rate >= 40) return '#f56c6c'
  return '#909399'
})

const daysRemaining = computed(() => {
  if (!props.project.endDate) return null
  
  const endDate = new Date(props.project.endDate)
  const today = new Date()
  
  return DateUtils.diffInDays(today, endDate)
})

const daysRemainingText = computed(() => {
  if (daysRemaining.value === null) return ''
  
  if (daysRemaining.value > 0) {
    return `剩余 ${daysRemaining.value} 天`
  } else if (daysRemaining.value === 0) {
    return '今天截止'
  } else {
    return `超期 ${Math.abs(daysRemaining.value)} 天`
  }
})

const daysRemainingClass = computed(() => {
  if (daysRemaining.value === null) return ''
  
  if (daysRemaining.value < 0) return 'text-danger'
  if (daysRemaining.value <= 3) return 'text-warning'
  return 'text-info'
})

// 方法
const formatDateRange = (startDate, endDate) => {
  const start = DateUtils.format(startDate, 'MM-DD')
  const end = DateUtils.format(endDate, 'MM-DD')
  return `${start} ~ ${end}`
}

const handleClick = () => {
  emit('click', props.project)
}

const handleViewGantt = () => {
  router.push(`/gantt/${props.project.id}`)
}
</script>

<style lang="scss" scoped>
.project-card {
  position: relative;
  background: white;
  border-radius: 12px;
  box-shadow: var(--shadow-light);
  transition: all 0.3s ease;
  cursor: pointer;
  overflow: hidden;
  
  &:hover {
    box-shadow: var(--shadow-medium);
    transform: translateY(-2px);
  }
  
  // 网格视图样式
  &--grid {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  // 列表视图样式
  &--list {
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 20px;
    
    .project-card__header {
      flex: 1;
      margin-bottom: 0;
    }
    
    .project-card__stats {
      flex-direction: row;
      gap: 24px;
    }
    
    .project-card__progress {
      width: 200px;
    }
    
    .project-card__timeline {
      width: 180px;
    }
  }
  
  // 状态样式 - 按照新规则的颜色
  &--not_started {
    border-left: 4px solid #909399; // 灰色
  }
  
  &--in_progress {
    border-left: 4px solid #E6A23C; // 黄色
  }
  
  &--completed {
    border-left: 4px solid #67C23A; // 绿色
  }
  
  &--overdue {
    border-left: 4px solid #F56C6C; // 红色
  }
  
  // 复合状态样式
  &--completed_overdue {
    border-left: 4px solid #67C23A; // 绿色 (已完成主导)
  }
  
  &--overdue_not_started {
    border-left: 4px solid #F56C6C; // 红色
  }
  
  &--overdue_in_progress {
    border-left: 4px solid #E6A23C; // 黄色 (进行中主导)
  }
  
  &__status {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 1;
  }
  
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
  }
  
  &__title {
    flex: 1;
    min-width: 0;
    
    h4 {
      margin: 0 0 4px 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--color-text-primary);
      line-height: 1.4;
      
      // 文本截断
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
  
  &__description {
    margin: 0;
    font-size: 13px;
    color: var(--color-text-secondary);
    line-height: 1.4;
    
    // 多行文本截断
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  &__actions {
    margin-left: 12px;
    flex-shrink: 0;
  }
  
  &__stats {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    
    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      
      .stat-label {
        font-size: 12px;
        color: var(--color-text-secondary);
      }
      
      .stat-value {
        font-size: 16px;
        font-weight: 600;
        color: var(--color-text-primary);
        
        &--success {
          color: var(--color-success);
        }
        
        &--danger {
          color: var(--color-danger);
        }
      }
    }
  }
  
  &__progress {
    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      
      .progress-label {
        font-size: 13px;
        color: var(--color-text-secondary);
      }
      
      .progress-value {
        font-size: 13px;
        font-weight: 600;
        color: var(--color-text-primary);
      }
    }
  }
  
  &__timeline {
    display: flex;
    flex-direction: column;
    gap: 8px;
    
    .timeline-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--color-text-secondary);
      
      .el-icon {
        font-size: 14px;
      }
    }
  }
  
  &__members {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .members-label {
      font-size: 12px;
      color: var(--color-text-secondary);
    }
    
    .members-more {
      font-size: 12px;
      color: var(--color-text-secondary);
      margin-left: 4px;
    }
  }
}

// 文本颜色工具类
.text-danger {
  color: var(--color-danger) !important;
}

.text-warning {
  color: var(--color-warning) !important;
}

.text-info {
  color: var(--color-info) !important;
}

// 响应式设计
@media (max-width: 768px) {
  .project-card {
    &--list {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
      
      .project-card__stats {
        flex-direction: row;
        justify-content: space-around;
      }
      
      .project-card__progress,
      .project-card__timeline {
        width: 100%;
      }
    }
    
    &__header {
      margin-bottom: 12px;
    }
    
    &__title h4 {
      font-size: 15px;
    }
    
    &__stats .stat-item {
      .stat-value {
        font-size: 14px;
      }
    }
  }
}

.project-members {
  display: flex;
  align-items: center;
  gap: -8px; /* 负间距让头像重叠 */
  
  .member-avatar {
    border: 2px solid white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    
    &:not(:first-child) {
      margin-left: -8px;
    }
  }
}
</style>