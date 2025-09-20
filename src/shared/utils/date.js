import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import weekday from 'dayjs/plugin/weekday'
import 'dayjs/locale/zh-cn'

// 扩展 dayjs 插件
dayjs.extend(relativeTime)
dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)
dayjs.extend(weekday)

// 设置中文语言
dayjs.locale('zh-cn')

/**
 * 日期工具函数
 */
export class DateUtils {
  /**
   * 格式化日期
   * @param {Date|string} date 日期
   * @param {string} format 格式
   * @returns {string} 格式化后的日期
   */
  static format(date, format = 'YYYY-MM-DD') {
    if (!date) return ''
    return dayjs(date).format(format)
  }
  
  /**
   * 获取相对时间
   * @param {Date|string} date 日期
   * @returns {string} 相对时间
   */
  static fromNow(date) {
    if (!date) return ''
    return dayjs(date).fromNow()
  }
  
  /**
   * 获取到指定日期的相对时间
   * @param {Date|string} date 日期
   * @param {Date|string} target 目标日期
   * @returns {string} 相对时间
   */
  static to(date, target) {
    if (!date || !target) return ''
    return dayjs(date).to(dayjs(target))
  }
  
  /**
   * 检查日期是否在指定范围内
   * @param {Date|string} date 检查的日期
   * @param {Date|string} start 开始日期
   * @param {Date|string} end 结束日期
   * @returns {boolean} 是否在范围内
   */
  static isBetween(date, start, end) {
    const d = dayjs(date)
    return d.isSameOrAfter(dayjs(start)) && d.isSameOrBefore(dayjs(end))
  }
  
  /**
   * 检查日期是否超期
   * @param {Date|string} date 检查的日期
   * @param {Date|string} reference 参考日期，默认为当前时间
   * @returns {boolean} 是否超期
   */
  static isOverdue(date, reference = new Date()) {
    return dayjs(date).isBefore(dayjs(reference), 'day')
  }
  
  /**
   * 添加天数
   * @param {Date|string} date 起始日期
   * @param {number} days 要添加的天数
   * @returns {Date} 结果日期
   */
  static addDays(date, days) {
    return dayjs(date).add(days, 'day').toDate()
  }
  
  /**
   * 减去天数
   * @param {Date|string} date 起始日期
   * @param {number} days 要减去的天数
   * @returns {Date} 结果日期
   */
  static subtractDays(date, days) {
    return dayjs(date).subtract(days, 'day').toDate()
  }
  
  /**
   * 添加月份
   * @param {Date|string} date 起始日期
   * @param {number} months 要添加的月份数
   * @returns {Date} 结果日期
   */
  static addMonths(date, months) {
    return dayjs(date).add(months, 'month').toDate()
  }
  
  /**
   * 添加年份
   * @param {Date|string} date 起始日期
   * @param {number} years 要添加的年份数
   * @returns {Date} 结果日期
   */
  static addYears(date, years) {
    return dayjs(date).add(years, 'year').toDate()
  }
  
  /**
   * 检查两个日期是否是同一天
   * @param {Date|string} date1 日期1
   * @param {Date|string} date2 日期2
   * @returns {boolean} 是否是同一天
   */
  static isSameDay(date1, date2) {
    return dayjs(date1).isSame(dayjs(date2), 'day')
  }
  
  /**
   * 检查两个日期是否是同一周
   * @param {Date|string} date1 日期1
   * @param {Date|string} date2 日期2
   * @returns {boolean} 是否是同一周
   */
  static isSameWeek(date1, date2) {
    return dayjs(date1).isSame(dayjs(date2), 'week')
  }
  
  /**
   * 计算两个日期之间的天数差
   * @param {Date|string} start 开始日期
   * @param {Date|string} end 结束日期
   * @returns {number} 天数差
   */
  static diffInDays(start, end) {
    return dayjs(end).diff(dayjs(start), 'day')
  }
  
  /**
   * 计算两个日期之间的工作日数
   * @param {Date|string} start 开始日期
   * @param {Date|string} end 结束日期
   * @returns {number} 工作日数
   */
  static diffInWorkdays(start, end) {
    let current = dayjs(start)
    const endDate = dayjs(end)
    let workdays = 0
    
    while (current.isSameOrBefore(endDate, 'day')) {
      // 周一到周五为工作日
      if (current.day() >= 1 && current.day() <= 5) {
        workdays++
      }
      current = current.add(1, 'day')
    }
    
    return workdays
  }
  
  /**
   * 添加工作日
   * @param {Date|string} date 起始日期
   * @param {number} days 要添加的工作日数
   * @returns {Date} 结果日期
   */
  static addWorkdays(date, days) {
    let current = dayjs(date)
    let remainingDays = days
    
    while (remainingDays > 0) {
      current = current.add(1, 'day')
      // 如果是工作日，减少剩余天数
      if (current.day() >= 1 && current.day() <= 5) {
        remainingDays--
      }
    }
    
    return current.toDate()
  }
  
