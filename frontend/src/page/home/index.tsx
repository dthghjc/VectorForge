import React, { useState } from 'react';
import {
  AppstoreOutlined,
  ContainerOutlined,
  DesktopOutlined,
  MailOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PieChartOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Menu, Avatar, Dropdown, Button } from 'antd';
import type { MenuProps } from 'antd';

const menuItems: Required<MenuProps>['items'] = [
  { key: '1', icon: <PieChartOutlined />, label: '仪表盘' },
  { key: '2', icon: <DesktopOutlined />, label: '工作台' },
  { key: '3', icon: <ContainerOutlined />, label: '内容管理' },
  {
    key: 'sub1',
    label: '一级菜单',
    icon: <MailOutlined />,
    children: [
      { key: '5', label: '子项一' },
      { key: '6', label: '子项二' },
    ],
  },
  {
    key: 'sub2',
    label: '设置',
    icon: <AppstoreOutlined />,
    children: [
      { key: '9', label: '系统设置' },
      {
        key: 'sub3',
        label: '更多',
        children: [
          { key: '11', label: '选项 A' },
          { key: '12', label: '选项 B' },
        ],
      },
    ],
  },
];

const userMenu: MenuProps = {
  items: [
    { key: 'profile', label: '个人资料' },
    { type: 'divider' },
    { key: 'logout', label: '退出登录' },
  ],
};

const FancySideMenu: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      style={{
        width: collapsed ? 80 : 256,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #f0f0f0',
        transition: 'all 0.3s ease',
        background: '#fff',
      }}
    >
      {/* 顶部 header（包含 logo + 按钮） */}
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          borderBottom: '1px solid #f0f0f0',
          padding: collapsed ? '0' : '0 16px',
          transition: 'all 0.3s ease',
        }}
      >
        {/* logo */}
        {!collapsed && (
          <div style={{ fontSize: 20, fontWeight: 600 }}>🤓</div>
        )}

        {/* 折叠按钮 */}
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => setCollapsed(!collapsed)}
          style={{
            transition: 'transform 0.3s ease',
          }}
          // onMouseEnter={(e) =>
          //   (e.currentTarget.style.transform = 'rotate(10deg)')
          // }
          // onMouseLeave={(e) =>
          //   (e.currentTarget.style.transform = 'rotate(0deg)')
          // }
        />
      </div>

      {/* 菜单区域 */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <Menu
          mode="inline"
          theme="light"
          inlineCollapsed={collapsed}
          defaultSelectedKeys={['1']}
          defaultOpenKeys={collapsed ? [] : ['sub1']}
          items={menuItems}
          style={{
            transition: 'all 0.3s ease',
            borderRight: 'none',
          }}
        />
      </div>

      {/* 用户信息区域 */}
      <div
        style={{
          height: 64,
          padding: '0 16px',
          borderTop: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          transition: 'all 0.3s ease',
        }}
      >
        <Dropdown menu={userMenu} trigger={['click']}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            <Avatar icon={<UserOutlined />} />
            <div
              style={{
                marginLeft: 12,
                opacity: collapsed ? 0 : 1,
                transition: 'opacity 0.3s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {!collapsed && (
                <>
                  <div style={{ fontWeight: 500 }}>用户名</div>
                  <div style={{ fontSize: 12, color: '#999' }}>
                    user@example.com
                  </div>
                </>
              )}
            </div>
          </div>
        </Dropdown>
      </div>
    </div>
  );
};

export default FancySideMenu;
