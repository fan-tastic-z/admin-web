import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  Building,
  MoreHorizontal,
} from 'lucide-react'
import api from '@/lib/api'
import { PaginationParams, User, Organization } from '@/types/api'
import { adaptBackendResponse, adaptPaginationData } from '@/lib/backend-adapter'
import { Modal } from '@/components/ui/dialog'
import AccountForm from '@/components/account-form'
import OrganizationForm from '@/components/organization-form'

export default function AccountPage() {
  const queryClient = useQueryClient()
  const [currentPage] = useState(1)
  const [pageSize] = useState(10)
  const [searchName, setSearchName] = useState('')
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<number | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set())
  const [viewMode, setViewMode] = useState<'users' | 'organization'>('users') // 视图模式

  // 用户相关状态
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false)
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | undefined>()

  // 组织相关状态
  const [isCreateOrgModalOpen, setIsCreateOrgModalOpen] = useState(false)
  const [isEditOrgModalOpen, setIsEditOrgModalOpen] = useState(false)
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | undefined>()

  // 获取组织树
  const { data: organizationTree } = useQuery({
    queryKey: ['organizations', 'tree'],
    queryFn: async () => {
      const response = await api.post('/organizations/tree', { limit_type: 'FirstLevel' })
      const adapted = adaptBackendResponse(response.data)
      if (adapted.success && adapted.data) {
        const organizations = (adapted.data as any)?.organizations || []
        return Array.isArray(organizations) ? organizations : []
      }
      return []
    },
  })

  // 删除组织的mutation
  const deleteOrganizationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/organizations/${id}`)
      return adaptBackendResponse(response.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })

  // 获取用户列表
  const {
    data: usersData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['accounts', currentPage, pageSize, searchName, selectedOrganizationId],
    queryFn: async () => {
      const params: PaginationParams & { account_name?: string; organization_id?: number } = {
        page_no: currentPage,
        page_size: pageSize,
      }
      if (searchName) {
        params.account_name = searchName
      }
      if (selectedOrganizationId) {
        params.organization_id = selectedOrganizationId
      }

      console.log('获取用户列表，参数:', params)
      try {
        const response = await api.get('/accounts', { params })
        console.log('用户列表原始响应:', response.data)

        // 使用适配器处理响应
        const adapted = adaptBackendResponse(response.data)
        if (adapted.success && adapted.data) {
          console.log('适配后的用户数据:', adapted.data)
          return adaptPaginationData(adapted.data, currentPage, pageSize)
        } else {
          console.error('用户数据适配失败:', adapted.error)
          throw new Error(adapted.error || '获取用户数据失败')
        }
      } catch (err: any) {
        console.error('获取用户列表错误:', err)

        // 特殊处理405错误
        if (err.response?.status === 405) {
          throw new Error('用户管理接口暂未实现 (405 Method Not Allowed)')
        }

        throw err
      }
    },
    // 忽略405错误，不重试
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('405')) {
        return false
      }
      return failureCount < 3
    },
  })

  console.log('用户页面最终数据:', usersData)

  // 用户相关处理函数
  const handleCreateUser = () => {
    setIsCreateUserModalOpen(true)
  }

  const handleEditUser = (user: any) => {
    setSelectedUser(user)
    setIsEditUserModalOpen(true)
  }

  // 组织相关处理函数
  const handleCreateOrganization = (parentId?: number) => {
    if (parentId) {
      setSelectedOrganization({ parent_id: parentId } as Organization)
    } else {
      setSelectedOrganization(undefined)
    }
    setIsCreateOrgModalOpen(true)
  }

  const handleEditOrganization = (org: Organization) => {
    setSelectedOrganization(org)
    setIsEditOrgModalOpen(true)
  }

  const handleDeleteOrganization = async (id: number) => {
    if (confirm('确定要删除这个组织吗？')) {
      try {
        await deleteOrganizationMutation.mutateAsync(id)
      } catch (error) {
        console.error('删除组织失败:', error)
      }
    }
  }

  // 关闭模态框
  const handleCloseModal = () => {
    setIsCreateUserModalOpen(false)
    setIsEditUserModalOpen(false)
    setIsCreateOrgModalOpen(false)
    setIsEditOrgModalOpen(false)
    setSelectedUser(undefined)
    setSelectedOrganization(undefined)
  }

  // 表单提交成功
  const handleFormSuccess = () => {
    handleCloseModal()
  }

  // 组织树相关函数
  const toggleNode = (nodeId: number) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  const selectOrganization = (orgId: number | null) => {
    setSelectedOrganizationId(orgId)
    setViewMode('users') // 选择组织时切换到用户视图
  }

  const selectOrganizationForManagement = (org: Organization) => {
    setSelectedOrganization(org)
    setViewMode('organization') // 切换到组织管理视图
  }

  // 递归查找组织名称
  const findOrganizationName = (orgId: number, orgs: any[]): string => {
    for (const org of orgs) {
      if (org.id === orgId) {
        return org.name
      }
      if (org.children && org.children.length > 0) {
        const found = findOrganizationName(orgId, org.children)
        if (found) return found
      }
    }
    return '未知组织'
  }

  const renderOrganizationNode = (org: any, level: number = 0): React.ReactNode => {
    const hasChildren = org.children && org.children.length > 0
    const isExpanded = expandedNodes.has(org.id)
    const isSelected = selectedOrganizationId === org.id
    const isOrgSelected = selectedOrganization?.id === org.id && viewMode === 'organization'

    return (
      <div key={org.id}>
        <div
          className={`group flex items-center rounded px-2 py-1 hover:bg-gray-100 ${
            isSelected ? 'text-indigo-700 bg-indigo-50' : ''
          } ${isOrgSelected ? 'text-green-700 bg-green-50' : ''}`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          <div
            className="flex flex-1 items-center cursor-pointer"
            onClick={() => selectOrganization(org.id)}
          >
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleNode(org.id)
                }}
                className="p-1 mr-1 rounded hover:bg-gray-200"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>
            ) : (
              <div className="mr-1 w-5" />
            )}
            <Building className="mr-2 w-4 h-4 text-gray-400" />
            <span className="text-sm">{org.name}</span>
          </div>

          {/* 组织管理操作按钮 */}
          <div className="opacity-0 transition-opacity group-hover:opacity-100">
            <div className="flex items-center space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleCreateOrganization(org.id)
                }}
                className="p-1 rounded hover:bg-gray-200"
                title="添加子组织"
              >
                <Plus className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  selectOrganizationForManagement(org)
                }}
                className="p-1 rounded hover:bg-gray-200"
                title="管理组织"
              >
                <MoreHorizontal className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div>{org.children.map((child: any) => renderOrganizationNode(child, level + 1))}</div>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 左侧组织树 */}
      <div className="flex flex-col w-80 bg-white border-r border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-gray-900">组织架构</h2>
              <p className="text-sm text-gray-600">选择组织查看用户</p>
            </div>
            <button
              onClick={() => handleCreateOrganization()}
              className="p-2 text-indigo-600 rounded-md hover:bg-indigo-50"
              title="创建根组织"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-4">
          <div className="space-y-1">
            {/* 全部用户选项 */}
            <div
              className={`flex cursor-pointer items-center rounded px-2 py-2 hover:bg-gray-100 ${
                selectedOrganizationId === null ? 'bg-indigo-50 text-indigo-700' : ''
              }`}
              onClick={() => selectOrganization(null)}
            >
              <Building className="mr-2 w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium">全部用户</span>
            </div>
            {/* 组织树 */}
            {organizationTree && organizationTree.length > 0 ? (
              organizationTree.map((org: any) => renderOrganizationNode(org))
            ) : (
              <div className="px-2 py-4 text-sm text-gray-500">暂无组织数据</div>
            )}
          </div>
        </div>
      </div>

      {/* 右侧主内容区 */}
      <div className="flex overflow-hidden flex-col flex-1">
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {viewMode === 'users' ? '用户管理' : '组织管理'}
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                {viewMode === 'users'
                  ? selectedOrganizationId
                    ? `当前组织: ${findOrganizationName(selectedOrganizationId, organizationTree || [])}`
                    : '显示所有用户'
                  : selectedOrganization
                    ? `管理组织: ${selectedOrganization.name}`
                    : '选择组织进行管理'}
              </p>
            </div>
            {viewMode === 'users' && (
              <button
                onClick={handleCreateUser}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md border border-transparent hover:bg-indigo-700"
              >
                <Plus className="mr-2 w-4 h-4" />
                新建用户
              </button>
            )}
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {viewMode === 'users' ? (
            <>
              {/* 搜索栏 */}
              <div className="p-4 bg-white rounded-lg shadow">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="搜索用户名称..."
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      className="block px-3 py-2 w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                    />
                  </div>
                  <button className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                    搜索
                  </button>
                </div>
              </div>

              {/* 错误信息 */}
              {error && (
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <h3 className="font-medium text-orange-800">接口暂未实现</h3>
                  <p className="mt-1 text-sm text-orange-700">{error.toString()}</p>
                  <p className="mt-2 text-xs text-orange-600">
                    当前用户管理接口返回405错误，表示该功能暂未在后端实现。
                  </p>
                </div>
              )}

              {/* 用户列表 */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-4 py-5 sm:p-6">
                  {isLoading ? (
                    <div className="py-4 text-center">加载中...</div>
                  ) : error ? (
                    <div className="py-8 text-center text-gray-500">
                      <p>用户管理功能暂未实现</p>
                      <p className="mt-2 text-xs">请联系开发人员完善用户管理接口</p>
                    </div>
                  ) : usersData?.items && usersData.items.length > 0 ? (
                    <div className="overflow-x-auto">
                      <div className="mb-4 text-sm text-gray-600">共 {usersData.total} 条记录</div>
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              用户名
                            </th>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              邮箱
                            </th>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              组织
                            </th>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              角色
                            </th>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              操作
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {usersData.items.map((user: any) => (
                            <tr key={user.id}>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                                {user.name}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                {user.email || '-'}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                {user.organization_name || '-'}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                {user.role_name || '-'}
                              </td>
                              <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleEditUser(user)}
                                    className="text-indigo-600 hover:text-indigo-900"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button className="text-red-600 hover:text-red-900">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-gray-500">
                      <p>暂无用户数据</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* 组织管理视图 */
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-5 sm:p-6">
                {selectedOrganization ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-900">组织详情</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditOrganization(selectedOrganization)}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50"
                        >
                          <Edit className="mr-2 w-4 h-4" />
                          编辑
                        </button>
                        <button
                          onClick={() => handleDeleteOrganization(selectedOrganization.id!)}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-white rounded-md border border-red-300 hover:bg-red-50"
                        >
                          <Trash2 className="mr-2 w-4 h-4" />
                          删除
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">组织名称</label>
                        <div className="mt-1 text-sm text-gray-900">
                          {selectedOrganization.name}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">组织ID</label>
                        <div className="mt-1 text-sm text-gray-900">{selectedOrganization.id}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">父组织ID</label>
                        <div className="mt-1 text-sm text-gray-900">
                          {selectedOrganization.parent_id || '无（根组织）'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          父组织名称
                        </label>
                        <div className="mt-1 text-sm text-gray-900">
                          {selectedOrganization.parent_name || '无（根组织）'}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    <Building className="mx-auto w-12 h-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">选择组织</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      从左侧组织树中选择一个组织来查看详情
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 创建用户模态框 */}
          <Modal
            isOpen={isCreateUserModalOpen}
            onClose={handleCloseModal}
            title="创建用户"
            className="max-w-2xl"
          >
            <AccountForm onSuccess={handleFormSuccess} onCancel={handleCloseModal} />
          </Modal>

          {/* 编辑用户模态框 */}
          <Modal
            isOpen={isEditUserModalOpen}
            onClose={handleCloseModal}
            title="编辑用户"
            className="max-w-2xl"
          >
            <AccountForm
              user={selectedUser}
              onSuccess={handleFormSuccess}
              onCancel={handleCloseModal}
            />
          </Modal>

          {/* 创建组织模态框 */}
          <Modal
            isOpen={isCreateOrgModalOpen}
            onClose={handleCloseModal}
            title="创建组织"
            className="max-w-2xl"
          >
            <OrganizationForm
              organization={selectedOrganization}
              onSuccess={handleFormSuccess}
              onCancel={handleCloseModal}
            />
          </Modal>

          {/* 编辑组织模态框 */}
          <Modal
            isOpen={isEditOrgModalOpen}
            onClose={handleCloseModal}
            title="编辑组织"
            className="max-w-2xl"
          >
            <OrganizationForm
              organization={selectedOrganization}
              onSuccess={handleFormSuccess}
              onCancel={handleCloseModal}
            />
          </Modal>
        </div>
      </div>
    </div>
  )
}
