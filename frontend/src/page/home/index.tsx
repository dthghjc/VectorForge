// Home.tsx
import React from 'react';
import { Layout, theme } from 'antd';
import NavLeft from '../../components/navLeft';
import HeaderBar from '../../components/header';

const { Content } = Layout;

const Home: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <NavLeft />

      <Layout style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <HeaderBar />

        <Content style={{ flex: 1, margin: 16, overflow: 'auto' }}>
          <div
            style={{
              padding: 24,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
              minHeight: '100%',
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
