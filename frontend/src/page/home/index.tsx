import React, { useState } from 'react';
import { Layout, theme } from 'antd';
import NavLeft from '../../components/navLeft';
import MyHeader from '../../components/header';

const { Content } = Layout;
const Home: React.FC = () => {
  //主题色
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: '100vh' }}>
        {/* 侧边栏 */}
        <NavLeft />
        
        <Layout>
            {/* 头部 */}
            <MyHeader />

            {/* 内容 */}
            <Content style={{ margin: '16px 16px 16px' }}>
                <div style={{
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