<template>
  <div :class="['stat-card', `stat-card--${color}`]">
    <div class="stat-card__icon">
      <el-icon :size="24">
        <component :is="iconComponent" />
      </el-icon>
    </div>
    <div class="stat-card__content">
      <div class="stat-card__value">{{ displayValue }}</div>
      <div class="stat-card__title">{{ title }}</div>
    </div>
    <div v-if="trend" class="stat-card__trend">
      <el-icon :size="16" :class="trendClass">
        <component :is="trendIcon" />
      </el-icon>
      <span :class="trendClass">{{ trend }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  FolderOpened,
  Loading,
  CircleCheck,
  Warning,
  TrendCharts,
  List,
  ArrowUp,
  ArrowDown,
  Minus
} from '@element-plus/icons-vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  icon: {
    type: String,
    default: 'TrendCharts'
  },
  color: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'success', 'warning', 'danger', 'info'].includes(value)
  },
  trend: {
    type: String,
    default: null
  },
  trendType: {
    type: String,
    default: 'neutral',
    validator: (value) => ['up', 'down', 'neutral'].includes(value)
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// 图标映射
const iconMap = {
  FolderOpened,
  Loading,
  CircleCheck,
  Warning,
  TrendCharts,
  List
}

// 计算属性
const iconComponent = computed(() => {
  return iconMap[props.icon] || TrendCharts
})

const displayValue = computed(() => {
  if (props.loading) return '--'
  
  if (typeof props.value === 'number') {
    // 格式化数字
    if (props.value >= 1000000) {
      return (props.value / 1000000).toFixed(1) + 'M'
    } else if (props.value >= 1000) {
      return (props.value / 1000).toFixed(1) + 'K'
    }
    return props.value.toString()
  }
  
  return props.value
})

const trendIcon = computed(() => {
  switch (props.trendType) {
    case 'up':
      return ArrowUp
    case 'down':
      return ArrowDown
    default:
      return Minus
  }
})

const trendClass = computed(() => {
  return `trend--${props.trendType}`
})
</script>

<style lang="scss" scoped>
.stat-card {
  position: relative;
  display: flex;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: var(--shadow-light);
  transition: all 0.3s ease;
  overflow: hidden;
  
  &:hover {
    box-shadow: var(--shadow-medium);
    transform: translateY(-2px);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: var(--color-primary);
    transition: all 0.3s ease;
  }
  
  // 颜色变体
  &--primary::before {
    background: var(--color-primary);
  }
  
  &--success::before {
    background: var(--color-success);
  }
  
  &--warning::before {
    background: var(--color-warning);
  }
  
  &--danger::before {
    background: var(--color-danger);
  }
  
  &--info::before {
    background: var(--color-info);
  }
  
  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    margin-right: 16px;
    border-radius: 12px;
    background: var(--color-bg-light);
    color: var(--color-text-secondary);
    flex-shrink: 0;
  }
  
  &--primary &__icon {
    background: var(--color-primary-light);
    color: var(--color-primary);
  }
  
  &--success &__icon {
    background: var(--color-success-light);
    color: var(--color-success);
  }
  
  &--warning &__icon {
    background: var(--color-warning-light);
    color: var(--color-warning);
  }
  
  &--danger &__icon {
    background: var(--color-danger-light);
    color: var(--color-danger);
  }
  
  &--info &__icon {
    background: var(--color-info-light);
    color: var(--color-info);
  }
  
  &__content {
    flex: 1;
    min-width: 0;
  }
  
  &__value {
    font-size: 24px;
    font-weight: 700;
    color: var(--color-text-primary);
    line-height: 1.2;
    margin-bottom: 4px;
  }
  
  &__title {
    font-size: 14px;
    color: var(--color-text-secondary);
    line-height: 1.4;
  }
  
  &__trend {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: 12px;
    font-size: 12px;
    font-weight: 600;
    
    .trend--up {
      color: var(--color-success);
    }
    
    .trend--down {
      color: var(--color-danger);
    }
    
    .trend--neutral {
      color: var(--color-text-secondary);
    }
  }
}

// 加载状态
.stat-card--loading {
  .stat-card__icon {
    animation: pulse 1.5s ease-in-out infinite;
  }
  
  .stat-card__value {
    color: var(--color-text-placeholder);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .stat-card {
    padding: 16px;
    
    &__icon {
      width: 40px;
      height: 40px;
      margin-right: 12px;
    }
    
    &__value {
      font-size: 20px;
    }
    
    &__title {
      font-size: 13px;
    }
    
    &__trend {
      margin-left: 8px;
      font-size: 11px;
    }
  }
}
</style>