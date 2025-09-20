<template>
  <div class="gantt-timeline">
    <!-- 时间轴头部 -->
    <div class="timeline-header">
      <div class="timeline-header__left">
        <div class="task-column-header">任务信息</div>
      </div>
      <div class="timeline-header__right" ref="timelineScrollRef" @scroll="onScroll">
        <div class="timeline-scale" :style="{ width: timelineWidth + 'px' }">
          <!-- 月份刻度 -->
          <div class="timeline-months">
            <div 
              v-for="month in monthsData" 
              :key="month.key"
              class="timeline-month"
              :style="{ width: month.width + 'px', left: month.left + 'px' }"
            >
              {{ month.label }}
            </div>
          </div>
          <!-- 日期刻度 -->
          <div class="timeline-days">
            <div 
              v-for="unit in daysData" 
              :key="unit.key"
              class="timeline-day"
              :class="{ 'is-today': unit.isToday, 'is-weekend': unit.isWeekend }"
              :style="{ width: unitWidth + 'px', left: unit.left + 'px' }"
            >
              <template v-if="timeScale === 'weekly'">
                <span class="day-number">{{ unit.label }}</span>
                <span class="day-weekday">周</span>
              </template>
              <template v-else>
                <span class="day-number">{{ unit.day }}</span>
                <span class="day-weekday">{{ unit.weekday }}</span>
              </template>
            </div>
          </div>
          <!-- 今天标记线 -->
          <div 
            v-if="todayPosition >= 0"
            class="today-line"
            :style="{ left: todayPosition + 'px' }"
          ></div>
        </div>
      </div>
    </div>

    <!-- 任务行 -->
    <div class="timeline-body">
      <div 
        v-for="(task, index) in tasks" 
        :key="task.id || index"
        class="timeline-row"
        :class="{ 'is-milestone': task.isMilestone }"
      >
        <!-- 任务信息列 -->
        <div class="timeline-row__left">
          <div class="task-info">
            <div class="task-name">
              <el-icon v-if="task.isMilestone" class="milestone-icon"><Flag /></el-icon>
              {{ task.name }}
            </div>
            <div class="task-meta">
              <span v-if="task.assignee" class="task-assignee">{{ task.assignee }}</span>
              <el-tag 
                :type="getTaskStatusType(task)" 
                size="small"
                class="task-status"
              >
                {{ getTaskStatusText(task) }}
              </el-tag>
            </div>
          </div>
        </div>

        <!-- 时间轴区域 -->
        <div class="timeline-row__right" :style="{ width: timelineWidth + 'px' }">
          <div class="timeline-bars">
            <!-- 计划时间条 -->
            <div 
              v-if="task.startDate && task.endDate"
              class="timeline-bar timeline-bar--planned"
              :style="getBarStyle(task.startDate, task.endDate, 'planned')"
              @click="editTask(task)"
            >
              <div class="bar-content">
                <span class="bar-label">计划</span>
                <span class="bar-duration">{{ getTaskDuration(task.startDate, task.endDate) }}天</span>
              </div>
            </div>

            <!-- 实际时间条 -->
            <div 
              v-if="task.actualStartDate"
              class="timeline-bar timeline-bar--actual"
              :class="{ 'is-overdue': isTaskOverdue(task) }"
              :style="getBarStyle(task.actualStartDate, task.actualEndDate || new Date(), 'actual')"
              @click="editTask(task)"
            >
              <div class="bar-content">
                <span class="bar-label">实际</span>
                <span class="bar-duration">{{ getTaskDuration(task.actualStartDate, task.actualEndDate || new Date()) }}天</span>
              </div>
              <!-- 进度填充 -->
              <div 
                class="bar-progress"
                :style="{ width: (task.progress || 0) + '%' }"
              ></div>
            </div>

            <!-- 里程碑标记 -->
            <div 
              v-if="task.isMilestone && task.endDate"
              class="timeline-milestone"
              :style="{ left: getDatePosition(task.endDate) + 'px' }"
            >
              <el-icon><Flag /></el-icon>
            </div>
          </div>

          <!-- 网格线 -->
          <div class="timeline-grid">
            <div 
              v-for="unit in daysData" 
              :key="unit.key"
              class="grid-line"
              :class="{ 'is-weekend': unit.isWeekend }"
              :style="{ left: unit.left + 'px' }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 滑块导航 -->
    <div class="timeline-navigator">
      <el-slider 
        v-model="scrollPosition" 
        :max="maxScrollPosition"
        :show-tooltip="false"
        @input="handleSliderChange"
        class="nav-slider"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { Flag } from '@element-plus/icons-vue'
import { DateUtils } from '@shared/utils/date.js'

const props = defineProps({
  tasks: {
    type: Array,
    default: () => []
  },
  project: {
    type: Object,
    default: () => ({})
  },
  timeScale: {
    type: String,
    default: 'daily'
  },
  isTaskOverdue: {
    type: Function,
    required: true
  }
})

