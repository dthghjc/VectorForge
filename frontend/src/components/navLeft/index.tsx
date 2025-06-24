import React, { useState } from 'react';
import {
  AppstoreOutlined,
  ContainerOutlined,
  DesktopOutlined,
  MailOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PieChartOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Button, Menu, Layout } from 'antd';

type MenuItem = Required<MenuProps>['items'][number];


const items: MenuItem[] = [
  { key: '1', icon: <PieChartOutlined />, label: 'Option 1' },
  { key: '2', icon: <DesktopOutlined />, label: 'Option 2' },
  { key: '3', icon: <ContainerOutlined />, label: 'Option 3' },
  {
    key: 'sub1',
    label: 'Navigation One',
    icon: <MailOutlined />,
    children: [
      { key: '5', label: 'Option 5' },
      { key: '6', label: 'Option 6' },
      { key: '7', label: 'Option 7' },
      { key: '8', label: 'Option 8' },
    ],
  },
  {
    key: 'sub2',
    label: 'Navigation Two',
    icon: <AppstoreOutlined />,
    children: [
      { key: '9', label: 'Option 9' },
      { key: '10', label: 'Option 10' },
      {
        key: 'sub3',
        label: 'Submenu',
        children: [
          { key: '11', label: 'Option 11' },
          { key: '12', label: 'Option 12' },
        ],
      },
    ],
  },
];

const { Sider } = Layout;

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(true); // 折叠状态
  const [hoverLogo, setHoverLogo] = useState(false); // 鼠标是否悬停在 logo 区域

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider
        collapsed={collapsed}  // 折叠状态
        collapsible={false}  //不显示默认的折叠按钮
        width={256}  // 宽度
        collapsedWidth={80}  // 折叠宽度
        style={{
            transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
            background: '#fff',
            borderRight: '1px solid #e0e0e0', // 👈 分割线
            overflow: 'hidden'  //隐藏溢出到容器之外的内容
        }}  // 样式
      >
        {/* 折叠按钮 */}
        <div
            style={{
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'space-between', // 👈 展开时左右分布
                padding: '0 16px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
            }}
            onMouseEnter={() => setHoverLogo(true)}
            onMouseLeave={() => setHoverLogo(false)}
            onClick={() => setCollapsed(!collapsed)}
            >
                {collapsed ? (
                hoverLogo ? (
                <MenuUnfoldOutlined />
                ) : (
                <span style={{ fontSize: 20 }}>🤓</span>
                )
            ) : (
                <>
                <span style={{ fontSize: 20 }}>🤓</span>
                <MenuFoldOutlined />
                </>
            )}
        </div>
        <Menu
            defaultSelectedKeys={['1']}
            defaultOpenKeys={['sub1']}
            mode="inline"
            theme="light"
            inlineCollapsed={collapsed}
            items={items}
        />
      </Sider>
    </Layout>
  );
};

export default App;