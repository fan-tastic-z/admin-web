import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/auth'
import api from '@/lib/api'
import { LoginRequest, BackendLoginResponse, User } from '@/types/api'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<LoginRequest>({
    username: '',
    password: '',
  })

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 使用实际的后端响应格式
      const response = await api.post<BackendLoginResponse>('/login', formData)

      console.log('登录响应:', response)
      console.log('响应数据:', response.data)

      // 检查后端响应格式：{status_code: 200, data: {token, user_id, expires_in}}
      if (response.data && response.data.status_code === 200 && response.data.data) {
        const { token, user_id } = response.data.data

        console.log('提取的token:', token)
        console.log('提取的user_id:', user_id)

        if (token && user_id) {
          // 创建临时用户对象，因为后端只返回user_id
          const tempUser: User = {
            id: user_id,
            name: formData.username, // 使用输入的用户名作为临时名称
            organization_id: 0, // 临时值，稍后可以通过API获取详细信息
            role_id: 0, // 临时值
          }

          console.log('创建的临时用户对象:', tempUser)

          // 调用登录函数
          login(token, tempUser)

          console.log('登录成功，即将跳转到dashboard')
          navigate('/dashboard')
        } else {
          console.error('缺少token或user_id:', { token, user_id })
          setError('登录数据不完整：缺少token或用户ID')
        }
      } else {
        console.error('响应格式异常:', response.data)
        setError(`响应格式异常：status_code=${response.data?.status_code}`)
      }
    } catch (err: unknown) {
      console.error('登录错误:', err)
      const errorMessage =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
            '登录失败'
          : '登录失败'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">登录到您的账户</h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="-space-y-px rounded-md shadow-sm">
            <div>
              <label htmlFor="username" className="sr-only">
                用户名
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                placeholder="用户名"
                value={formData.username}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                placeholder="密码"
                value={formData.password}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {error && <div className="text-center text-sm text-red-600">{error}</div>}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
