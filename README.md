# 项目管理工具

一个轻量化的企业内部项目管理工具，支持项目管理、任务跟踪和甘特图可视化。

## 🚀 在线访问

访问地址：[https://INOUTIN.github.io/Project-Management-assest/](https://INOUTIN.github.io/Project-Management-assest/)

## ✨ 功能特性

### 📊 仪表盘
- 项目统计概览（总数、进行中、已完成、超期）
- 任务统计概览（总数、进行中、已完成、超期）
- 7天/14天超期任务提醒
- 项目卡片展示

### 📋 项目管理
- 项目列表管理
- 新建/编辑/删除项目
- 任务节点分解
- 任务状态跟踪
- 责任人分配
- 里程碑标识

### 📈 甘特图
- 项目时间轴可视化
- 任务进度展示
- 时间刻度切换（日/周）
- 滑块导航
- 实际时间记录

### ⚙️ 系统设置
- 数据导出（JSON/CSV）
- 自动刷新设置
- 提醒配置
- 缓存管理

## 🛠️ 技术栈

- **前端框架**: Vue 3 + Composition API
- **UI组件库**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **构建工具**: Vite
- **样式**: SCSS
- **数据存储**: LocalStorage（轻量化方案）

## 📦 本地开发

### 环境要求
- Node.js >= 16
- npm >= 8

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 预览构建结果
```bash
npm run preview
```

## 📁 项目结构

```
src/
├── core/                 # 核心配置
│   ├── config/          # 应用配置
│   └── router/          # 路由配置
├── features/            # 功能模块
│   ├── dashboard/       # 仪表盘
│   ├── project-management/ # 项目管理
│   └── gantt-chart/     # 甘特图
├── shared/              # 共享资源
│   ├── components/      # 通用组件
│   ├── utils/          # 工具函数
│   └── services/       # 服务层
└── assets/             # 静态资源
```

## 🔧 配置说明

### 功能开关
在 `src/core/config/feature.config.js` 中可以控制功能模块的启用/禁用。

### 数据存储
当前版本使用 LocalStorage 进行轻量化数据存储，每个用户的数据独立保存在浏览器中。

## 📝 使用说明

1. **创建项目**: 在项目管理页面点击"新建项目"
2. **添加任务**: 在项目中添加任务节点，设置时间和责任人
3. **跟踪进度**: 在甘特图中查看项目时间轴和任务进度
4. **数据管理**: 在设置中可以导出数据或清除缓存

## 🚀 部署

项目已配置 GitHub Actions 自动部署到 GitHub Pages。

推送到 main 分支后会自动触发部署流程。

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**注意**: 这是一个轻量化的内部工具，适合小团队使用。如需更复杂的功能（如多用户协作、权限管理等），建议集成后端服务。