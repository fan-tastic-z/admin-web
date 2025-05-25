import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { useUserMenus, UserMenu } from '@/hooks/use-user-menus'
import { getMenuIcon } from '@/utils/menu-icons'

export default function Sidebar() {
  const location = useLocation()
  const { data: userMenuData, isLoading } = useUserMenus()
  const [expandedMenus, setExpandedMenus] = useState<Set<number>>(new Set([998])) // 默认展开用户管理菜单

  // 如果正在加载或没有菜单数据，显示加载状态
  if (isLoading || !userMenuData?.menus) {
    return (
      <div className="hidden md:fixed md:inset-y-0 md:z-50 md:flex md:w-64 md:flex-col">
        <div className="flex overflow-y-auto flex-col gap-y-5 px-6 bg-white border-r border-gray-200 grow">
          <div className="flex items-center h-16 shrink-0">
            <h1 className="text-xl font-bold text-gray-900">Poem Admin</h1>
          </div>
          <div className="flex flex-1 justify-center items-center">
            <div className="text-sm text-gray-500">加载菜单中...</div>
          </div>
        </div>
      </div>
    )
  }

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
      }
      // 如果没有子菜单，让链接正常跳转
    }

    return (
      <li key={menu.id}>
        <div className="flex items-center">
          {/* 主菜单项 */}
          {hasChildren ? (
            // 有子菜单的项目，点击时展开/折叠
            <button
              onClick={handleMenuClick}
              className={`group flex flex-1 gap-x-3 rounded-md p-2 text-left text-sm font-semibold leading-6 ${
                isActive
                  ? 'text-indigo-600 bg-gray-50'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
              }`}
              style={{ paddingLeft: `${level * 16 + 8}px` }}
            >
              <IconComponent
                className={`h-6 w-6 shrink-0 ${
                  isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600'
                }`}
                aria-hidden="true"
              />
              {menu.name}
              {/* 展开/折叠图标 */}
              <div className="ml-auto">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </div>
            </button>
          ) : (
            // 没有子菜单的项目，正常链接跳转
            <Link
              to={menu.path || '#'}
              className={`group flex flex-1 gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 ${
                isActive
                  ? 'text-indigo-600 bg-gray-50'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
              }`}
              style={{ paddingLeft: `${level * 16 + 8}px` }}
            >
              <IconComponent
                className={`h-6 w-6 shrink-0 ${
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
    <div className="hidden md:fixed md:inset-y-0 md:z-50 md:flex md:w-64 md:flex-col">
      <div className="flex overflow-y-auto flex-col gap-y-5 px-6 bg-white border-r border-gray-200 grow">
        <div className="flex items-center h-16 shrink-0">
          <h1 className="text-xl font-bold text-gray-900">Poem Admin</h1>
        </div>
        <nav className="flex flex-col flex-1">
          <ul role="list" className="flex flex-col flex-1 gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {userMenuData.menus.map((menu) => renderMenuItem(menu))}
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  )
}
