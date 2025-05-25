import { User } from 'lucide-react'
import { useUserMenus } from '@/hooks/use-user-menus'

export default function CurrentUser() {
  // 获取当前用户信息
  const { data: userMenuData, isLoading } = useUserMenus()
  const currentUser = userMenuData?.user

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <User className="h-4 w-4" />
        <span>加载中...</span>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <User className="h-4 w-4" />
        <span>未知用户</span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-700">
      <User className="h-4 w-4" />
      <div className="flex flex-col">
        <span className="font-medium">{(currentUser as any)?.name || '未知用户'}</span>
        {(currentUser as any)?.organization_name && (
          <span className="text-xs text-gray-500">{(currentUser as any)?.organization_name}</span>
        )}
      </div>
    </div>
  )
}
