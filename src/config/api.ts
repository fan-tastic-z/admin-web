// API配置
export const API_CONFIG = {
  // 开发环境使用代理路径，生产环境使用实际后端地址
  BASE_URL: import.meta.env.DEV ? '/api' : import.meta.env.VITE_API_URL || 'http://127.0.0.1:9000',
  // 超时时间
  TIMEOUT: 10000,
  // API版本（如果后端有版本控制）
  VERSION: 'v1',
} as const

// API连接测试
export const testConnection = async (): Promise<boolean> => {
  try {
    // 在开发环境使用代理路径，生产环境使用完整URL
    const baseUrl = import.meta.env.DEV
      ? '/api'
      : import.meta.env.VITE_API_URL || 'http://127.0.0.1:9000'
    // 健康检查请求，使用完整的API路径
    const healthUrl = import.meta.env.DEV
      ? '/api/health'
      : `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:9000'}/api/health`
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return response.ok
  } catch (error) {
    console.warn('API连接测试失败:', error)
    return false
  }
}