const emit = defineEmits(['edit-task'])

// 时间轴配置和滚动容器引用
const timelineScrollRef = ref(null)

// 根据时间粒度动态调整宽度
const unitWidth = computed(() => {
  return props.timeScale === 'weekly' ? 80 : 40 // 每周80px，每日40px
})



// 计算时间范围
const timeRange = computed(() => {
  if (!props.tasks.length) {
    const today = new Date()
    const start = new Date(today)
    start.setDate(start.getDate() - 30)
    const end = new Date(today)
    end.setDate(end.getDate() + 30)
    return { start, end }
  }

  let minDate = new Date()
  let maxDate = new Date()

  props.tasks.forEach(task => {
    if (task.startDate) {
      const startDate = new Date(task.startDate)
      if (startDate < minDate) minDate = startDate
    }
    if (task.endDate) {
      const endDate = new Date(task.endDate)
      if (endDate > maxDate) maxDate = endDate
    }
    if (task.actualStartDate) {
      const actualStart = new Date(task.actualStartDate)
      if (actualStart < minDate) minDate = actualStart
    }
    if (task.actualEndDate) {
      const actualEnd = new Date(task.actualEndDate)
      if (actualEnd > maxDate) maxDate = actualEnd
    }
  })

  // 扩展范围，前后各加15天
  minDate.setDate(minDate.getDate() - 15)
  maxDate.setDate(maxDate.getDate() + 15)

  return { start: minDate, end: maxDate }
})

// 计算总天数和时间轴宽度
const totalDays = computed(() => {
  const diffTime = timeRange.value.end - timeRange.value.start
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
})

const totalUnits = computed(() => {
  if (props.timeScale === 'weekly') {
    return Math.ceil(totalDays.value / 7)
  }
  return totalDays.value
})

const timelineWidth = computed(() => totalUnits.value * unitWidth.value)

// 生成日期数据
const daysData = computed(() => {
  const units = []
  const currentDate = new Date(timeRange.value.start)
  
  if (props.timeScale === 'weekly') {
    // 每周模式
    for (let i = 0; i < totalUnits.value; i++) {
      const weekStart = new Date(currentDate)
      const weekEnd = new Date(currentDate)
      weekEnd.setDate(weekEnd.getDate() + 6)
      
      const isCurrentWeek = DateUtils.isSameWeek(weekStart, new Date())
      
      units.push({
        key: `week-${i}`,
        date: new Date(weekStart),
        weekStart: new Date(weekStart),
        weekEnd: new Date(weekEnd),
        label: `${DateUtils.format(weekStart, 'MM/DD')}-${DateUtils.format(weekEnd, 'MM/DD')}`,
        left: i * unitWidth.value,
        isToday: isCurrentWeek,
        isWeekend: false
      })
      
      currentDate.setDate(currentDate.getDate() + 7)
    }
  } else {
    // 每日模式
    for (let i = 0; i < totalDays.value; i++) {
      const date = new Date(currentDate)
      const isToday = DateUtils.isSameDay(date, new Date())
      const isWeekend = date.getDay() === 0 || date.getDay() === 6
      
      units.push({
        key: DateUtils.format(date, 'YYYY-MM-DD'),
        date: new Date(date),
        day: date.getDate(),
        weekday: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()],
        left: i * unitWidth.value,
        isToday,
        isWeekend
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
  }
  
  return units
})

// 生成月份数据
const monthsData = computed(() => {
  const months = []
  const monthMap = new Map()
  
  daysData.value.forEach(day => {
    const monthKey = DateUtils.format(day.date, 'YYYY-MM')
    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, {
        key: monthKey,
        label: DateUtils.format(day.date, 'YYYY年MM月'),
        left: day.left,
        width: 0,
        days: []
      })
    }
    monthMap.get(monthKey).days.push(day)
  })
  
  monthMap.forEach(month => {
    month.width = month.days.length * unitWidth.value
    months.push(month)
  })
  
  return months
})

// 今天的位置
const todayPosition = computed(() => {
  const today = daysData.value.find(day => day.isToday)
  return today ? today.left + unitWidth.value / 2 : -1
})

// 获取日期在时间轴上的位置
const getDatePosition = (date) => {
  if (!date) return 0
  const targetDate = new Date(date)
  const diffTime = targetDate - timeRange.value.start
  const diffDays = diffTime / (1000 * 60 * 60 * 24)
  
  if (props.timeScale === 'weekly') {
    const diffWeeks = diffDays / 7
    return diffWeeks * unitWidth.value
  }
  
  return diffDays * unitWidth.value
}

// 获取任务条的样式
const getBarStyle = (startDate, endDate, type) => {
  if (!startDate) return { display: 'none' }
  
  const start = getDatePosition(startDate)
  const end = endDate ? getDatePosition(endDate) : getDatePosition(new Date())
  const width = Math.max(end - start, unitWidth.value * 0.5) // 最小宽度
  
  return {
    left: start + 'px',
    width: width + 'px'
  }
}

