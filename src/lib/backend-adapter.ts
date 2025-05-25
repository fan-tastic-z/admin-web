// 后端响应适配器
export const adaptBackendResponse = <T>(
  response: any
): { success: boolean; data: T | null; error?: string } => {
  try {
    console.log('适配后端响应:', response)

    // 检查是否是后端标准格式：{status_code: 200, data: ...}
    if (response && typeof response === 'object' && 'status_code' in response) {
      if (response.status_code === 200 && response.data !== undefined) {
        return {
          success: true,
          data: response.data,
        }
      } else {
        return {
          success: false,
          data: null,
          error: `后端返回错误，状态码: ${response.status_code}`,
        }
      }
    }

    // 检查是否是前端期望的格式：{code: 200, data: ...}
    if (response && typeof response === 'object' && 'code' in response) {
      if (response.code === 200 && response.data !== undefined) {
        return {
          success: true,
          data: response.data,
        }
      } else {
        return {
          success: false,
          data: null,
          error: response.message || `请求失败，状态码: ${response.code}`,
        }
      }
    }

    // 如果是直接的数据格式，直接返回
    return {
      success: true,
      data: response,
    }
  } catch (error) {
    console.error('适配后端响应时出错:', error)
    return {
      success: false,
      data: null,
      error: '响应数据格式错误',
    }
  }
}

// 适配分页数据
export const adaptPaginationData = <T>(backendData: any, currentPage: number, pageSize: number) => {
  if (backendData && typeof backendData === 'object') {
    // 后端格式：{total: number, data: T[]}
    if ('total' in backendData && 'data' in backendData) {
      return {
        items: Array.isArray(backendData.data) ? backendData.data : [],
        total: backendData.total || 0,
        page_no: currentPage,
        page_size: pageSize,
      }
    }

    // 前端期望格式：{items: T[], total: number}
    if ('items' in backendData) {
      return backendData
    }

    // 如果是数组，包装为分页格式
    if (Array.isArray(backendData)) {
      return {
        items: backendData,
        total: backendData.length,
        page_no: currentPage,
        page_size: pageSize,
      }
    }
  }

  return {
    items: [],
    total: 0,
    page_no: currentPage,
    page_size: pageSize,
  }
}
