import { Layout, theme } from 'antd';
import NavLeft from '../../components/navLeft';
import HeaderBar from '../../components/header';
import { Outlet } from 'react-router-dom';

const { Content } = Layout;

function Home() {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 侧边栏 */}
      <NavLeft />

      {/* 右侧区域（头部 + 内容） */}
      <Layout style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <HeaderBar />

        <Content style={{ flex: 1, margin: 0, overflow: 'auto' }}>
          <div
            style={{
              padding: 24,
              background: colorBgContainer,
              minHeight: '100%',
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default Home;
