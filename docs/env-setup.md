# 环境配置说明

## 本地开发环境配置

### 1. 创建环境变量文件

在项目根目录创建 `.env.local` 文件（此文件不会被提交到版本控制）：

```bash
# 后端API地址
VITE_API_URL=http://127.0.0.1:9000
```

### 2. 后端服务配置

确保你的后端服务运行在 `http://127.0.0.1:9000`，API接口路径包含 `/api` 前缀

### 3. CORS 解决方案

项目已配置Vite代理来自动解决CORS问题：

- **开发环境**: 前端通过 `/api` 路径访问后端，Vite会自动代理到 `http://127.0.0.1:9000`，保持完整的 `/api` 路径
- **生产环境**: 前端直接访问后端API地址

### 4. 代理工作原理

```
前端请求: http://localhost:3000/api/login
   ↓ (Vite代理，保持完整路径)
后端实际: http://127.0.0.1:9000/api/login
```

### 5. 启动开发服务器

```bash
pnpm dev
```

服务器将运行在 `http://localhost:3000`

### 6. 调试代理

如果代理有问题，可以在浏览器开发者工具的 Console 中查看代理日志：
- `Sending Request to the Target: POST /api/login`
- `Received Response from the Target: 200 /api/login` 