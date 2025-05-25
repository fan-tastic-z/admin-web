import { useState, useEffect } from 'react'
import { testConnection, API_CONFIG } from '@/config/api'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

export default function ApiStatus() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading')

  useEffect(() => {
    const checkConnection = async () => {
      setStatus('loading')
      const isConnected = await testConnection()
      setStatus(isConnected ? 'connected' : 'error')
    }

    checkConnection()

    // 每30秒检查一次连接状态
    const interval = setInterval(checkConnection, 30000)

    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'loading':
        return '检查中...'
      case 'connected':
        return '已连接'
      case 'error':
        return '连接失败'
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-gray-500'
      case 'connected':
        return 'text-green-500'
      case 'error':
        return 'text-red-500'
    }
  }

  return (
    <div className="flex items-center space-x-2 text-sm">
      {getStatusIcon()}
      <span className={getStatusColor()}>
        后端服务 ({API_CONFIG.BASE_URL}): {getStatusText()}
      </span>
    </div>
  )
}
