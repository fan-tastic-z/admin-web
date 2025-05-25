# CORS 问题解决方案

## 🚨 问题描述

如果你看到以下错误：
```
Access to XMLHttpRequest at 'http://127.0.0.1:9000/api/login' from origin 'http://localhost:3000' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## ✅ 解决方案

### 1. 项目已配置自动解决方案

项目已经配置了Vite代理来自动解决CORS问题：

**开发环境**:
- 前端请求: `http://localhost:3000/api/login`
- 代理转发: `http://127.0.0.1:9000/api/login` (保持完整路径)

**生产环境**:
- 前端直接请求: `http://127.0.0.1:9000/api/login`

### 2. 配置文件

- `vite.config.ts` - 代理配置（不重写路径）
- `src/config/api.ts` - API路径配置
- `.env.local` - 环境变量

### 3. 验证配置

运行测试脚本：
```bash
node scripts/test-proxy.js
```

### 4. 调试步骤

1. **检查前端服务器**: `http://localhost:3000`
2. **检查后端服务器**: `http://127.0.0.1:9000`
3. **确认后端API路径**: `http://127.0.0.1:9000/api/login`
4. **查看浏览器控制台**: 检查代理日志
5. **重启开发服务器**: `pnpm dev`

### 5. 代理日志

在浏览器控制台查看代理请求日志：
```
Sending Request to the Target: POST /api/login
Received Response from the Target: 200 /api/login
```

## 🔧 如果问题仍然存在

1. **清除浏览器缓存**
2. **重启开发服务器**: 停止并重新运行 `pnpm dev`
3. **检查后端服务**: 确保运行在 `http://127.0.0.1:9000`
4. **确认后端API路径**: 确保API接口包含 `/api` 前缀
5. **检查防火墙设置**

## 📝 备选方案

如果代理不工作，可以在后端配置CORS：

```javascript
// 后端代码示例
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

然后修改 `src/config/api.ts` 直接使用后端地址：
```typescript
BASE_URL: 'http://127.0.0.1:9000/api'
``` 