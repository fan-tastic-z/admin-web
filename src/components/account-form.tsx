import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, X } from 'lucide-react'
import api from '@/lib/api'
import { adaptBackendResponse } from '@/lib/backend-adapter'
import { CreateAccountRequest, User } from '@/types/api'

// 表单验证 schema
const accountFormSchema = z.object({
  name: z.string().min(1, '用户名不能为空').max(50, '用户名不能超过50个字符'),
  password: z.string().min(6, '密码至少6个字符').optional(),
  email: z.string().email('请输入有效的邮箱地址').optional().or(z.literal('')),
  organization_id: z.number().min(1, '请选择组织'),
  role_id: z.number().min(1, '请选择角色'),
})

type AccountFormData = z.infer<typeof accountFormSchema>

interface AccountFormProps {
  user?: User
  onSuccess: () => void
  onCancel: () => void
}

export default function AccountForm({ user, onSuccess, onCancel }: AccountFormProps) {
  const queryClient = useQueryClient()
  const isEditing = !!user

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      organization_id: user?.organization_id || 0,
      role_id: user?.role_id || 0,
    },
  })

  // 获取组织列表
  const { data: organizations } = useQuery({
    queryKey: ['organizations', 'tree'],
    queryFn: async () => {
      const response = await api.post('/organizations/tree', { limit_type: 'Root' })
      const adapted = adaptBackendResponse(response.data)
      if (adapted.success && adapted.data) {
        // 根据实际API返回结构，数据在 organizations 字段中
        const organizations = (adapted.data as any)?.organizations || []
        return Array.isArray(organizations) ? organizations : []
      }
      return []
    },
  })

  // 获取角色列表
  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await api.get('/roles', {
        params: { page_no: 1, page_size: 100 },
      })
      const adapted = adaptBackendResponse(response.data)
      if (adapted.success && adapted.data) {
        const paginationData = adapted.data as any
        return paginationData?.data || []
      }
      return []
    },
  })

  // 创建用户
  const createAccountMutation = useMutation({
    mutationFn: async (data: CreateAccountRequest) => {
      const response = await api.post('/accounts', data)
      return response.data
    },
    onSuccess: () => {
      // 刷新用户列表数据
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      // 刷新统计数据
      queryClient.invalidateQueries({ queryKey: ['accounts', 'stats'] })
      onSuccess()
    },
  })

  // 更新用户 (假设有更新接口)
  const updateAccountMutation = useMutation({
    mutationFn: async (data: CreateAccountRequest & { id: number }) => {
      const response = await api.put(`/accounts/${data.id}`, data)
      return response.data
    },
    onSuccess: () => {
      // 刷新用户列表数据
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      // 刷新统计数据
      queryClient.invalidateQueries({ queryKey: ['accounts', 'stats'] })
      // 刷新特定用户详情
      queryClient.invalidateQueries({ queryKey: ['accounts', user?.id] })
      onSuccess()
    },
  })

  const onSubmit: SubmitHandler<AccountFormData> = async (data) => {
    try {
      // 查找选中的组织名称
      const selectedOrganization = flatOrganizations.find((org) => org.id === data.organization_id)
      const organizationName = selectedOrganization?.name || ''

      // 查找选中的角色名称
      const selectedRole = roles?.find((role: any) => role.id === data.role_id)
      const roleName = selectedRole?.name || ''

      const payload: CreateAccountRequest = {
        name: data.name,
        password: data.password || '',
        email: data.email,
        organization_id: data.organization_id,
        organization_name: organizationName,
        role_id: data.role_id,
        role_name: roleName,
      }

      if (isEditing && user) {
        await updateAccountMutation.mutateAsync({ ...payload, id: user.id })
      } else {
        await createAccountMutation.mutateAsync(payload)
      }
    } catch (error) {
      console.error('提交用户表单失败:', error)
    }
  }

  // 扁平化组织树
  const flattenOrganizations = (orgs: any[], level = 0): any[] => {
    let result: any[] = []
    orgs.forEach((org) => {
      result.push({ ...org, level })
      if (org.children && org.children.length > 0) {
        result = result.concat(flattenOrganizations(org.children, level + 1))
      }
    })
    return result
  }

  const flatOrganizations = flattenOrganizations(organizations || [])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 用户名 */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          用户名 <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          {...register('name')}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          placeholder="请输入用户名"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>

      {/* 密码 */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          密码 {!isEditing && <span className="text-red-500">*</span>}
          {isEditing && <span className="text-xs text-gray-500">(留空则不修改)</span>}
        </label>
        <input
          id="password"
          type="password"
          {...register('password')}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          placeholder={isEditing ? '留空则不修改密码' : '请输入密码'}
        />
        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
      </div>

      {/* 邮箱 */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          邮箱
        </label>
        <input
          id="email"
          type="email"
          {...register('email')}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          placeholder="请输入邮箱（可选）"
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
      </div>

      {/* 组织 */}
      <div>
        <label htmlFor="organization_id" className="block text-sm font-medium text-gray-700">
          所属组织 <span className="text-red-500">*</span>
        </label>
        <select
          id="organization_id"
          {...register('organization_id', { valueAsNumber: true })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
        >
          <option value={0}>请选择组织</option>
          {flatOrganizations.map((org) => (
            <option key={org.id} value={org.id}>
              {'　'.repeat(org.level)}
              {org.name}
            </option>
          ))}
        </select>
        {errors.organization_id && (
          <p className="mt-1 text-sm text-red-600">{errors.organization_id.message}</p>
        )}
      </div>

      {/* 角色 */}
      <div>
        <label htmlFor="role_id" className="block text-sm font-medium text-gray-700">
          角色 <span className="text-red-500">*</span>
        </label>
        <select
          id="role_id"
          {...register('role_id', { valueAsNumber: true })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
        >
          <option value={0}>请选择角色</option>
          {roles &&
            roles.map((role: any) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
        </select>
        {errors.role_id && <p className="mt-1 text-sm text-red-600">{errors.role_id.message}</p>}
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
          {isSubmitting ? '保存中...' : isEditing ? '更新用户' : '创建用户'}
        </button>
      </div>
    </form>
  )
}
