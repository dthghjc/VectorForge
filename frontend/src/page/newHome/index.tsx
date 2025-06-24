import React, { useState } from 'react';
import {
  Layout,
  Menu,
  Button,
  Input,
  Avatar,
  Typography,
  Space,
  Card,
  Badge,
  Tooltip,
  theme
} from 'antd';
import {
  PlusOutlined,
  HomeOutlined,
  MessageOutlined,
  SettingOutlined,
  UserOutlined,
  SearchOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DatabaseOutlined,
  BarChartOutlined,
  TeamOutlined,
  FileTextOutlined,
  BellOutlined
} from '@ant-design/icons';
import './index.scss';

const { Header, Sider, Content } = Layout;
const { Text, Title } = Typography;

// 导航菜单项
const menuItems = [
  {
    key: 'home',
    icon: <HomeOutlined />,
    label: '首页',
    path: '/home'
  },
  {
    key: 'chat',
    icon: <MessageOutlined />,
    label: '对话管理',
    path: '/chat',
    badge: 3
  },
  {
    key: 'vectors',
    icon: <DatabaseOutlined />,
    label: 'Milvus 工具',
    path: '/vectors'
  },
  {
    key: 'analytics',
    icon: <BarChartOutlined />,
    label: '数据分析',
    path: '/analytics'
  },
  {
    key: 'team',
    icon: <TeamOutlined />,
    label: '团队管理',
    path: '/team'
  },
  {
    key: 'documents',
    icon: <FileTextOutlined />,
    label: '文档中心',
    path: '/documents'
  }
];

// 快捷操作项
const quickActions = [
  { key: 'new-chat', label: '新建对话', icon: <MessageOutlined /> },
  { key: 'upload-data', label: '上传数据', icon: <DatabaseOutlined /> },
  { key: 'create-report', label: '创建报告', icon: <FileTextOutlined /> }
];

const NewHome: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState('home');
  const [searchValue, setSearchValue] = useState('');
  const { token } = theme.useToken();

  const handleMenuClick = (key: string) => {
    setSelectedKey(key);
    // 这里可以添加路由跳转逻辑
    console.log('Navigate to:', key);
  };

  const handleQuickAction = (key: string) => {
    console.log('Quick action:', key);
  };

  const filteredMenuItems = menuItems.filter(item =>
    item.label.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <Layout className="new-home-container" style={{ height: '100vh', overflow: 'hidden' }}>
      {/* 左侧导航栏 */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={280}
        className="sidebar"
        style={{
          background: token.colorBgContainer,
          borderRight: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        {/* 顶部品牌区域 */}
        <div style={{ 
          padding: '20px 16px', 
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: collapsed ? '24px' : '20px',
            fontWeight: 'bold',
            color: token.colorPrimary,
            marginBottom: collapsed ? '0' : '8px',
            transition: 'all 0.3s ease'
          }}>
            {collapsed ? '🚀' : '🚀 VectorForge'}
          </div>
          {!collapsed && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              AI 数据管理平台
            </Text>
          )}
        </div>

        {/* 快捷操作按钮 */}
        <div style={{ padding: '16px' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            block
            size="large"
            style={{ marginBottom: '12px' }}
            onClick={() => handleQuickAction('new-chat')}
          >
            {!collapsed && '新建项目'}
          </Button>
          
          {!collapsed && (
            <Input
              placeholder="搜索功能..."
              prefix={<SearchOutlined />}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              style={{ borderRadius: '8px' }}
            />
          )}
        </div>

        {/* 导航菜单 */}
        <div style={{ padding: '0 8px', height: 'calc(100% - 200px)', overflowY: 'auto' }}>
          {filteredMenuItems.map((item) => (
            <div
              key={item.key}
              className={`nav-item ${selectedKey === item.key ? 'active' : ''}`}
              style={{
                padding: '12px 16px',
                margin: '4px 0',
                cursor: 'pointer',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: selectedKey === item.key ? token.colorPrimaryBg : 'transparent',
                color: selectedKey === item.key ? token.colorPrimary : token.colorText,
                transition: 'all 0.2s ease',
              }}
              onClick={() => handleMenuClick(item.key)}
            >
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              {!collapsed && (
                <>
                  <span style={{ flex: 1, fontWeight: selectedKey === item.key ? 600 : 400 }}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <Badge 
                      count={item.badge} 
                      size="small" 
                      style={{ backgroundColor: token.colorWarning }}
                    />
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/* 底部用户信息 */}
        <div className="user-info" style={{ 
          padding: '16px', 
          borderTop: `1px solid ${token.colorBorderSecondary}`,
          background: token.colorBgContainer
        }}>
          <Space size="middle" style={{ width: '100%' }}>
            <Avatar className="user-avatar" icon={<UserOutlined />} />
            {!collapsed && (
              <>
                <div style={{ flex: 1 }}>
                  <Text strong>管理员</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>在线</Text>
                </div>
                <Tooltip title="设置">
                  <Button type="text" icon={<SettingOutlined />} />
                </Tooltip>
              </>
            )}
          </Space>
        </div>
      </Sider>

      {/* 主内容区域 */}
      <Layout className="main-content">
        <Header className="header" style={{ 
          padding: '0 24px', 
          background: token.colorBgContainer,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px' }}
            />
            <Title className="header-title" level={4} style={{ margin: 0 }}>
              {menuItems.find(item => item.key === selectedKey)?.label || '首页'}
            </Title>
          </Space>
          
          <Space className="header-actions">
            <Badge className="notification-badge" count={5} size="small">
              <Button type="text" icon={<BellOutlined />} />
            </Badge>
            <Avatar icon={<UserOutlined />} />
          </Space>
        </Header>

        <Content style={{ 
          padding: '24px',
          background: token.colorBgLayout,
          overflow: 'auto'
        }}>
          {/* 主要内容区域 */}
          <div style={{ marginBottom: '24px' }}>
            <Card>
              <Title level={3} style={{ marginBottom: '16px' }}>
                欢迎使用 VectorForge
              </Title>
              <Text type="secondary">
                这是一个 AI 数据管理平台，提供对话管理和向量数据处理功能。
              </Text>
            </Card>
          </div>

          {/* 快捷操作卡片 */}
          <div style={{ marginBottom: '24px' }}>
            <Title level={4} style={{ marginBottom: '16px' }}>快捷操作</Title>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px'
            }}>
              {quickActions.map((action) => (
                <Card
                  key={action.key}
                  hoverable
                  style={{ textAlign: 'center' }}
                  onClick={() => handleQuickAction(action.key)}
                >
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>
                    {action.icon}
                  </div>
                  <Text strong>{action.label}</Text>
                </Card>
              ))}
            </div>
          </div>

          {/* 统计信息 */}
          <div>
            <Title level={4} style={{ marginBottom: '16px' }}>系统概览</Title>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              <Card>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: token.colorPrimary }}>
                    126
                  </div>
                  <Text type="secondary">总对话数</Text>
                </div>
              </Card>
              <Card>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: token.colorSuccess }}>
                    1.2M
                  </div>
                  <Text type="secondary">向量数据</Text>
                </div>
              </Card>
              <Card>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: token.colorWarning }}>
                    8
                  </div>
                  <Text type="secondary">活跃用户</Text>
                </div>
              </Card>
              <Card>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: token.colorInfo }}>
                    99.9%
                  </div>
                  <Text type="secondary">系统稳定性</Text>
                </div>
              </Card>
            </div>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default NewHome;
