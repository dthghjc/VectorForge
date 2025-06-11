import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Spin } from 'antd';
import type { UserRole } from '../api/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  redirectTo?: string;
}

interface RootState {
  auth: {
    token: string | null;
    user: {
      id: string;
      username: string;
      role: UserRole;
      is_active: boolean;
    } | null;
  };
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole,
  redirectTo = '/login' 
}) => {
  const location = useLocation();
  const { token, user } = useSelector((state: RootState) => state.auth);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 模拟检查 token 有效性的过程
    const checkAuth = async () => {
      // 这里可以添加 token 验证逻辑
      setIsLoading(false);
    };

    checkAuth();
  }, [token]);

  // 加载中状态
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  // 未登录，重定向到登录页
  if (!token || !user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // 用户未激活
  if (!user.is_active) {
    return <Navigate to="/account-inactive" replace />;
  }

  // 权限检查
  if (requiredRole) {
    switch (requiredRole) {
      case 'admin':
        if (user.role !== 'admin') {
          return <Navigate to="/unauthorized" replace />;
        }
        break;
      case 'reviewer':
        if (user.role !== 'reviewer' && user.role !== 'admin') {
          return <Navigate to="/unauthorized" replace />;
        }
        break;
      case 'user':
        // 所有已登录用户都可以访问
        break;
      default:
        break;
    }
  }

  // 权限验证通过，渲染子组件
  return <>{children}</>;
};

export default ProtectedRoute; 