<template>
  <div 
    :class="['overdue-alert', `overdue-alert--${type}`]"
    @click="handleClick"
  >
    <div class="overdue-alert__header">
      <div class="overdue-alert__icon">
        <el-icon :size="20">
          <component :is="alertIcon" />
        </el-icon>
      </div>
      <div class="overdue-alert__title">
        <h4>{{ title }}</h4>
        <p class="overdue-alert__count">{{ tasks.length }} 个任务</p>
      </div>
      <div class="overdue-alert__badge">
        <el-badge :value="tasks.length" :type="badgeType" :hidden="tasks.length === 0" />
      </div>
    </div>
    
    <div class="overdue-alert__content">
      <div v-if="tasks.length === 0" class="overdue-alert__empty">
        <el-icon><CircleCheck /></el-icon>
        <span>暂无{{ typeText }}任务</span>
      </div>
      
      <div v-else class="overdue-alert__preview">
        <div 
          v-for="task in previewTasks" 
          :key="task.id"
          class="task-preview"
        >
          <div class="task-preview__info">
            <span class="task-name">{{ task.name }}</span>
            <span class="task-project">{{ task.projectName || '未知项目' }}</span>
          </div>
          <div class="task-preview__time">
            <span :class="getTimeClass(task)">
              {{ getTimeText(task) }}
            </span>
          </div>
        </div>
        
        <div v-if="tasks.length > maxPreview" class="overdue-alert__more">
          还有 {{ tasks.length - maxPreview }} 个任务...
        </div>
      </div>
    </div>
    
    <div class="overdue-alert__footer">
      <el-button 
        :type="buttonType" 
        size="small" 
        :disabled="tasks.length === 0"
        @click.stop="handleViewAll"
      >
        查看全部
      </el-button>
      <el-button 
        v-if="tasks.length > 0"
        size="small" 
        :icon="FullScreen"
        @click.stop="handleFullscreen"
        title="全屏查看"
      >
        全屏
      </el-button>
      <el-button 
        v-if="tasks.length > 0"
        size="small" 
        @click.stop="handleQuickAction"
      >
        {{ quickActionText }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { 
  Warning, 
  Clock, 
  CircleCheck,
  Bell,
  FullScreen
} from '@element-plus/icons-vue'
import { DateUtils } from '@shared/utils/date.js'

const props = defineProps({
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
  },
  maxPreview: {
    type: Number,
    default: 3
  }
})

const emit = defineEmits(['click', 'view-all', 'quick-action', 'fullscreen'])

// 计算属性
const typeText = computed(() => {
  return props.type === 'urgent' ? '紧急超期' : '即将超期'
})

const alertIcon = computed(() => {
  return props.type === 'urgent' ? Warning : Clock
})

const badgeType = computed(() => {
  return props.type === 'urgent' ? 'danger' : 'warning'
})

const buttonType = computed(() => {
  return props.type === 'urgent' ? 'danger' : 'warning'
})

const quickActionText = computed(() => {
  return props.type === 'urgent' ? '批量延期' : '设置提醒'
})

const previewTasks = computed(() => {
  return props.tasks.slice(0, props.maxPreview)
})

// 方法
const getTimeText = (task) => {
  const endDate = new Date(task.endDate)
  const now = new Date()
  const diffDays = DateUtils.diffInDays(now, endDate)
  
  if (diffDays < 0) {
    return `超期 ${Math.abs(diffDays)} 天`
  } else if (diffDays === 0) {
    return '今天截止'
  } else {
    return `剩余 ${diffDays} 天`
  }
}

const getTimeClass = (task) => {
  const endDate = new Date(task.endDate)
  const now = new Date()
  const diffDays = DateUtils.diffInDays(now, endDate)
  
  if (diffDays < 0) {
    return 'time-overdue'
  } else if (diffDays <= 1) {
    return 'time-urgent'
  } else {
    return 'time-normal'
  }
}

