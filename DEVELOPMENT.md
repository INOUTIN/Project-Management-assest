# 开发指南

## 🚀 快速开始

### 环境准备
确保您的开发环境满足以下要求：
- Node.js >= 16.0.0
- npm >= 8.0.0 或 yarn >= 1.22.0
- Git

### 项目启动

1. **克隆项目**
```bash
git clone <repository-url>
cd project-management-tool
```

2. **安装依赖**
```bash
npm install
# 或
yarn install
```

3. **启动开发服务器**
```bash
npm run dev
# 或
yarn dev
```

4. **访问应用**
打开浏览器访问 http://localhost:5173

## 📁 项目结构详解

### 核心目录说明

```
src/
├── core/                          # 核心系统层
│   ├── app.js                     # 应用主入口
│   ├── router/                    # 路由配置
│   │   ├── index.js              # 路由主配置
│   │   └── guards.js             # 路由守卫
│   ├── store/                     # 全局状态管理
│   │   ├── index.js              # Pinia配置
│   │   └── modules/              # 状态模块
│   ├── config/                    # 配置文件
│   │   ├── app.config.js         # 应用配置
│   │   ├── api.config.js         # API配置
│   │   └── feature.config.js     # 功能开关
│   └── plugins/                   # 核心插件
│
├── shared/                        # 共享资源层
│   ├── services/                  # 业务服务
│   │   ├── api/                  # API服务
│   │   ├── data/                 # 数据服务
│   │   ├── calculation/          # 计算引擎
│   │   └── storage/              # 存储服务
│   ├── utils/                     # 工具函数
│   │   ├── constants.js          # 常量定义
│   │   ├── date.js               # 日期工具
│   │   ├── validation.js         # 验证工具
│   │   └── format.js             # 格式化工具
│   ├── components/                # 通用组件
│   │   ├── base/                 # 基础组件
│   │   ├── business/             # 业务组件
│   │   └── layout/               # 布局组件
│   └── composables/               # 组合式函数
│
├── features/                      # 功能模块层
│   ├── dashboard/                 # 仪表盘模块
│   │   ├── index.js              # 模块入口
│   │   ├── routes.js             # 路由定义
│   │   ├── store.js              # 状态管理
│   │   ├── services/             # 模块服务
│   │   ├── components/           # 模块组件
│   │   └── views/                # 页面视图
│   ├── project-management/        # 项目管理模块
│   └── gantt-chart/              # 甘特图模块
│
├── plugins/                       # 插件系统
│   ├── index.js                  # 插件管理器
│   └── [各种插件]/
│
└── assets/                        # 静态资源
    ├── styles/                   # 样式文件
    ├── images/                   # 图片资源
    └── fonts/                    # 字体文件
```

## 🔧 开发规范

### 代码规范

#### 命名规范
- **文件命名**: kebab-case (project-card.vue)
- **组件命名**: PascalCase (ProjectCard)
- **函数命名**: camelCase (calculateProjectStats)
- **常量命名**: UPPER_SNAKE_CASE (PROJECT_STATUS)
- **变量命名**: camelCase (projectList)

#### Vue 组件规范
```vue
<template>
  <!-- 模板内容 -->
</template>

<script setup>
// 1. 导入依赖
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

// 2. 定义 props
const props = defineProps({
  // props 定义
})

// 3. 定义 emits
const emit = defineEmits(['event-name'])

// 4. 响应式数据
const data = ref('')

// 5. 计算属性
const computedValue = computed(() => {
  // 计算逻辑
})

// 6. 方法
const handleClick = () => {
  // 方法实现
}

// 7. 生命周期
onMounted(() => {
  // 初始化逻辑
})
</script>

<style lang="scss" scoped>
/* 组件样式 */
</style>
```

#### JavaScript 规范
```javascript
// 使用 const/let，避免 var
const API_BASE_URL = 'https://api.example.com'
let currentUser = null

// 函数声明
const calculateTotal = (items) => {
  return items.reduce((sum, item) => sum + item.price, 0)
}

// 对象解构
const { name, age } = user

// 数组解构
const [first, second] = items

// 模板字符串
const message = `Hello, ${name}!`

// 异步处理
const fetchData = async () => {
  try {
    const response = await api.getData()
    return response.data
  } catch (error) {
    console.error('Failed to fetch data:', error)
    throw error
  }
}
```

### 样式规范

#### SCSS 使用规范
```scss
// 使用 BEM 命名规范
.project-card {
  padding: 20px;
  border-radius: 8px;
  
  &__header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16px;
  }
  
  &__title {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-primary);
  }
  
  &--active {
    border: 2px solid var(--color-primary);
  }
  
  // 响应式设计
  @media (max-width: 768px) {
    padding: 16px;
    
    &__title {
      font-size: 16px;
    }
  }
}
```

#### CSS 变量使用
```scss
// 使用预定义的 CSS 变量
.component {
  color: var(--color-text-primary);
  background: var(--color-bg-light);
  border: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-light);
}
```

## 🏗️ 架构设计

### 模块化设计原则

#### 1. 单一职责原则
每个模块只负责一个功能领域：
- `dashboard` - 仪表盘展示
- `project-management` - 项目管理
- `gantt-chart` - 甘特图展示

#### 2. 依赖注入
通过接口而非具体实现进行依赖：
```javascript
// 好的做法
class ProjectService {
  constructor(storage, calculator) {
    this.storage = storage
    this.calculator = calculator
  }
}

// 避免的做法
class ProjectService {
  constructor() {
    this.storage = new LocalStorage() // 硬编码依赖
  }
}
```

