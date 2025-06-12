import { useSelector } from 'react-redux';
import type { RootState } from '../store';

export const useAuth = () => {
  const auth = useSelector((state: RootState) => state.authSlice);
  const { token, userInfo, isAuthenticated } = auth;

  // 获取用户权限（基于角色）
  const getPermissions = (): string[] => {
    if (!userInfo) return [];
    
    const basePermissions = ['read'];
    
    switch (userInfo.role) {
      case 'admin':
        return [...basePermissions, 'write', 'delete', 'manage_users', 'admin'];
      case 'reviewer':
        return [...basePermissions, 'write', 'review', 'approve'];
      case 'user':
      default:
        return basePermissions;
    }
  };

  // 检查是否有特定权限
  const hasPermission = (permission: string): boolean => {
    return getPermissions().includes(permission);
  };

  // 检查是否是管理员
  const isAdmin = (): boolean => {
    return userInfo?.role === 'admin';
  };

  // 检查是否是审核员
  const isReviewer = (): boolean => {
    return userInfo?.role === 'reviewer' || isAdmin();
  };

  return {
    token,
    userInfo,
    isAuthenticated,
    permissions: getPermissions(),
    hasPermission,
    isAdmin,
    isReviewer,
    
    // 兼容旧版本
    username: userInfo?.username,
    role: userInfo?.role,
  };
}; 