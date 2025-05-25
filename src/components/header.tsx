import { useAuth } from '@/contexts/auth'
import { LogOut, Menu } from 'lucide-react'
import CurrentUser from './current-user'

interface HeaderProps {
  onMobileMenuClick?: () => void
}

export default function Header({ onMobileMenuClick }: HeaderProps) {
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <header className="border-b border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          {/* 移动端菜单按钮 */}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
            onClick={onMobileMenuClick}
          >
            <span className="sr-only">打开主菜单</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          <h1 className="ml-2 text-lg font-semibold text-gray-900 md:ml-0">管理面板</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden sm:block">
            <CurrentUser />
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center rounded-md border border-transparent bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span className="hidden sm:block">退出登录</span>
          </button>
        </div>
      </div>
    </header>
  )
}