// 计算任务持续时间
const getTaskDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return 0
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = end - start
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// 获取任务状态类型
const getTaskStatusType = (task) => {
  if (props.isTaskOverdue(task)) return 'danger'
  if (task.actualEndDate) return 'success'
  if (task.actualStartDate) return 'warning'
  return 'info'
}

// 获取任务状态文本
const getTaskStatusText = (task) => {
  if (task.actualEndDate) return '已完成'
  if (task.actualStartDate) return '进行中'
  if (props.isTaskOverdue(task)) return '超期'
  return '未开始'
}




// 滑块状态
const scrollPosition = ref(0)

// 滑块最大值 = 时间轴总宽度
const maxScrollPosition = computed(() => {
  return timelineWidth.value
})

// 滑块拖动 = 直接设置滚动位置
const handleSliderChange = (value) => {
  if (timelineScrollRef.value) {
    timelineScrollRef.value.scrollLeft = value
  }
}

// 编辑任务
const editTask = (task) => {
  emit('edit-task', task)
}
</script>

<style lang="scss" scoped>
.gantt-timeline {
  background: #fff;
  border-radius: 8px;
  overflow: visible;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.timeline-header {
  display: flex;
  border-bottom: 2px solid #e4e7ed;
  background: #f8f9fa;

  &__left {
    width: 300px;
    flex-shrink: 0;
    border-right: 1px solid #e4e7ed;
  }

  &__right {
    flex: 1;
    overflow-x: auto;
    position: relative;
  }
}

.task-column-header {
  padding: 16px;
  font-weight: 600;
  color: #303133;
  background: #f8f9fa;
  height: 80px;
  display: flex;
  align-items: center;
}

.timeline-scale {
  position: relative;
  height: 80px;
}

.timeline-months {
  position: absolute;
  top: 0;
  left: 0;
  height: 40px;
  width: 100%;
}

.timeline-month {
  position: absolute;
  top: 0;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #303133;
  border-right: 1px solid #e4e7ed;
  background: #f0f2f5;
}

.timeline-days {
  position: absolute;
  top: 40px;
  left: 0;
  height: 40px;
  width: 100%;
}

.timeline-day {
  position: absolute;
  top: 0;
  height: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #e4e7ed;
  font-size: 12px;
  
  &.is-today {
    background: #e6f7ff;
    color: #1890ff;
    font-weight: 600;
  }
  
  &.is-weekend {
    background: #fafafa;
    color: #999;
  }
}

.day-number {
  font-weight: 600;
  line-height: 1;
}

.day-weekday {
  font-size: 10px;
  opacity: 0.7;
  line-height: 1;
}

.today-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #ff4d4f;
  z-index: 10;
  pointer-events: none;
}

.timeline-body {
  max-height: 600px;
  overflow-y: auto;
}

.timeline-row {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
  min-height: 60px;
  
  &:hover {
    background: #fafafa;
  }
  
  &.is-milestone {
    background: #fff7e6;
  }

  &__left {
    width: 300px;
    flex-shrink: 0;
    border-right: 1px solid #e4e7ed;
    padding: 12px 16px;
  }

  &__right {
    flex: 1;
    position: relative;
    overflow: hidden;
  }
}

.task-info {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.task-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
  
  .milestone-icon {
    color: #faad14;
  }
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.task-assignee {
  color: #666;
}

.task-status {
  font-size: 10px;
}

.timeline-bars {
  position: relative;
  height: 100%;
  padding: 8px 0;
}

.timeline-bar {
  position: absolute;
  height: 20px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  padding: 0 8px;
  min-width: 20px;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
  
  &--planned {
    background: #1890ff;
    color: white;
    top: 8px;
    opacity: 0.8;
  }
  
  &--actual {
    background: #52c41a;
    color: white;
    top: 32px;
    position: relative;
    
    &.is-overdue {
      background: #ff4d4f;
    }
  }
}

.bar-content {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
}

.bar-progress {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  transition: width 0.3s;
}

.timeline-milestone {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  background: #faad14;
  border-radius: 50% 50% 50% 0;
  transform: rotate(45deg) translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 5;
  
  .el-icon {
    transform: rotate(-45deg);
    font-size: 12px;
  }
}

.timeline-grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.grid-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: #f0f0f0;
  
  &.is-weekend {
    background: #e6e6e6;
  }
}

.timeline-navigator {
  background: #f8f9fa;
  border-top: 1px solid #e4e7ed;
  padding: 16px;
}

.nav-slider {
  width: 100%;
}


// 响应式设计
@media (max-width: 768px) {
  .timeline-header__left,
  .timeline-row__left {
    width: 200px;
  }
  
  .task-column-header,
  .task-info {
    padding: 8px 12px;
  }
  
  .timeline-day {
    font-size: 10px;
  }
  
  .timeline-bar {
    height: 16px;
    padding: 0 4px;
  }
  
  .bar-content {
    font-size: 10px;
  }
}
</style>