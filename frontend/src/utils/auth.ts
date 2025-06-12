import { store } from '../store';
import { clearAuth } from '../store/login/authSlice';

// 登出功能
export const logout = () => {
  // 清除Redux状态
  store.dispatch(clearAuth());
  
  // 跳转到登录页
  window.location.href = '/login';
};

// 检查token是否过期
export const isTokenExpired = (token: string): boolean => {
  if (!token) return true;
  
  try {
    // 解析JWT token的payload部分
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Token parse error:', error);
    return true;
  }
};

// 自动检查并处理token过期
export const checkAuthStatus = () => {
  const state = store.getState();
  const token = state.authSlice.token;
  
  if (token && isTokenExpired(token)) {
    console.log('Token expired, logging out...');
    logout();
    return false;
  }
  
  return !!token;
}; 