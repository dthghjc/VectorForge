// HeaderBar.tsx
import React from 'react';
import { Layout, Avatar, Dropdown } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';

const { Header } = Layout;

const HeaderBar: React.FC = () => {
  const menuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        sessionStorage.clear();
        window.location.href = '/login';
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
        flexShrink: 0,
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
