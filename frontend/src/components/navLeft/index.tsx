import React, { useState } from 'react';
import {
  DesktopOutlined,
  FileOutlined,
  PieChartOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Layout, Menu, theme } from 'antd';

const { Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem;
}

const items: MenuItem[] = [
  getItem('Option 1', '1', <PieChartOutlined />),
  getItem('Option 2', '2', <DesktopOutlined />),
  getItem('User', 'sub1', <UserOutlined />, [
    getItem('Tom', '3'),
    getItem('Bill', '4'),
    getItem('Alex', '5'),
  ]),
  getItem('Team', 'sub2', <TeamOutlined />, [getItem('Team 1', '6'), getItem('Team 2', '8')]),
  getItem('Files', '9', <FileOutlined />),
];



const NavLeft: React.FC = () => {
  //侧边栏折叠
  const [collapsed, setCollapsed] = useState(true);
  //主题色
  // 使用 Ant Design 主题系统获取当前主题的样式令牌
  // colorBgContainer: 背景容器颜色，用于设置侧边栏背景
  // borderRadiusLG: 大尺寸圆角半径，用于设置侧边栏圆角
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  
  return (
    <div
        style={{
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
        }}
    >
      <Sider
        theme="light"
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
      >
        <div 
          style={{
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: collapsed ? '18px' : '14px',
            fontWeight: 'bold',
            color: '#1890ff',
            background: '#fafafa',
            margin: '16px 12px 16px 12px',
            borderRadius: '8px',
            border: '1px solid #e8e8e8',
            transition: 'all 0.3s ease',
            letterSpacing: collapsed ? '0' : '1px',
          }}
        >
          {collapsed ? '🤓' : '🤓'}
        </div>
        <Menu
          theme="light"
          defaultSelectedKeys={['1']}
          mode="inline"
          items={items}
          style={{
            border: 'none',
            marginTop: '0px',
          }}
        />
      </Sider>
    </div>
  );
};

export default NavLeft;