# Poem Admin Web

基于 React + TypeScript + Tailwind CSS 构建的现代化后台管理系统前端，采用 shadcn/ui 组件库。

## 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS + shadcn/ui
- **路由**: React Router DOM
- **状态管理**: Zustand + TanStack Query
- **HTTP 客户端**: Axios
- **图标**: Lucide React
- **表单**: React Hook Form + Zod
- **包管理器**: pnpm

## 功能特性

- 🔐 用户认证与授权
- 👥 用户管理
- 🛡️ 角色权限管理
- 🏢 组织架构管理
- 📊 仪表板概览
- 🌙 深色模式支持
- 📱 响应式设计
- ♿ 无障碍访问

## 快速开始

### 安装依赖

推荐使用 pnpm：

```bash
pnpm install
```

其他包管理器：

```bash
# 或使用 npm
npm install

# 或使用 yarn
yarn install
```

### 开发环境

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000)

### 构建生产版本

```bash
pnpm build
```

### 预览生产版本

```bash
pnpm preview
```

### 类型检查

```bash
pnpm type-check
```

### 代码检查

```bash
pnpm lint
```

## 环境变量

创建 `.env.local` 文件来配置本地开发环境：

```env
# 后端API地址（默认：http://127.0.0.1:9000）
VITE_API_URL=http://127.0.0.1:9000
```

### 本地后端服务配置

1. **后端服务地址**: 确保你的后端服务运行在 `http://127.0.0.1:9000`
2. **CORS 解决方案**: 项目已配置Vite代理自动处理跨域问题，无需后端配置CORS
3. **健康检查**: 系统会尝试访问 `/health` 端点来测试连接

### 代理工作原理

开发环境下，项目使用Vite代理来避免CORS问题：

```
前端请求: http://localhost:3000/api/login
   ↓ (Vite代理，保持完整路径)
后端实际: http://127.0.0.1:9000/api/login
```

生产环境下，前端直接访问后端API地址。

## API 接口

项目基于以下 API 接口：

- `POST /login` - 用户登录
- `GET /accounts/current` - 获取当前用户信息
- `GET /accounts` - 获取用户列表
- `POST /accounts` - 创建用户
- `GET /roles` - 获取角色列表
- `POST /roles` - 创建角色
- `GET /roles/{id}/detail` - 获取角色详情
- `POST /organizations` - 创建组织
- `POST /organizations/tree` - 获取组织树
- `GET /menus` - 获取菜单列表

## 项目结构

```
src/
├── components/          # 组件
│   ├── ui/             # shadcn/ui 基础组件
│   ├── layout.tsx      # 布局组件
│   ├── sidebar.tsx     # 侧边栏
│   └── header.tsx      # 头部
├── contexts/           # React Context
│   └── auth.tsx        # 认证上下文
├── lib/                # 工具库
│   ├── api.ts          # API 客户端
│   └── utils.ts        # 工具函数
├── pages/              # 页面组件
│   ├── login.tsx       # 登录页
│   ├── dashboard.tsx   # 仪表板
│   ├── accounts.tsx    # 用户管理
│   ├── roles.tsx       # 角色管理
│   └── organizations.tsx # 组织管理
├── types/              # TypeScript 类型定义
│   └── api.ts          # API 类型
├── App.tsx             # 应用根组件
├── main.tsx            # 应用入口
└── index.css           # 全局样式
```

## 开发指南

### 添加新页面

1. 在 `src/pages/` 目录下创建新的页面组件
2. 在 `src/App.tsx` 中添加路由配置
3. 在 `src/components/sidebar.tsx` 中添加导航菜单

### 添加新的 API 接口

1. 在 `src/types/api.ts` 中定义接口类型
2. 使用 `src/lib/api.ts` 中的 axios 实例调用接口
3. 使用 TanStack Query 进行数据管理

### 样式开发

项目使用 Tailwind CSS 和 shadcn/ui 组件库：

- 基础样式使用 Tailwind CSS 类名
- 复杂组件使用 shadcn/ui 组件
- 自定义组件放在 `src/components/ui/` 目录

### pnpm 使用提示

- 添加依赖：`pnpm add <package>`
- 添加开发依赖：`pnpm add -D <package>`
- 删除依赖：`pnpm remove <package>`
- 更新依赖：`pnpm update`

## 许可证

MIT License 