const handleClick = () => {
  emit('click', props.tasks)
}

const handleViewAll = () => {
  emit('view-all', props.tasks)
}

const handleQuickAction = () => {
  emit('quick-action', props.tasks)
}

const handleFullscreen = () => {
  emit('fullscreen', props.tasks, props.type)
}
</script>

<style lang="scss" scoped>
.overdue-alert {
  background: white;
  border-radius: 12px;
  box-shadow: var(--shadow-light);
  transition: all 0.3s ease;
  cursor: pointer;
  overflow: hidden;
  
  &:hover {
    box-shadow: var(--shadow-medium);
    transform: translateY(-1px);
  }
  
  // 紧急类型样式
  &--urgent {
    border-left: 4px solid var(--color-danger);
    
    .overdue-alert__header {
      background: linear-gradient(135deg, #fef0f0 0%, #fdf2f2 100%);
    }
    
    .overdue-alert__icon {
      background: var(--color-danger-light);
      color: var(--color-danger);
    }
  }
  
  // 普通类型样式
  &--normal {
    border-left: 4px solid var(--color-warning);
    
    .overdue-alert__header {
      background: linear-gradient(135deg, #fdf6ec 0%, #fef7ed 100%);
    }
    
    .overdue-alert__icon {
      background: var(--color-warning-light);
      color: var(--color-warning);
    }
  }
  
  &__header {
    display: flex;
    align-items: center;
    padding: 16px 20px;
    gap: 12px;
  }
  
  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    flex-shrink: 0;
  }
  
  &__title {
    flex: 1;
    min-width: 0;
    
    h4 {
      margin: 0 0 2px 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--color-text-primary);
      line-height: 1.3;
    }
    
    .overdue-alert__count {
      margin: 0;
      font-size: 13px;
      color: var(--color-text-secondary);
    }
  }
  
  &__badge {
    flex-shrink: 0;
  }
  
  &__content {
    padding: 0 20px 16px 20px;
  }
  
  &__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 20px;
    color: var(--color-text-secondary);
    font-size: 14px;
    
    .el-icon {
      color: var(--color-success);
    }
  }
  
  &__preview {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .task-preview {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: var(--color-bg-light);
    border-radius: 6px;
    transition: background-color 0.2s ease;
    
    &:hover {
      background: var(--color-bg-lighter);
    }
    
    &__info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
      
      .task-name {
        font-size: 14px;
        font-weight: 500;
        color: var(--color-text-primary);
        
        // 文本截断
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .task-project {
        font-size: 12px;
        color: var(--color-text-secondary);
        
        // 文本截断
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
    
    &__time {
      flex-shrink: 0;
      margin-left: 12px;
      
      span {
        font-size: 12px;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 4px;
        
        &.time-overdue {
          color: var(--color-danger);
          background: var(--color-danger-light);
        }
        
        &.time-urgent {
          color: var(--color-warning);
          background: var(--color-warning-light);
        }
        
        &.time-normal {
          color: var(--color-info);
          background: var(--color-info-light);
        }
      }
    }
  }
  
  &__more {
    text-align: center;
    padding: 8px;
    font-size: 13px;
    color: var(--color-text-secondary);
    font-style: italic;
  }
  
  &__footer {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    padding: 16px 20px;
    background: var(--color-bg-light);
    border-top: 1px solid var(--color-border-light);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .overdue-alert {
    &__header {
      padding: 14px 16px;
    }
    
    &__content {
      padding: 0 16px 14px 16px;
    }
    
    &__footer {
      padding: 14px 16px;
      flex-direction: column;
      
      .el-button {
        width: 100%;
      }
    }
    
    .task-preview {
      padding: 6px 10px;
      
      &__info {
        .task-name {
          font-size: 13px;
        }
        
        .task-project {
          font-size: 11px;
        }
      }
      
      &__time {
        margin-left: 8px;
        
        span {
          font-size: 11px;
        }
      }
    }
  }
}
</style>