import { useQuery } from '@tanstack/react-query'
import { Users, UserCheck, Building, Menu } from 'lucide-react'
import api from '@/lib/api'
import { adaptBackendResponse, adaptPaginationData } from '@/lib/backend-adapter'
import ApiStatus from '@/components/api-status'

export default function Dashboard() {
  // 获取用户统计
  const { data: usersData } = useQuery({
    queryKey: ['accounts', 'stats'],
    queryFn: async () => {
      try {
        const response = await api.get('/accounts', {
          params: { page_no: 1, page_size: 1 },
        })
        const adapted = adaptBackendResponse(response.data)
        if (adapted.success && adapted.data) {
          const paginationData = adaptPaginationData(adapted.data, 1, 1)
          return paginationData.total
        }
      } catch (error) {
        console.log('获取用户统计失败:', error)
      }
      return 0
    },
    retry: false,
  })

  // 获取角色统计
  const { data: rolesData } = useQuery({
    queryKey: ['roles', 'stats'],
    queryFn: async () => {
      try {
        const response = await api.get('/roles', {
          params: { page_no: 1, page_size: 1 },
        })
        const adapted = adaptBackendResponse(response.data)
        if (adapted.success && adapted.data) {
          const paginationData = adaptPaginationData(adapted.data, 1, 1)
          return paginationData.total
        }
      } catch (error) {
        console.log('获取角色统计失败:', error)
      }
      return 0
    },
  })

  // 获取组织统计
  const { data: organizationsData } = useQuery({
    queryKey: ['organizations', 'stats'],
    queryFn: async () => {
      try {
        const response = await api.get('/organizations/tree', {
          params: { limit_type: 'Root' },
        })
        const adapted = adaptBackendResponse(response.data)
        if (adapted.success && adapted.data) {
          // 根据实际API返回结构，数据在 organizations 字段中
          const organizations = (adapted.data as any)?.organizations || []
          const orgs = Array.isArray(organizations) ? organizations : []
          // 递归计算所有组织数量
          const countOrganizations = (orgList: any[]): number => {
            let count = orgList.length
            orgList.forEach((org) => {
              if (org.children && org.children.length > 0) {
                count += countOrganizations(org.children)
              }
            })
            return count
          }
          return countOrganizations(orgs)
        }
      } catch (error) {
        console.log('获取组织统计失败:', error)
      }
      return 0
    },
  })

  // 获取菜单统计
  const { data: menusData } = useQuery({
    queryKey: ['menus', 'stats'],
    queryFn: async () => {
      try {
        const response = await api.get('/menus')
        const adapted = adaptBackendResponse(response.data)
        if (adapted.success && adapted.data) {
          // 根据实际API返回结构，数据在 menus 字段中
          const menusData = (adapted.data as any)?.menus || []
          const menus = Array.isArray(menusData) ? menusData : []
          return menus.length
        }
      } catch (error) {
        console.log('获取菜单统计失败:', error)
      }
      return 0
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">仪表板</h1>
        <p className="mt-1 text-sm text-gray-600">欢迎使用 Poem Admin 管理系统</p>
      </div>

      {/* API状态检查 */}
      <div className="p-4 bg-white rounded-lg shadow">
        <ApiStatus />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex-1 ml-5 w-0">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">用户总数</dt>
                <dd className="text-lg font-medium text-gray-900">{usersData || 0}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
            <div className="flex-1 ml-5 w-0">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">角色总数</dt>
                <dd className="text-lg font-medium text-gray-900">{rolesData || 0}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Building className="w-8 h-8 text-purple-600" />
            </div>
            <div className="flex-1 ml-5 w-0">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">组织总数</dt>
                <dd className="text-lg font-medium text-gray-900">{organizationsData || 0}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Menu className="w-8 h-8 text-orange-600" />
            </div>
            <div className="flex-1 ml-5 w-0">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">菜单总数</dt>
                <dd className="text-lg font-medium text-gray-900">{menusData || 0}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">系统概览</h3>
          <div className="mt-5">
            <p className="text-sm text-gray-600">
              这是一个基于 React + TypeScript + Tailwind CSS 构建的后台管理系统。
            </p>
            <ul className="mt-3 space-y-1 text-sm text-gray-600">
              <li>• 用户管理：创建、编辑用户信息</li>
              <li>• 角色管理：配置用户角色和权限</li>
              <li>• 组织管理：管理组织架构</li>
              <li>• 菜单管理：配置系统菜单</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