#### 3. 事件驱动通信
模块间通过事件进行通信：
```javascript
// 发布事件
eventBus.emit('project:created', project)

// 监听事件
eventBus.on('project:created', (project) => {
  // 处理项目创建事件
})
```

### 数据流设计

#### 1. 数据服务层
```javascript
// 基础数据服务
class BaseDataService {
  async create(entity) { /* 通用创建逻辑 */ }
  async update(id, entity) { /* 通用更新逻辑 */ }
  async delete(id) { /* 通用删除逻辑 */ }
  async findById(id) { /* 通用查询逻辑 */ }
  async findAll(filters) { /* 通用列表逻辑 */ }
}

// 具体业务服务
class ProjectDataService extends BaseDataService {
  async getProjectWithTasks(projectId) {
    // 项目特有逻辑
  }
}
```

#### 2. 计算引擎
```javascript
// 统一的计算服务
class CalculationEngine {
  register(name, calculator) {
    this.calculators.set(name, calculator)
  }
  
  calculate(type, data, options = {}) {
    const calculator = this.calculators.get(type)
    return calculator.calculate(data, options)
  }
}
```

#### 3. 状态管理
```javascript
// Pinia store
export const useProjectStore = defineStore('project', {
  state: () => ({
    projects: [],
    loading: false,
    error: null
  }),
  
  getters: {
    activeProjects: (state) => {
      return state.projects.filter(p => p.status === 'active')
    }
  },
  
  actions: {
    async fetchProjects() {
      this.loading = true
      try {
        this.projects = await projectService.findAll()
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    }
  }
})
```

## 🔌 插件开发

### 插件结构
```javascript
export default {
  name: 'my-plugin',
  version: '1.0.0',
  description: '插件描述',
  
  // 插件安装
  install(app, options) {
    // 注册组件
    app.component('MyComponent', MyComponent)
    
    // 注册指令
    app.directive('my-directive', myDirective)
    
    // 提供服务
    app.provide('myService', new MyService())
  },
  
  // 插件卸载
  uninstall(app) {
    // 清理逻辑
  },
  
  // 插件钩子
  hooks: {
    'app:mounted': (context) => {
      // 应用挂载后执行
    },
    'project:created': (project) => {
      // 项目创建后执行
    }
  }
}
```

### 插件注册
```javascript
import { pluginManager } from '@/plugins'
import myPlugin from './my-plugin'

// 注册插件
pluginManager.register(myPlugin)

// 安装插件
pluginManager.install('my-plugin', app, options)
```

## 🧪 测试指南

### 单元测试
```javascript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProjectCard from '@/features/dashboard/components/ProjectCard.vue'

describe('ProjectCard', () => {
  it('renders project name correctly', () => {
    const project = {
      id: '1',
      name: 'Test Project',
      status: 'in_progress'
    }
    
    const wrapper = mount(ProjectCard, {
      props: { project }
    })
    
    expect(wrapper.text()).toContain('Test Project')
  })
})
```

### 组件测试
```javascript
import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import StatCard from '@/features/dashboard/components/StatCard.vue'

test('stat card displays value correctly', async () => {
  render(StatCard, {
    props: {
      title: 'Total Projects',
      value: 42,
      icon: 'FolderOpened'
    }
  })
  
  expect(screen.getByText('Total Projects')).toBeInTheDocument()
  expect(screen.getByText('42')).toBeInTheDocument()
})
```

## 🚀 部署指南

### 构建生产版本
```bash
# 构建
npm run build

# 预览构建结果
npm run preview
```

### Docker 部署
```dockerfile
FROM node:16-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 环境变量配置
```bash
# 开发环境
VITE_API_BASE_URL=http://localhost:3000
VITE_ENABLE_MOCK=true

# 生产环境
VITE_API_BASE_URL=https://api.production.com
VITE_ENABLE_MOCK=false
```

## 🐛 调试技巧

### Vue DevTools
安装 Vue DevTools 浏览器扩展，可以：
- 查看组件树
- 检查组件状态
- 监控事件
- 分析性能

### 控制台调试
```javascript
// 开发环境下的调试信息
if (import.meta.env.DEV) {
  console.log('Debug info:', data)
}

// 使用 debugger 断点
const handleClick = () => {
  debugger // 浏览器会在此处暂停
  // 处理逻辑
}
```

### 网络请求调试
```javascript
// 在 API 服务中添加请求日志
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
})

apiClient.interceptors.request.use(config => {
  console.log('API Request:', config)
  return config
})

apiClient.interceptors.response.use(
  response => {
    console.log('API Response:', response)
    return response
  },
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)
```

## 📚 学习资源

### 官方文档
- [Vue 3 官方文档](https://vuejs.org/)
- [Vite 官方文档](https://vitejs.dev/)
- [Element Plus 官方文档](https://element-plus.org/)
- [Pinia 官方文档](https://pinia.vuejs.org/)

### 推荐阅读
- Vue 3 Composition API 最佳实践
- 前端架构设计模式
- 组件库设计原则
- 性能优化技巧

## 🤝 贡献流程

1. Fork 项目
2. 创建功能分支
3. 提交代码
4. 创建 Pull Request
5. 代码审查
6. 合并代码

### 提交信息规范
```
type(scope): description

feat(dashboard): add project statistics cards
fix(api): resolve data loading issue
docs(readme): update installation guide
style(components): improve button styling
refactor(utils): optimize date calculation
test(services): add unit tests for project service
```

---

Happy Coding! 🎉