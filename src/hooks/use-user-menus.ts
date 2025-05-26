import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { adaptBackendResponse } from '@/lib/backend-adapter'

export interface UserMenu {
  id: number
  name: string
  path?: string
  icon?: string
  sort_order?: number
  parent_id?: number
  selected: boolean
  partial_selected: boolean
  is_authorized: boolean
  children?: UserMenu[]
}

// 将菜单名称映射到路径的函数
function getMenuPath(menuName: string): string {
  const pathMap: Record<string, string> = {
    仪表板: '/dashboard',
    用户管理: '/accounts',
    用户设置: '/accounts',
    角色管理: '/roles',
    角色设置: '/roles',
    组织管理: '/accounts',
    菜单管理: '/menus',
    用户操作日志: '/operation-logs',
    系统设置: '/settings',
    权限管理: '/permissions',
  }

  return pathMap[menuName] || '#'
}

// 将菜单名称映射到图标的函数
function getMenuIconName(menuName: string): string {
  const iconMap: Record<string, string> = {
    仪表板: 'home',
    用户管理: 'users',
    用户设置: 'users',
    角色管理: 'user-check',
    角色设置: 'user-check',
    组织管理: 'building',
    菜单管理: 'menu',
    用户操作日志: 'file-text',
    系统设置: 'settings',
    权限管理: 'shield',
  }

  return iconMap[menuName] || 'menu'
}

// 默认菜单配置（用于admin用户或权限配置异常时的后备方案）
function getDefaultMenus(): UserMenu[] {
  return [
    {
      id: 999,
      name: '仪表板',
      path: '/dashboard',
      icon: 'home',
      selected: false,
      partial_selected: false,
      is_authorized: true,
      children: [],
    },
    {
      id: 998,
      name: '用户管理',
      path: '/accounts',
      icon: 'users',
      selected: false,
      partial_selected: false,
      is_authorized: true,
      children: [
        {
          id: 995,
          name: '用户设置',
          path: '/accounts',
          icon: 'users',
          selected: false,
          partial_selected: false,
          is_authorized: true,
          children: [],
        },
        {
          id: 994,
          name: '角色设置',
          path: '/roles',
          icon: 'user-check',
          selected: false,
          partial_selected: false,
          is_authorized: true,
          children: [],
        },
        {
          id: 993,
          name: '用户操作日志',
          path: '/operation-logs',
          icon: 'file-text',
          selected: false,
          partial_selected: false,
          is_authorized: true,
          children: [],
        },
      ],
    },
    {
      id: 996,
      name: '菜单管理',
      path: '/menus',
      icon: 'menu',
      selected: false,
      partial_selected: false,
      is_authorized: true,
      children: [],
    },
  ]
}

// 递归处理菜单数据，保持层级结构
function processMenus(menus: any[], isAdmin: boolean = false): UserMenu[] {
  const result: UserMenu[] = []

  function processMenuItem(menu: any): UserMenu | null {
    // 对于admin用户，忽略权限检查；对于普通用户，检查权限
    const hasPermission = isAdmin || menu.is_authorized

    if (!hasPermission) {
      return null
    }

    const processedMenu: UserMenu = {
      id: menu.id,
      name: menu.name,
      path: getMenuPath(menu.name),
      icon: getMenuIconName(menu.name),
      selected: menu.selected,
      partial_selected: menu.partial_selected,
      is_authorized: menu.is_authorized,
      children: [],
    }

    // 递归处理子菜单
    if (menu.children && menu.children.length > 0) {
      const processedChildren: UserMenu[] = []
      for (const child of menu.children) {
        const processedChild = processMenuItem(child)
        if (processedChild) {
          processedChildren.push(processedChild)
        }
      }
      processedMenu.children = processedChildren
    }

    return processedMenu
  }

  for (const menu of menus) {
    const processedMenu = processMenuItem(menu)
    if (processedMenu) {
      result.push(processedMenu)
    }
  }

  return result
}

export function useUserMenus() {
  return useQuery({
    queryKey: ['accounts', 'current'],
    queryFn: async () => {
      const response = await api.get('/accounts/current')
      const adapted = adaptBackendResponse(response.data)
      if (adapted.success && adapted.data) {
        const userData = adapted.data as any
        const isAdmin = userData.name === 'admin' || userData.role_name === 'admin'

        // 从用户数据中提取菜单权限
        const rawMenus = userData.menus || []
        let processedMenus = processMenus(rawMenus, isAdmin)

        // 如果没有处理出任何菜单，且是admin用户，使用默认菜单
        if (processedMenus.length === 0 && isAdmin) {
          processedMenus = getDefaultMenus()
        }

        console.log('原始菜单数据:', rawMenus)
        console.log('处理后的菜单数据:', processedMenus)
        console.log('是否为admin用户:', isAdmin)
        console.log('用户数据:', userData)

        return {
          user: userData,
          menus: processedMenus,
        }
      }
      return { user: null, menus: [] }
    },
    retry: false,
  })
}