  /**
   * 获取日期范围内的所有日期
   * @param {Date|string} start 开始日期
   * @param {Date|string} end 结束日期
   * @returns {Array<Date>} 日期数组
   */
  static getDateRange(start, end) {
    const dates = []
    let current = dayjs(start)
    const endDate = dayjs(end)
    
    while (current.isSameOrBefore(endDate, 'day')) {
      dates.push(current.toDate())
      current = current.add(1, 'day')
    }
    
    return dates
  }
  
  /**
   * 获取本周的开始和结束日期
   * @param {Date|string} date 参考日期，默认为当前时间
   * @returns {object} 包含开始和结束日期的对象
   */
  static getWeekRange(date = new Date()) {
    const d = dayjs(date)
    const start = d.startOf('week')
    const end = d.endOf('week')
    
    return {
      start: start.toDate(),
      end: end.toDate()
    }
  }
  
  /**
   * 获取本月的开始和结束日期
   * @param {Date|string} date 参考日期，默认为当前时间
   * @returns {object} 包含开始和结束日期的对象
   */
  static getMonthRange(date = new Date()) {
    const d = dayjs(date)
    const start = d.startOf('month')
    const end = d.endOf('month')
    
    return {
      start: start.toDate(),
      end: end.toDate()
    }
  }
  
  /**
   * 获取本季度的开始和结束日期
   * @param {Date|string} date 参考日期，默认为当前时间
   * @returns {object} 包含开始和结束日期的对象
   */
  static getQuarterRange(date = new Date()) {
    const d = dayjs(date)
    const start = d.startOf('quarter')
    const end = d.endOf('quarter')
    
    return {
      start: start.toDate(),
      end: end.toDate()
    }
  }
  
  /**
   * 检查是否为工作日
   * @param {Date|string} date 日期
   * @returns {boolean} 是否为工作日
   */
  static isWorkday(date) {
    const day = dayjs(date).day()
    return day >= 1 && day <= 5
  }
  
  /**
   * 检查是否为周末
   * @param {Date|string} date 日期
   * @returns {boolean} 是否为周末
   */
  static isWeekend(date) {
    const day = dayjs(date).day()
    return day === 0 || day === 6
  }
  
  /**
   * 检查是否为今天
   * @param {Date|string} date 日期
   * @returns {boolean} 是否为今天
   */
  static isToday(date) {
    return dayjs(date).isSame(dayjs(), 'day')
  }
  
  /**
   * 检查是否为本周
   * @param {Date|string} date 日期
   * @returns {boolean} 是否为本周
   */
  static isThisWeek(date) {
    return dayjs(date).isSame(dayjs(), 'week')
  }
  
  /**
   * 检查是否为本月
   * @param {Date|string} date 日期
   * @returns {boolean} 是否为本月
   */
  static isThisMonth(date) {
    return dayjs(date).isSame(dayjs(), 'month')
  }
  
  /**
   * 获取日期的显示文本
   * @param {Date|string} date 日期
   * @param {object} options 选项
   * @returns {string} 显示文本
   */
  static getDisplayText(date, options = {}) {
    const { 
      showRelative = true, 
      showTime = false, 
      format = 'YYYY-MM-DD' 
    } = options
    
    if (!date) return ''
    
    const d = dayjs(date)
    const now = dayjs()
    
    // 如果显示相对时间且在合理范围内
    if (showRelative) {
      const diffDays = Math.abs(d.diff(now, 'day'))
      
      if (diffDays === 0) {
        return showTime ? `今天 ${d.format('HH:mm')}` : '今天'
      } else if (diffDays === 1) {
        if (d.isAfter(now)) {
          return showTime ? `明天 ${d.format('HH:mm')}` : '明天'
        } else {
          return showTime ? `昨天 ${d.format('HH:mm')}` : '昨天'
        }
      } else if (diffDays <= 7) {
        return d.fromNow()
      }
    }
    
    // 默认格式化显示
    const dateFormat = showTime ? `${format} HH:mm` : format
    return d.format(dateFormat)
  }
  
  /**
   * 解析日期字符串
   * @param {string} dateString 日期字符串
   * @param {string} format 格式
   * @returns {Date|null} 解析后的日期
   */
  static parse(dateString, format) {
    if (!dateString) return null
    
    const parsed = format ? dayjs(dateString, format) : dayjs(dateString)
    return parsed.isValid() ? parsed.toDate() : null
  }
  
  /**
   * 获取时区偏移
   * @returns {number} 时区偏移（分钟）
   */
  static getTimezoneOffset() {
    return new Date().getTimezoneOffset()
  }
  
  /**
   * 转换为UTC时间
   * @param {Date|string} date 日期
   * @returns {Date} UTC时间
   */
  static toUTC(date) {
    return dayjs(date).utc().toDate()
  }
  
  /**
   * 从UTC时间转换为本地时间
   * @param {Date|string} date UTC日期
   * @returns {Date} 本地时间
   */
  static fromUTC(date) {
    return dayjs.utc(date).local().toDate()
  }
}

// 导出常用的日期格式化函数
export const formatDate = DateUtils.format
export const formatRelativeTime = DateUtils.fromNow
export const isOverdue = DateUtils.isOverdue
export const diffInDays = DateUtils.diffInDays
export const addDays = DateUtils.addDays
export const isSameDay = DateUtils.isSameDay
export const isToday = DateUtils.isToday
export const getDisplayText = DateUtils.getDisplayText