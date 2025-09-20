<template>
  <div class="view-switcher">
    <el-radio-group 
      :model-value="currentView" 
      @update:model-value="$emit('update:view', $event)"
      size="small"
    >
      <el-radio-button label="table">
        <el-icon><List /></el-icon>
        <span class="view-label">表格视图</span>
      </el-radio-button>
      <el-radio-button label="timeline">
        <el-icon><Calendar /></el-icon>
        <span class="view-label">时间轴视图</span>
      </el-radio-button>
    </el-radio-group>
    
    <!-- 时间轴视图的额外控制 -->
    <div v-if="currentView === 'timeline'" class="timeline-controls">
      <!-- 时间粒度选择 -->
      <div class="time-scale-selector">
        <span class="control-label">时间粒度:</span>
        <el-radio-group 
          :model-value="timeScale" 
          @update:model-value="$emit('update:time-scale', $event)"
          size="small"
        >
          <el-radio-button label="daily">每日</el-radio-button>
          <el-radio-button label="weekly">每周</el-radio-button>
        </el-radio-group>
      </div>
      
      <el-divider direction="vertical" />
      
      <el-button-group size="small">
        <el-button @click="$emit('zoom-in')" :disabled="!canZoomIn">
          <el-icon><ZoomIn /></el-icon>
        </el-button>
        <el-button @click="$emit('zoom-out')" :disabled="!canZoomOut">
          <el-icon><ZoomOut /></el-icon>
        </el-button>
      </el-button-group>
      
      <el-button size="small" @click="$emit('fit-to-content')">
        <el-icon><FullScreen /></el-icon>
        适应内容
      </el-button>
      
      <el-button size="small" @click="$emit('scroll-to-today')">
        <el-icon><Position /></el-icon>
        定位今天
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { List, Calendar, ZoomIn, ZoomOut, FullScreen, Position } from '@element-plus/icons-vue'

defineProps({
  currentView: {
    type: String,
    default: 'table'
  },
  timeScale: {
    type: String,
    default: 'daily'
  },
  canZoomIn: {
    type: Boolean,
    default: true
  },
  canZoomOut: {
    type: Boolean,
    default: true
  }
})

defineEmits([
  'update:view',
  'update:time-scale',
  'zoom-in',
  'zoom-out', 
  'fit-to-content',
  'scroll-to-today'
])
</script>

<style lang="scss" scoped>
.view-switcher {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
}

.view-label {
  margin-left: 4px;
}

.timeline-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-scale-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-label {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
}

// 响应式设计
@media (max-width: 768px) {
  .view-switcher {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .timeline-controls {
    justify-content: center;
  }
  
  .view-label {
    display: none;
  }
}
</style>