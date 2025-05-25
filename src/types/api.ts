// 基础响应类型
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

// 分页参数
export interface PaginationParams {
  page_no: number
  page_size: number
}

// 分页响应
export interface PaginationResponse<T> {
  items: T[]
  total: number
  page_no: number
  page_size: number
}

// 登录请求
export interface LoginRequest {
  username: string
  password: string
}

// 登录响应
export interface LoginResponse {
  token: string
  user: User
}

// 用户信息
export interface User {
  id: number
  name: string
  email?: string
  organization_id: number
  organization_name?: string
  role_id: number
  role_name?: string
}

// 菜单
export interface Menu {
  menu_id: number
  menu_name: string
  parent_id?: number
  path?: string
  icon?: string
  sort?: number
}

// 角色
export interface Role {
  id: number
  name: string
  description?: string
  is_deleteable: boolean
  menus: Menu[]
  created_at?: string
  updated_at?: string
}

// 创建角色请求
export interface CreateRoleRequest {
  name: string
  description?: string
  is_deleteable: boolean
  menus: {
    menu_id: number
    menu_name: string
  }[]
}

// 组织
export interface Organization {
  id: number
  name: string
  parent_id: number
  parent_name?: string
  children?: Organization[]
}

// 创建组织请求
export interface CreateOrganizationRequest {
  name: string
  parent_id: number
  parent_name?: string
}

// 创建用户请求
export interface CreateAccountRequest {
  name: string
  password: string
  email?: string
  organization_id: number
  organization_name?: string
  role_id: number
  role_name?: string
}

// 组织树查询类型
export type OrganizationLimitType =
  | 'Root'
  | 'FirstLevel'
  | 'SubOrganization'
  | 'SubOrganizationIncludeSelf'

// 组织树请求
export interface OrganizationTreeRequest {
  limit_type: OrganizationLimitType
}

// 实际后端响应格式
export interface BackendResponse<T = unknown> {
  status_code: number
  data: T
}

// 实际后端登录响应数据
export interface BackendLoginData {
  token: string
  user_id: number
  expires_in: number
}

// 实际后端登录响应格式
export type BackendLoginResponse = BackendResponse<BackendLoginData>

// 后端分页响应格式
export interface BackendPaginationData<T> {
  total: number
  data: T[]
}

// 后端角色数据（实际返回格式）
export interface BackendRole {
  id: number
  name: string
  description?: string
  created_by: number
  created_by_name: string
  is_deleteable: boolean
}

// 后端角色列表响应
export type BackendRolesResponse = BackendResponse<BackendPaginationData<BackendRole>>
