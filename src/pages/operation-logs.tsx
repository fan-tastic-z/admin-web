import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Clock, User, Monitor, CheckCircle, XCircle } from 'lucide-react'
import api from '@/lib/api'
import { adaptBackendResponse, adaptPaginationData } from '@/lib/backend-adapter'
import { OperationLog } from '@/types/api'

export default function OperationLogsPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)

  // 获取操作日志列表
  const {
    data: logsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['operation-logs', currentPage, pageSize],
    queryFn: async () => {
      const response = await api.get('/operation-logs', {
        params: {
          page_no: currentPage,
          page_size: pageSize,
        },
      })

      console.log('操作日志原始响应:', response.data)

      const adapted = adaptBackendResponse(response.data)
      if (adapted.success && adapted.data) {
        console.log('适配后的操作日志数据:', adapted.data)
        return adaptPaginationData(adapted.data, currentPage, pageSize)
      } else {
        console.error('操作日志数据适配失败:', adapted.error)
        throw new Error(adapted.error || '获取操作日志失败')
      }
    },
  })

  // 格式化时间
  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  // 获取操作结果图标和样式
  const getResultIcon = (result: string) => {
    if (result === 'SUCCESS') {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    } else {
      return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getResultBadge = (result: string) => {
    if (result === 'SUCCESS') {
      return (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
          成功
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
          失败
        </span>
      )
    }
  }

  // 获取操作类型的中文显示
  const getOperationTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      CREATE: '创建',
      UPDATE: '更新',
      DELETE: '删除',
      LOGIN: '登录',
      LOGOUT: '登出',
      VIEW: '查看',
    }
    return typeMap[type] || type
  }

  // 获取操作模块的中文显示
  const getOperationModuleText = (module: string) => {
    const moduleMap: Record<string, string> = {
      organization: '组织管理',
      role: '角色管理',
      account: '用户管理',
      menu: '菜单管理',
      auth: '认证',
    }
    return moduleMap[module] || module
  }

  // 分页处理
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const renderPagination = () => {
    if (!logsData || logsData.totalPages <= 1) return null

    const pages = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(logsData.totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return (
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            上一页
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === logsData.totalPages}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            下一页
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              显示第 <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> 到{' '}
              <span className="font-medium">
                {Math.min(currentPage * pageSize, logsData.total)}
              </span>{' '}
              条，共 <span className="font-medium">{logsData.total}</span> 条记录
            </p>
          </div>
          <div>
            <nav
              className="isolate inline-flex -space-x-px rounded-md shadow-sm"
              aria-label="Pagination"
            >
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
              >
                上一页
              </button>
              {pages.map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                    page === currentPage
                      ? 'z-10 bg-indigo-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                      : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === logsData.totalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
              >
                下一页
              </button>
            </nav>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">用户操作日志</h1>
        <p className="mt-1 text-sm text-gray-600">查看系统中所有用户的操作记录</p>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="truncate text-sm font-medium text-gray-500">总操作数</dt>
                <dd className="text-lg font-medium text-gray-900">{logsData?.total || 0}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="truncate text-sm font-medium text-gray-500">成功操作</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {logsData?.items?.filter(
                    (log: OperationLog) => log.operation_result === 'SUCCESS'
                  ).length || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="truncate text-sm font-medium text-gray-500">失败操作</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {logsData?.items?.filter((log: OperationLog) => log.operation_result === 'FAILED')
                    .length || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* 操作日志列表 */}
      <div className="rounded-lg bg-white shadow">
        <div className="px-4 py-5 sm:p-6">
          {isLoading ? (
            <div className="py-8 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
              <p className="mt-2 text-sm text-gray-600">加载中...</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center text-red-600">
              <XCircle className="mx-auto h-12 w-12 text-red-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">加载失败</h3>
              <p className="mt-1 text-sm text-gray-500">{error.toString()}</p>
            </div>
          ) : logsData?.items && logsData.items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      操作时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      操作用户
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      操作类型
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      操作模块
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      操作描述
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      操作结果
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      IP地址
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {logsData.items.map((log: OperationLog) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        <div className="flex items-center">
                          <User className="mr-2 h-4 w-4 text-gray-400" />
                          {log.account_name}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                          {getOperationTypeText(log.operation_type)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                          {getOperationModuleText(log.operation_module)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate" title={log.operation_description}>
                          {log.operation_description}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        <div className="flex items-center">
                          {getResultIcon(log.operation_result)}
                          <span className="ml-2">{getResultBadge(log.operation_result)}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Monitor className="mr-2 h-4 w-4 text-gray-400" />
                          {log.ip_address}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <Clock className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">暂无操作日志</h3>
              <p className="mt-1 text-sm text-gray-500">系统中还没有任何操作记录</p>
            </div>
          )}
        </div>

        {/* 分页 */}
        {renderPagination()}
      </div>
    </div>
  )
}
