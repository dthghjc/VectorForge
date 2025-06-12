// 错误处理工具
export interface ApiError {
  detail?: string;
  message?: string;
  status?: number;
}

export const getErrorMessage = (error: any): string => {
  // FastAPI 错误格式
  if (error?.response?.data?.detail) {
    return error.response.data.detail;
  }
  
  // 网络错误
  if (error?.message) {
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
  if (message.includes('password')) {
    return '用户名或密码错误';
  }
  
  if (message.includes('inactive')) {
    return '账户已被禁用，请联系管理员';
  }
  
  if (message.includes('not found')) {
    return '用户不存在';
  }
  
  return message;
}; 