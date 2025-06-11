import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Avatar, 
  Dropdown, 
  Space, 
  Typography, 
  Tag, 
  Divider,
  message
} from 'antd';
import { 
  UserOutlined, 
  LogoutOutlined, 
  SettingOutlined,
  CrownOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { clearToken } from '../store/login/authSlice';
import { logoutApi } from '../api/auth';
import type { UserRole } from '../api/auth';

const { Text } = Typography;

interface RootState {
  auth: {
    token: string | null;
    user: {
      id: string;
      username: string;
      email?: string;
      role: UserRole;
      is_active: boolean;
      avatar_url?: string;
      total_annotations: number;
      approved_annotations: number;
      approval_rate: number;
    } | null;
  };
}

const UserAvatar: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user) return null;

  // 获取角色显示配置
  const getRoleConfig = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return { color: 'red', icon: <CrownOutlined />, text: '管理员' };
      case 'reviewer':
        return { color: 'blue', icon: <EyeOutlined />, text: '审核员' };
      default:
        return { color: 'default', icon: <UserOutlined />, text: '用户' };
    }
  };

  const roleConfig = getRoleConfig(user.role);

  // 登出处理
  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.warn('登出请求失败:', error);
    } finally {
      dispatch(clearToken());
      message.success('已退出登录');
      navigate('/login');
    }
  };

  // 下拉菜单项
  const menuItems = [
    {
      key: 'profile',
      label: (
        <div style={{ padding: '8px 0' }}>
          <Space direction="vertical" size={4}>
            <Text strong>{user.username}</Text>
            {user.email && <Text type="secondary" style={{ fontSize: '12px' }}>{user.email}</Text>}
            <Tag color={roleConfig.color} icon={roleConfig.icon}>
              {roleConfig.text}
            </Tag>
          </Space>
        </div>
      ),
    },
    {
      type: 'divider' as const,
    },
    // 只有审核员和管理员显示统计信息
    ...(user.role !== 'user' ? [{
      key: 'stats',
      label: (
        <div style={{ padding: '4px 0' }}>
          <Space direction="vertical" size={2}>
            <Text style={{ fontSize: '12px' }}>
              标注统计: {user.total_annotations} 总计
            </Text>
            <Text style={{ fontSize: '12px' }}>
              通过率: {user.approval_rate}%
            </Text>
          </Space>
        </div>
      ),
    }, {
      type: 'divider' as const,
    }] : []),
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => navigate('/settings'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    <Dropdown 
      menu={{ items: menuItems }} 
      placement="bottomRight"
      arrow
      trigger={['click']}
    >
      <Space style={{ cursor: 'pointer', padding: '4px 8px' }}>
        <Avatar 
          size="small"
          src={user.avatar_url}
          icon={<UserOutlined />}
        />
        <Text>{user.username}</Text>
      </Space>
    </Dropdown>
  );
};

export default UserAvatar; 