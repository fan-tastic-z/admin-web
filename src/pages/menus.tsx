import { useQuery } from '@tanstack/react-query'
import { Plus, Edit, Trash2, Menu as MenuIcon } from 'lucide-react'
import api from '@/lib/api'
import { Menu } from '@/types/api'
import { adaptBackendResponse } from '@/lib/backend-adapter'

export default function MenuPage() {
  // 获取菜单列表
  const {
    data: menus,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['menus'],
    queryFn: async () => {
      console.log('获取菜单列表')
      const response = await api.get('/menus')
      console.log('菜单列表原始响应:', response.data)

      // 使用适配器处理响应
      const adapted = adaptBackendResponse(response.data)
      if (adapted.success && adapted.data) {
        console.log('适配后的菜单数据:', adapted.data)
        // 根据实际API返回结构，数据在 menus 字段中
        const menusData = (adapted.data as any)?.menus || []
        console.log('提取的菜单列表:', menusData)
        // 转换字段名以匹配我们的类型定义
        const convertedMenus = Array.isArray(menusData)
          ? menusData.map((menu: any) => ({
              menu_id: menu.id,
              menu_name: menu.name,
              parent_id: menu.parent_id,
              path: menu.path,
              icon: menu.icon,
              sort: menu.sort,
              children: menu.children,
            }))
          : []
        return convertedMenus
      } else {
        console.error('菜单数据适配失败:', adapted.error)
        throw new Error(adapted.error || '获取菜单数据失败')
      }
    },
  })

  console.log('菜单页面最终数据:', menus)

  // 构建菜单树结构
  const buildMenuTree = (menuList: Menu[]): Menu[] => {
    if (!menuList || !Array.isArray(menuList)) return []

    const menuMap = new Map<number, Menu & { children: Menu[] }>()
    const rootMenus: (Menu & { children: Menu[] })[] = []

    // 初始化所有菜单
    menuList.forEach((menu) => {
      menuMap.set(menu.menu_id, { ...menu, children: [] })
    })

    // 构建树结构
    menuList.forEach((menu) => {
      const menuItem = menuMap.get(menu.menu_id)!
      if (menu.parent_id && menuMap.has(menu.parent_id)) {
        menuMap.get(menu.parent_id)!.children.push(menuItem)
      } else {
        rootMenus.push(menuItem)
      }
    })

    return rootMenus
  }

  const menuTree = buildMenuTree(menus || [])

  const renderMenuItem = (menu: Menu & { children?: Menu[] }, level: number = 0) => {
    return (
      <div key={menu.menu_id}>
        <div
          className="flex items-center border-b border-gray-200 px-4 py-3 hover:bg-gray-50"
          style={{ paddingLeft: `${level * 20 + 16}px` }}
        >
          <MenuIcon className="mr-3 h-4 w-4 text-gray-400" />
          <div className="flex flex-1 items-center justify-between">
            <div className="flex flex-1 items-center space-x-4">
              <span className="text-sm font-medium text-gray-900">{menu.menu_name}</span>
              <span className="text-xs text-gray-500">ID: {menu.menu_id}</span>
              {menu.path && <span className="text-xs text-blue-600">{menu.path}</span>}
              {menu.icon && <span className="text-xs text-green-600">图标: {menu.icon}</span>}
              {menu.sort !== undefined && (
                <span className="text-xs text-purple-600">排序: {menu.sort}</span>
              )}
            </div>
            <div className="flex space-x-2">
              <button className="text-indigo-600 hover:text-indigo-900">
                <Edit className="h-4 w-4" />
              </button>
              <button className="text-red-600 hover:text-red-900">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        {menu.children && menu.children.length > 0 && (
          <div>{menu.children.map((child) => renderMenuItem(child, level + 1))}</div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">菜单管理</h1>
          <p className="mt-1 text-sm text-gray-600">管理系统菜单和导航结构</p>
        </div>
        <button className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          <Plus className="mr-2 h-4 w-4" />
          新建菜单
        </button>
      </div>

      {/* 错误信息 */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h3 className="font-medium text-red-800">请求错误</h3>
          <p className="mt-1 text-sm text-red-700">{error.toString()}</p>
        </div>
      )}

      {/* 菜单列表 */}
      <div className="rounded-lg bg-white shadow">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="mb-4 text-lg font-medium leading-6 text-gray-900">菜单结构</h3>
          {isLoading ? (
            <div className="py-4 text-center">加载中...</div>
          ) : error ? (
            <div className="py-8 text-center text-gray-500">
              <p>获取菜单数据失败</p>
            </div>
          ) : menuTree && menuTree.length > 0 ? (
            <div>
              <div className="mb-4 text-sm text-gray-600">
                共 {menus?.length || 0} 个菜单项，{menuTree.length} 个根菜单
              </div>
              <div className="rounded-md border border-gray-200">
                {menuTree.map((menu) => renderMenuItem(menu))}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <p>暂无菜单数据</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
