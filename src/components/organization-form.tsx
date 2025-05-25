import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, X } from 'lucide-react'
import api from '@/lib/api'
import { adaptBackendResponse } from '@/lib/backend-adapter'
import { CreateOrganizationRequest, Organization } from '@/types/api'

// 表单验证 schema
const organizationFormSchema = z.object({
  name: z.string().min(1, '组织名称不能为空').max(100, '组织名称不能超过100个字符'),
  parent_id: z.number().min(-1, '请选择父组织'),
})

type OrganizationFormData = z.infer<typeof organizationFormSchema>

interface OrganizationFormProps {
  organization?: Organization
  onSuccess: () => void
  onCancel: () => void
}

export default function OrganizationForm({
  organization,
  onSuccess,
  onCancel,
}: OrganizationFormProps) {
  const queryClient = useQueryClient()
  const isEditing = !!organization

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      name: organization?.name || '',
      parent_id: organization?.parent_id ?? -1,
    },
  })

  // 获取组织列表（用于选择父组织）
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

  // 创建组织
  const createOrganizationMutation = useMutation({
    mutationFn: async (data: CreateOrganizationRequest) => {
      const response = await api.post('/organizations', data)
      return response.data
    },
    onSuccess: () => {
      // 刷新组织树数据
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      // 刷新统计数据
      queryClient.invalidateQueries({ queryKey: ['organizations', 'stats'] })
      onSuccess()
    },
  })

  // 更新组织 (假设有更新接口)
  const updateOrganizationMutation = useMutation({
    mutationFn: async (data: CreateOrganizationRequest & { id: number }) => {
      const response = await api.put(`/organizations/${data.id}`, data)
      return response.data
    },
    onSuccess: () => {
      // 刷新组织树数据
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      // 刷新统计数据
      queryClient.invalidateQueries({ queryKey: ['organizations', 'stats'] })
      // 刷新特定组织详情
      queryClient.invalidateQueries({ queryKey: ['organizations', organization?.id] })
      onSuccess()
    },
  })

  const onSubmit: SubmitHandler<OrganizationFormData> = async (data) => {
    try {
      const payload: CreateOrganizationRequest = {
        name: data.name,
        parent_id: data.parent_id,
      }

      if (isEditing && organization) {
        await updateOrganizationMutation.mutateAsync({ ...payload, id: organization.id })
      } else {
        await createOrganizationMutation.mutateAsync(payload)
      }
    } catch (error) {
      console.error('提交组织表单失败:', error)
    }
  }

  // 扁平化组织树（排除当前编辑的组织及其子组织）
  const flattenOrganizations = (orgs: any[], level = 0, excludeId?: number): any[] => {
    let result: any[] = []
    orgs.forEach((org) => {
      if (org.id !== excludeId) {
        result.push({ ...org, level })
        if (org.children && org.children.length > 0) {
          result = result.concat(flattenOrganizations(org.children, level + 1, excludeId))
        }
      }
    })
    return result
  }

  const flatOrganizations = flattenOrganizations(
    organizations || [],
    0,
    isEditing ? organization?.id : undefined
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 组织名称 */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          组织名称 <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          {...register('name')}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          placeholder="请输入组织名称"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>

      {/* 父组织 */}
      <div>
        <label htmlFor="parent_id" className="block text-sm font-medium text-gray-700">
          父组织
        </label>
        <select
          id="parent_id"
          {...register('parent_id', { valueAsNumber: true })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
        >
          <option value={-1}>无父组织（根组织）</option>
          {flatOrganizations.map((org) => (
            <option key={org.id} value={org.id}>
              {'　'.repeat(org.level)}
              {org.name}
            </option>
          ))}
        </select>
        {errors.parent_id && (
          <p className="mt-1 text-sm text-red-600">{errors.parent_id.message}</p>
        )}
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
          {isSubmitting ? '保存中...' : isEditing ? '更新组织' : '创建组织'}
        </button>
      </div>
    </form>
  )
}
