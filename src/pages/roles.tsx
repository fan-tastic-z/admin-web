import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Edit, Trash2 } from 'lucide-react'
import api from '@/lib/api'
import { PaginationParams, Role } from '@/types/api'
import { adaptBackendResponse, adaptPaginationData } from '@/lib/backend-adapter'
import { Modal } from '@/components/ui/dialog'
import RoleForm from '@/components/role-form'

export default function RolePage() {
  const [currentPage] = useState(1)
  const [pageSize] = useState(10)
  const [searchName, setSearchName] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | undefined>()

  // 获取角色列表
  const {
    data: rolesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['roles', currentPage, pageSize, searchName],
    queryFn: async () => {
      const params: PaginationParams & { name?: string } = {
        page_no: currentPage,
        page_size: pageSize,
      }
      if (searchName) {
        params.name = searchName
      }

      console.log('获取角色列表，参数:', params)
      const response = await api.get('/roles', { params })
      console.log('角色列表原始响应:', response.data)

      // 使用适配器处理响应
      const adapted = adaptBackendResponse(response.data)
      if (adapted.success && adapted.data) {
        console.log('适配后的角色数据:', adapted.data)
        return adaptPaginationData(adapted.data, currentPage, pageSize)
      } else {
        console.error('角色数据适配失败:', adapted.error)
        throw new Error(adapted.error || '获取角色数据失败')
      }
    },
  })

  console.log('角色页面最终数据:', rolesData)

  // 处理创建角色
  const handleCreateRole = () => {
    setIsCreateModalOpen(true)
  }

  // 处理编辑角色
  const handleEditRole = (role: any) => {
    setSelectedRole(role)
    setIsEditModalOpen(true)
  }

  // 关闭模态框
  const handleCloseModal = () => {
    setIsCreateModalOpen(false)
    setIsEditModalOpen(false)
    setSelectedRole(undefined)
  }

  // 表单提交成功
  const handleFormSuccess = () => {
    handleCloseModal()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">角色管理</h1>
          <p className="mt-1 text-sm text-gray-600">管理系统角色和权限</p>
        </div>
        <button
          onClick={handleCreateRole}
          className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          新建角色
        </button>
      </div>

      {/* 搜索栏 */}
      <div className="rounded-lg bg-white p-4 shadow">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="搜索角色名称..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            />
          </div>
          <button className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">
            搜索
          </button>
        </div>
      </div>

      {/* 调试信息 */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h3 className="font-medium text-red-800">请求错误</h3>
          <p className="mt-1 text-sm text-red-700">{error.toString()}</p>
        </div>
      )}

      {/* 角色列表 */}
      <div className="rounded-lg bg-white shadow">
        <div className="px-4 py-5 sm:p-6">
          {isLoading ? (
            <div className="py-4 text-center">加载中...</div>
          ) : rolesData?.items && rolesData.items.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="mb-4 text-sm text-gray-600">共 {rolesData.total} 条记录</div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      角色名称
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      描述
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      创建者
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      可删除
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {rolesData.items.map((role: any) => (
                    <tr key={role.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {role.id}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        {role.name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {role.description || '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {role.created_by_name || role.created_by || '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {role.is_deleteable ? '是' : '否'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditRole(role)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {role.is_deleteable && (
                            <button className="text-red-600 hover:text-red-900">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <p>暂无角色数据</p>
              {rolesData && (
                <p className="mt-2 text-xs">调试：获取到 {rolesData.items?.length || 0} 条记录</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 创建角色模态框 */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        title="创建角色"
        className="max-w-2xl"
      >
        <RoleForm onSuccess={handleFormSuccess} onCancel={handleCloseModal} />
      </Modal>

      {/* 编辑角色模态框 */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        title="编辑角色"
        className="max-w-2xl"
      >
        <RoleForm role={selectedRole} onSuccess={handleFormSuccess} onCancel={handleCloseModal} />
      </Modal>
    </div>
  )
}
