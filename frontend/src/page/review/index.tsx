// React核心库和组件导入
import React from 'react';
// Ant Design组件导入
import { Tabs, ConfigProvider } from 'antd';
import type { TabsProps } from 'antd';
import { Layout, Space, Typography } from 'antd';
// Ant Design图标导入
import { FileTextOutlined } from '@ant-design/icons';
// 自定义主题配置导入
import { theme } from '../../components/annotation/theme';

// 解构Typography组件
const { Title } = Typography;
// 解构Layout组件
const { Header, Footer, Content } = Layout;

/**
 * 头部导航栏样式定义
 * 包含居中对齐、颜色、高度、内边距、行高、背景色和边框等样式
 */
const headerStyle: React.CSSProperties = {
    textAlign: 'center',           // 文本居中对齐
    color: '#000',                 // 文字颜色为黑色
    height: 64,                    // 固定高度64px
    paddingInline: 48,             // 左右内边距48px
    lineHeight: '64px',            // 行高与高度一致，实现垂直居中
    backgroundColor: '#fff',        // 背景色为白色
    borderBottom: '1px solid #fafafa', // 底部边框，颜色为浅灰色
};

/**
 * 主内容区域样式定义
 * 设置内边距、背景色和弹性布局
 */
const contentStyle: React.CSSProperties = {
    padding: '0',                  // 无内边距
    backgroundColor: '#fff',        // 背景色为白色
    flex: 1,                       // 弹性布局，占据剩余空间
};

/**
 * 页脚样式定义
 * 设置文本居中和颜色
 */
const footerStyle: React.CSSProperties = {
    textAlign: 'center',           // 文本居中对齐
    color: '#000',                 // 文字颜色为黑色
    backgroundColor: '#fff',        // 背景色为白色
};

/**
 * 整体布局容器样式定义
 * 设置圆角、溢出隐藏、尺寸和弹性布局
 */
const layoutStyle: React.CSSProperties = {
    borderRadius: 8,               // 圆角8px
    overflow: 'hidden',            // 溢出内容隐藏
    width: '100%',                 // 宽度100%
    height: '100vh',               // 高度为视窗高度
    display: 'flex',               // 弹性布局
    flexDirection: 'column',       // 垂直方向排列
};

/**
 * 标签页切换事件处理函数
 * @param key - 当前激活的标签页key值
 */
const onChange = (key: string) => {
    // console.log(key); // 调试用，打印当前选中的标签页key
};

/**
 * 标签页配置数组
 * 定义了两个标签页：标注任务管理和标注任务审核
 */
const items: TabsProps['items'] = [
    {
        key: '1',                          // 标签页唯一标识
        label: '标注任务管理',              // 标签页显示名称
        children: 'Content of Tab Pane 1', // 标签页内容（待替换为实际组件）
    },
    {
        key: '2',                          // 标签页唯一标识
        label: '标注任务审核',              // 标签页显示名称
        children: 'Content of Tab Pane 2', // 标签页内容（待替换为实际组件）
    },
];

/**
 * Review组件 - LLM对话标注审核系统主页面
 * 
 * 功能描述：
 * - 提供标注任务管理和审核的统一入口
 * - 使用标签页形式组织不同功能模块
 * - 包含系统头部导航、主内容区域和页脚
 * 
 * 组件结构：
 * - Header: 显示应用图标和标题
 * - Content: 包含标签页，承载具体功能页面
 * - Footer: 显示系统名称
 */
function Review() {
    return (
        <ConfigProvider theme={theme}>
            {/* 整体布局容器 */}
            <Layout style={layoutStyle}>
                {/* 头部导航栏 */}
                <Header style={{ ...headerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 64 }}>
                    {/* 头部内容容器，使用Space组件实现图标和标题的水平排列 */}
                    <Space align="center" style={{ display: 'flex', alignItems: 'center' }}>
                        {/* 应用图标 - 文档图标，使用青色主题色 */}
                        <FileTextOutlined style={{ fontSize: 24, color: '#00BFA5', display: 'flex', alignItems: 'center' }} />
                        {/* 应用标题 - 使用Typography.Title组件 */}
                        <Title level={3} style={{ margin: 0, color: '#222222', lineHeight: 1 }}>
                            LLM 对话标注审核系统
                        </Title>
                    </Space>
                </Header>
                
                {/* 主内容区域 */}
                <Content style={contentStyle}>
                    {/* 标签页组件 - 承载不同功能模块 */}
                    <Tabs
                        defaultActiveKey="1"                    // 默认激活第一个标签页
                        animated={{inkBar: true, tabPane: true}} // 启用标签栏和面板切换动画
                        items={items}                           // 标签页配置数组
                        size="large"                            // 大尺寸标签页
                        tabBarGutter={40}                       // 标签页之间的间距
                        onChange={onChange}                     // 标签页切换回调函数
                        style={{ height: '100%', padding: '16px' }} // 充满容器高度，添加内边距
                    />
                </Content>
                
                {/* 页脚 - 显示系统品牌名称 */}
                <Footer style={footerStyle}>VectorForge</Footer>
            </Layout>
        </ConfigProvider>
    )
}

// 导出组件供其他模块使用
export default Review;