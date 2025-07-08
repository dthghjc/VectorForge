import React from 'react';
import { Flex, Layout } from 'antd'; // 保留 Flex，但这里我们不再用它包裹 Layout，而是用它来展示一些间距，实际布局由 Layout 负责

const { Header, Footer, Content } = Layout; // 移除了 Sider，因为你只用了最简单的布局

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#000',
  height: 64,
  paddingInline: 48,
  lineHeight: '64px',
  backgroundColor: '#fff',
};

// 修改 contentStyle：移除固定高度，使用 flex: 1 填充剩余空间
const contentStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#000',
  backgroundColor: '#fff',
  flex: 1, // 关键：让 Content 填充其父容器（Layout）的剩余垂直空间
  display: 'flex', // 关键：将 Content 内部设置为 Flex 容器
  flexDirection: 'column', // 关键：Content 内部的子元素垂直排列
  justifyContent: 'center', // 垂直居中内容
  alignItems: 'center', // 水平居中内容
};

const footerStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#000',
  backgroundColor: '#fff',
};

// 修改 layoutStyle：移除宽度限制，并设置全屏宽高
const layoutStyle: React.CSSProperties = {
  borderRadius: 8,
  overflow: 'hidden',
  width: '100vw', // 占据整个视口宽度
  height: '100vh', // 占据整个视口高度
  display: 'flex', // 关键：将 Layout 自身设置为 Flex 容器
  flexDirection: 'column', // 关键：Header, Content, Footer 垂直排列
};

const Annotation: React.FC = () => (
  // 移除了外部的 <Flex> 包裹，因为我们希望 Layout 占据整个页面
  // 如果你确实需要在整个页面内容之外还有一些间距或 Flex 行为，可以再考虑加上，但通常全屏布局不需要
  <Layout style={layoutStyle}>
    <Header style={headerStyle}>Header</Header>
    <Content style={contentStyle}>
        
    </Content>
    <Footer style={footerStyle}>Footer</Footer>
  </Layout>
);



export default Annotation;




