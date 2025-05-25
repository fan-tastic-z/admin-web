import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { X, ChevronRight, ChevronDown } from 'lucide-react'
import { useUserMenus, UserMenu } from '@/hooks/use-user-menus'
import { getMenuIcon } from '@/utils/menu-icons'

interface MobileSidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export default function MobileSidebar({ open, setOpen }: MobileSidebarProps) {
  const location = useLocation()
  const { data: userMenuData, isLoading } = useUserMenus()
  const [expandedMenus, setExpandedMenus] = useState<Set<number>>(new Set([998])) // 默认展开用户管理菜单

  // 切换菜单展开状态
  const toggleMenu = (menuId: number) => {
    const newExpanded = new Set(expandedMenus)
    if (newExpanded.has(menuId)) {
      newExpanded.delete(menuId)
    } else {
      newExpanded.add(menuId)
    }
    setExpandedMenus(newExpanded)
  }

  // 渲染菜单项
  const renderMenuItem = (menu: UserMenu, level: number = 0) => {
    const hasChildren = menu.children && menu.children.length > 0
    const isExpanded = expandedMenus.has(menu.id)
    const isActive = location.pathname === menu.path
    const IconComponent = getMenuIcon(menu.icon)

    // 处理菜单项点击
    const handleMenuClick = (e: React.MouseEvent) => {
      if (hasChildren) {
        e.preventDefault() // 阻止链接跳转
        toggleMenu(menu.id) // 切换展开状态
      } else {
        setOpen(false) // 如果没有子菜单，关闭移动端侧边栏
      }
    }

    return (
      <li key={menu.id}>
        <div className="flex items-center">
          {/* 主菜单项 */}
          {hasChildren ? (
            // 有子菜单的项目，点击时展开/折叠
            <button
              onClick={handleMenuClick}
              className={`group flex flex-1 gap-x-3 rounded-md p-2 text-left text-sm font-semibold leading-6 transition-colors ${
                isActive
                  ? 'bg-gray-50 text-indigo-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
              }`}
              style={{ paddingLeft: `${level * 16 + 8}px` }}
            >
              <IconComponent
                className={`h-6 w-6 shrink-0 transition-colors ${
                  isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600'
                }`}
                aria-hidden="true"
              />
              {menu.name}
              {/* 展开/折叠图标 */}
              <div className="ml-auto">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            </button>
          ) : (
            // 没有子菜单的项目，正常链接跳转
            <Link
              to={menu.path || '#'}
              onClick={() => setOpen(false)}
              className={`group flex flex-1 gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 transition-colors ${
                isActive
                  ? 'bg-gray-50 text-indigo-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
              }`}
              style={{ paddingLeft: `${level * 16 + 8}px` }}
            >
              <IconComponent
                className={`h-6 w-6 shrink-0 transition-colors ${
                  isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600'
                }`}
                aria-hidden="true"
              />
              {menu.name}
            </Link>
          )}
        </div>

        {/* 子菜单 */}
        {hasChildren && isExpanded && (
          <ul className="mt-1 space-y-1">
            {menu.children!.map((child) => renderMenuItem(child, level + 1))}
          </ul>
        )}
      </li>
    )
  }

  return (
    <div
      className={`relative z-50 transition-opacity duration-300 lg:hidden ${
        open ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      role="dialog"
      aria-modal="true"
    >
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300"
        onClick={() => setOpen(false)}
      />

      {/* 侧边栏面板 */}
      <div className="fixed inset-0 flex">
        <div
          className={`relative mr-16 flex w-full max-w-xs flex-1 transform transition-transform duration-300 ease-in-out ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* 关闭按钮 */}
          <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5 hover:bg-gray-800/20"
              onClick={() => setOpen(false)}
            >
              <span className="sr-only">关闭侧边栏</span>
              <X className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>

          {/* 侧边栏内容 */}
          <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 shadow-xl">
            <div className="flex h-16 shrink-0 items-center">
              <h1 className="text-xl font-bold text-gray-900">Poem Admin</h1>
            </div>
            <nav className="flex flex-1 flex-col">
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                <li>
                  <ul role="list" className="-mx-2 space-y-1">
                    {isLoading ? (
                      <li className="flex items-center justify-center py-4">
                        <div className="text-sm text-gray-500">加载菜单中...</div>
                      </li>
                    ) : userMenuData?.menus && userMenuData.menus.length > 0 ? (
                      userMenuData.menus.map((menu) => renderMenuItem(menu))
                    ) : (
                      <li className="flex items-center justify-center py-4">
                        <div className="text-sm text-gray-500">暂无菜单权限</div>
                      </li>
                    )}
                  </ul>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>
  )
}
