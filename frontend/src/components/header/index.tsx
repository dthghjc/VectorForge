import React from 'react';
import { Layout, Avatar, Dropdown } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';

const { Header } = Layout;

const HeaderBar: React.FC = () => {
  // 下拉菜单项
  const menuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        console.log('退出登录');
        // 这里可以清除 token、跳转登录页等
        sessionStorage.clear();
        window.location.href = '/login'; // 视你项目路由情况
      },
    },
  ];

  return (
    <Header
      style={{
        height: 48,
        lineHeight: '48px',
        background: '#fff',
        padding: '0 16px',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        borderBottom: '1px solid #f0f0f0',
        flexShrink: 0, // 防止被压缩高度
      }}
    >
      <Dropdown menu={{ items: menuItems }} placement="bottomRight">
        <div
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Avatar size="small" icon={<UserOutlined />} />
          <span style={{ fontWeight: 500 }}>用户名</span>
        </div>
      </Dropdown>
    </Header>
  );
};

export default HeaderBar;