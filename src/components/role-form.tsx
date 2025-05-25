import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, X, ChevronRight, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import api from '@/lib/api'
import { adaptBackendResponse } from '@/lib/backend-adapter'
import { CreateRoleRequest, Role } from '@/types/api'

// 表单验证 schema
const roleFormSchema = z.object({
  name: z.string().min(1, '角色名称不能为空').max(50, '角色名称不能超过50个字符'),
  description: z.string().optional(),
  is_deleteable: z.boolean().default(true),
  menus: z
    .array(
      z.object({
        menu_id: z.number(),
        menu_name: z.string(),
      })
    )
    .default([]),
})

type RoleFormData = z.infer<typeof roleFormSchema>

interface RoleFormProps {
  role?: Role
  onSuccess: () => void
  onCancel: () => void
}

export default function RoleForm({ role, onSuccess, onCancel }: RoleFormProps) {
  const queryClient = useQueryClient()
  const isEditing = !!role
  const [expandedMenus, setExpandedMenus] = useState<Set<number>>(new Set())

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: role?.name || '',
      description: role?.description || '',
      is_deleteable: role?.is_deleteable ?? true,
      menus: role?.menus || [],
    },
  })

  const selectedMenus = watch('menus')

  // 获取菜单列表
  const { data: menus } = useQuery({
    queryKey: ['menus'],
    queryFn: async () => {
      const response = await api.get('/menus')
      const adapted = adaptBackendResponse(response.data)
      if (adapted.success && adapted.data) {
        // 根据实际API返回结构，数据在 menus 字段中
        const menusData = (adapted.data as any)?.menus || []
        // 递归转换菜单数据，包括子菜单
        const convertMenu = (menu: any): any => ({
          menu_id: menu.id,
          menu_name: menu.name,
          parent_id: menu.parent_id,
          path: menu.path,
          icon: menu.icon,
          sort: menu.sort,
          children: menu.children ? menu.children.map(convertMenu) : [],
        })
        const convertedMenus = Array.isArray(menusData) ? menusData.map(convertMenu) : []
        return convertedMenus
      }
      return []
    },
  })

  // 创建角色
  const createRoleMutation = useMutation({
    mutationFn: async (data: CreateRoleRequest) => {
      const response = await api.post('/roles', data)
      return response.data
    },
    onSuccess: () => {
      // 刷新角色列表数据
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      // 刷新统计数据
      queryClient.invalidateQueries({ queryKey: ['roles', 'stats'] })
      onSuccess()
    },
  })

  // 更新角色 (假设有更新接口)
  const updateRoleMutation = useMutation({
    mutationFn: async (data: CreateRoleRequest & { id: number }) => {
      const response = await api.put(`/roles/${data.id}`, data)
      return response.data
    },
    onSuccess: () => {
      // 刷新角色列表数据
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      // 刷新统计数据
      queryClient.invalidateQueries({ queryKey: ['roles', 'stats'] })
      // 刷新特定角色详情
      queryClient.invalidateQueries({ queryKey: ['roles', role?.id] })
      onSuccess()
    },
  })

  const onSubmit: SubmitHandler<RoleFormData> = async (data) => {
    try {
      const payload: CreateRoleRequest = {
        name: data.name,
        description: data.description,
        is_deleteable: data.is_deleteable,
        menus: data.menus,
      }

      if (isEditing && role) {
        await updateRoleMutation.mutateAsync({ ...payload, id: role.id })
      } else {
        await createRoleMutation.mutateAsync(payload)
      }
    } catch (error) {
      console.error('提交角色表单失败:', error)
    }
  }

  const toggleMenu = (menu: any) => {
    const isSelected = selectedMenus.some((m) => m.menu_id === menu.menu_id)

    // 获取所有子菜单（递归）
    const getAllChildMenus = (menuItem: any): any[] => {
      let result = [{ menu_id: menuItem.menu_id, menu_name: menuItem.menu_name }]
      if (menuItem.children && menuItem.children.length > 0) {
        menuItem.children.forEach((child: any) => {
          result = result.concat(getAllChildMenus(child))
        })
      }
      return result
    }

    // 检查所有子菜单是否都被选中
    const areAllChildrenSelected = (menuItem: any, currentSelected: any[]): boolean => {
      if (!menuItem.children || menuItem.children.length === 0) {
        return true
      }
      return menuItem.children.every((child: any) =>
        currentSelected.some((m) => m.menu_id === child.menu_id)
      )
    }

    // 更新父菜单选择状态
    const updateParentSelection = (newSelectedMenus: any[]): any[] => {
      let updated = [...newSelectedMenus]
      let hasChanges = true

      while (hasChanges) {
        hasChanges = false
        const allMenuIds = new Set(updated.map((m) => m.menu_id))

        // 遍历所有菜单，检查父菜单状态
        const checkMenuRecursively = (menus: any[]) => {
          menus.forEach((menuItem) => {
            if (menuItem.children && menuItem.children.length > 0) {
              const isParentSelected = allMenuIds.has(menuItem.menu_id)
              const shouldParentBeSelected = areAllChildrenSelected(menuItem, updated)

              if (!isParentSelected && shouldParentBeSelected) {
                // 父菜单应该被选中
                updated.push({ menu_id: menuItem.menu_id, menu_name: menuItem.menu_name })
                hasChanges = true
              } else if (isParentSelected && !shouldParentBeSelected) {
                // 父菜单应该被取消选中
                updated = updated.filter((m) => m.menu_id !== menuItem.menu_id)
                hasChanges = true
              }

              // 递归检查子菜单
              checkMenuRecursively(menuItem.children)
            }
          })
        }

        checkMenuRecursively(menuTree)
      }

      return updated
    }

    let newSelectedMenus = [...selectedMenus]

    if (isSelected) {
      // 取消选择：移除当前菜单及其所有子菜单
      const allMenusToRemove = getAllChildMenus(menu)
      const menuIdsToRemove = new Set(allMenusToRemove.map((m) => m.menu_id))
      newSelectedMenus = newSelectedMenus.filter((m) => !menuIdsToRemove.has(m.menu_id))
    } else {
      // 选择：添加当前菜单及其所有子菜单
      const allMenusToAdd = getAllChildMenus(menu)
      const existingMenuIds = new Set(newSelectedMenus.map((m) => m.menu_id))
      const newMenus = allMenusToAdd.filter((m) => !existingMenuIds.has(m.menu_id))
      newSelectedMenus = [...newSelectedMenus, ...newMenus]
    }

    // 更新父菜单的选择状态
    const finalSelectedMenus = updateParentSelection(newSelectedMenus)
    setValue('menus', finalSelectedMenus)
  }

  const toggleExpand = (menuId: number) => {
    const newExpanded = new Set(expandedMenus)
    if (newExpanded.has(menuId)) {
      newExpanded.delete(menuId)
    } else {
      newExpanded.add(menuId)
    }
    setExpandedMenus(newExpanded)
  }

  // 构建菜单树结构
  const buildMenuTree = (menuList: any[]): any[] => {
    if (!menuList || !Array.isArray(menuList)) return []

    // 如果菜单数据已经包含 children 字段，直接返回
    if (menuList.some((menu) => menu.children)) {
      return menuList
    }

    // 否则根据 parent_id 构建树结构
    const menuMap = new Map<number, any>()
    const rootMenus: any[] = []

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

  // 获取所有有子菜单的菜单ID
  const getAllParentMenuIds = (menuList: any[]): number[] => {
    const parentIds: number[] = []
    const traverse = (menus: any[]) => {
      menus.forEach((menu) => {
        if (menu.children && menu.children.length > 0) {
          parentIds.push(menu.menu_id)
          traverse(menu.children)
        }
      })
    }
    traverse(menuList)
    return parentIds
  }

  const renderMenuNode = (menu: any, level: number = 0): React.ReactNode => {
    const hasChildren = menu.children && menu.children.length > 0
    const isExpanded = expandedMenus.has(menu.menu_id)
    const isSelected = selectedMenus.some((m) => m.menu_id === menu.menu_id)

    return (
      <div key={menu.menu_id}>
        <div className="flex items-center py-2" style={{ paddingLeft: `${level * 20}px` }}>
          <div className="flex flex-1 items-center">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpand(menu.menu_id)}
                className="mr-2 rounded p-1 hover:bg-gray-100"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <div className="mr-2 w-6" />
            )}
            <input
              type="checkbox"
              id={`menu-${menu.menu_id}`}
              checked={isSelected}
              onChange={() => toggleMenu(menu)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label
              htmlFor={`menu-${menu.menu_id}`}
              className="ml-2 block cursor-pointer text-sm text-gray-700"
            >
              {menu.menu_name}
            </label>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div>{menu.children.map((child: any) => renderMenuNode(child, level + 1))}</div>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 角色名称 */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          角色名称 <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          {...register('name')}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          placeholder="请输入角色名称"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>

      {/* 角色描述 */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          角色描述
        </label>
        <textarea
          id="description"
          rows={3}
          {...register('description')}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          placeholder="请输入角色描述（可选）"
        />
      </div>

      {/* 是否可删除 */}
      <div className="flex items-center">
        <input
          id="is_deleteable"
          type="checkbox"
          {...register('is_deleteable')}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor="is_deleteable" className="ml-2 block text-sm text-gray-700">
          允许删除此角色
        </label>
      </div>

      {/* 菜单权限 */}
      <div>
        <label className="mb-3 block text-sm font-medium text-gray-700">菜单权限</label>
        <div className="max-h-60 overflow-y-auto rounded-md border border-gray-200 p-3">
          {menuTree && menuTree.length > 0 ? (
            <div className="space-y-1">{menuTree.map((menu: any) => renderMenuNode(menu, 0))}</div>
          ) : (
            <p className="text-sm text-gray-500">暂无菜单数据</p>
          )}
        </div>
        {selectedMenus.length > 0 && (
          <p className="mt-2 text-sm text-gray-600">已选择 {selectedMenus.length} 个菜单</p>
        )}
        <div className="mt-2 flex space-x-2">
          <button
            type="button"
            onClick={() => setExpandedMenus(new Set(getAllParentMenuIds(menuTree)))}
            className="text-xs text-indigo-600 hover:text-indigo-800"
          >
            全部展开
          </button>
          <button
            type="button"
            onClick={() => setExpandedMenus(new Set())}
            className="text-xs text-gray-600 hover:text-gray-800"
          >
            全部收起
          </button>
        </div>
      </div>

      {/* 表单按钮 */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <X className="mr-2 h-4 w-4" />
          取消
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="mr-2 h-4 w-4" />
          {isSubmitting ? '保存中...' : isEditing ? '更新角色' : '创建角色'}
        </button>
      </div>
    </form>
  )
}
