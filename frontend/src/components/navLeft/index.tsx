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

// 从 Layout 组件中解构出 Sider 侧边栏组件
const { Sider } = Layout;

// 定义菜单项类型，继承自 Ant Design 的 MenuProps 类型
type MenuItem = Required<MenuProps>['items'][number];

/**
 * 创建菜单项的工具函数
 * @param label - 菜单项显示的文本标签
 * @param key - 菜单项的唯一标识键
 * @param icon - 菜单项的图标组件（可选）
 * @param children - 子菜单项数组（可选）
 * @returns 符合 MenuItem 类型的菜单项对象
 */
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

// 定义侧边栏菜单项配置
// 包含主菜单项和子菜单项，每个菜单项都有对应的图标和路由键
const items: MenuItem[] = [
  getItem('Option 1', '1', <PieChartOutlined />),
  getItem('Option 2', '2', <DesktopOutlined />),
  // 用户管理菜单组，包含子菜单
  getItem('User', 'sub1', <UserOutlined />, [
    getItem('Tom', '3'),
    getItem('Bill', '4'),
    getItem('Alex', '5'),
  ]),
  // 团队管理菜单组，包含子菜单
  getItem('Team', 'sub2', <TeamOutlined />, [getItem('Team 1', '6'), getItem('Team 2', '8')]),
  getItem('Files', '9', <FileOutlined />),
];

/**
 * 左侧导航栏组件
 * 提供可折叠的侧边栏导航功能，包含品牌标识和菜单列表
 */
const NavLeft: React.FC = () => {
  // 侧边栏折叠状态管理
  // collapsed: 控制侧边栏是否处于折叠状态
  // setCollapsed: 更新折叠状态的函数
  const [collapsed, setCollapsed] = useState(true);
  
  // 使用 Ant Design 主题系统获取当前主题的样式令牌
  // colorBgContainer: 背景容器颜色，用于设置侧边栏背景
  // borderRadiusLG: 大尺寸圆角半径，用于设置侧边栏圆角
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  
  return (
    // 外层容器，应用主题背景色和圆角样式
    <div
        style={{
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
        }}
    >
      {/* Ant Design 侧边栏组件 */}
      <Sider
        theme="light" // 使用浅色主题
        collapsible // 启用折叠功能
        collapsed={collapsed} // 绑定折叠状态
        onCollapse={(value) => setCollapsed(value)} // 折叠状态变化回调
      >
        {/* 品牌标识区域 */}
        <div 
          style={{
            height: '40px', // 固定高度
            display: 'flex', // 弹性布局
            alignItems: 'center', // 垂直居中对齐
            justifyContent: 'center', // 水平居中对齐
            fontSize: collapsed ? '18px' : '14px', // 根据折叠状态调整字体大小
            fontWeight: 'bold', // 粗体字重
            color: '#1890ff', // 主题蓝色
            background: '#fafafa', // 浅灰色背景
            margin: '16px 12px 16px 12px', // 外边距
            borderRadius: '8px', // 圆角
            border: '1px solid #e8e8e8', // 边框
            transition: 'all 0.3s ease', // 过渡动画
            letterSpacing: collapsed ? '0' : '1px', // 根据折叠状态调整字间距
          }}
        >
          {/* 品牌图标，目前使用相同的表情符号 */}
          {collapsed ? '🤓' : '🤓'}
        </div>
        
        {/* 导航菜单组件 */}
        <Menu
          theme="light" // 浅色主题
          defaultSelectedKeys={['1']} // 默认选中的菜单项
          mode="inline" // 内联模式，适合侧边栏
          items={items} // 菜单项配置
          style={{
            border: 'none', // 移除边框
            marginTop: '0px', // 移除顶部边距
          }}
        />
      </Sider>
    </div>
  );
};

export default NavLeft;