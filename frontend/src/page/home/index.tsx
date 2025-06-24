import React from 'react';
import { Layout, theme } from 'antd';
import NavLeft from '../../components/navLeft';
import HeaderBar from '../../components/header'; // 你自定义的头部组件

const { Content } = Layout;

const Home: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 左侧菜单栏 */}
      <NavLeft />

      {/* 右侧主区域 */}
      <Layout style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* 头部 */}
        <HeaderBar />

        {/* 内容 */}
        <Content style={{ flex: 1, margin: 16, overflow: 'auto' }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            Bill is a cat.
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Home;
