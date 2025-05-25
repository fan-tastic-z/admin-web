import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/auth'
import api from '@/lib/api'
import { BackendLoginResponse, User } from '@/types/api'

export default function LoginTest() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  const testLogin = async () => {
    setLoading(true)
    setResult('')

    try {
      const response = await api.post<BackendLoginResponse>('/login', {
        username: 'admin',
        password: '123456',
      })

      console.log('测试登录响应:', response.data)

      if (response.data && response.data.status_code === 200 && response.data.data) {
        const { token, user_id } = response.data.data

        const tempUser: User = {
          id: user_id,
          name: 'admin',
          organization_id: 0,
          role_id: 0,
        }

        login(token, tempUser)
        setResult('✅ 登录成功！即将跳转...')

        setTimeout(() => {
          navigate('/dashboard')
        }, 1000)
      } else {
        setResult(`❌ 登录失败：status_code=${response.data?.status_code}`)
      }
    } catch (err: any) {
      setResult(`❌ 请求失败：${err.message}`)
      console.error('登录测试错误:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded border border-yellow-200 bg-yellow-50 p-4">
      <h3 className="mb-2 font-bold">快速登录测试</h3>
      <button
        onClick={testLogin}
        disabled={loading}
        className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600 disabled:opacity-50"
      >
        {loading ? '测试中...' : '测试登录 (admin/123456)'}
      </button>
      {result && <div className="mt-2 text-sm">{result}</div>}
    </div>
  )
}
