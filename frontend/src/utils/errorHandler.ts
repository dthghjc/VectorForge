// 错误处理工具
export interface ApiError {
  detail?: string;
  message?: string;
  status?: number;
}

export const getErrorMessage = (error: any): string => {
  // HTTP 状态码错误
  if (error?.response?.status) {
    const status = error.response.status;
    const data = error.response.data;
    
    // 优先使用后端返回的错误信息
    if (data?.detail) {
      return data.detail;
    }
    
    // 根据状态码返回默认错误信息
    switch (status) {
      case 401:
        return '用户名或密码错误';
      case 403:
        return '权限不足';
      case 404:
        return '请求的资源不存在';
      case 422:
        return data?.detail || '请求参数错误';
      case 500:
        return '服务器内部错误';
      default:
        return `请求失败 (${status})`;
    }
  }
  
  // FastAPI 错误格式
  if (error?.response?.data?.detail) {
    return error.response.data.detail;
  }
  
  // 网络错误
  if (error?.message) {
    if (error.message.includes('Network Error')) {
      return '网络连接失败，请检查网络';
    }
    if (error.message.includes('timeout')) {
      return '请求超时，请稍后重试';
    }
    return error.message;
  }
  
  // 其他错误
  if (typeof error === 'string') {
    return error;
  }
  
  return '未知错误，请稍后重试';
};

// 登录相关的错误处理
export const getLoginErrorMessage = (error: any): string => {
  const message = getErrorMessage(error);
  
  // 特定错误处理
  if (message.includes('password') || message.includes('用户名或密码')) {
    return '用户名或密码错误';
  }
  
  if (message.includes('inactive')) {
    return '账户已被禁用，请联系管理员';
  }
  
  if (message.includes('not found') || message.includes('用户不存在')) {
    return '用户不存在';
  }
  
  if (message.includes('422') || message.includes('参数错误')) {
    return '请检查用户名和密码格式';
  }
  
  return message;
}; 