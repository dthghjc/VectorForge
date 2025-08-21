import React, { useState, useMemo } from 'react';
import { ConfigProvider, Layout, Typography, Space } from 'antd';
import { TagOutlined } from '@ant-design/icons';
import ChatTable from '../../components/annotation/ChatTable';
import AnnotationModal from '../../components/annotation/AnnotationModal';
import { mockChatListItems } from '../../data/mockData';
import { theme } from '../../components/annotation/theme';
import type { ChatListItem, Chat } from '../../components/annotation/types.ts';

const { Header, Footer, Content } = Layout;
const { Title } = Typography;

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#000',
  height: 64,
  paddingInline: 48,
  lineHeight: '64px',
  backgroundColor: '#fff',
  borderBottom: '1px solid #fafafa', // 更浅的分隔线
};

// 修改 contentStyle：移除固定高度，使用 flex: 1 填充剩余空间
const contentStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#000',
  backgroundColor: '#fff',
  flex: 1, // 保留此项，使 Content 区域能填充 Header 和 Footer 之间的垂直空间
  // 移除 display: 'flex' 和其他 flex 属性，让它回归到普通的块级容器
  // 我们直接在这里设置内边距，为表格提供呼吸空间
  flexDirection: 'column',
  padding: '24px',
};

const footerStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#000',
  backgroundColor: '#fff',
};

// 修改 layoutStyle：使用 100% 宽度而不是 100vw，避免超出视口导致右侧被切掉
const layoutStyle: React.CSSProperties = {
  borderRadius: 8,
  overflow: 'hidden',
  width: '100%', // 修改：使用 100% 而不是 100vw，避免超出父容器
  height: '100vh', // 占据整个视口高度
  display: 'flex', // 关键：将 Layout 自身设置为 Flex 容器
  flexDirection: 'column', // 关键：Header, Content, Footer 垂直排列
  maxWidth: '100vw', // 添加：确保不超过视口宽度
  boxSizing: 'border-box', // 添加：确保 padding 和 border 包含在宽度内
};

/**
 * LLM 对话标注系统主页面组件
 * 
 * 功能概述：
 * - 展示标注任务列表
 * - 提供任务搜索和筛选功能
 * - 支持任务标注操作
 * - 管理标注模态框的显示和隐藏
 * 
 * 主要特性：
 * - 响应式布局设计
 * - 实时搜索和状态筛选
 * - 任务间快速切换
 * - 自动保存标注结果
 */
function Annotation() {
  // ========== 状态管理 ==========
  
  /** Chat列表数据 - 包含所有待标注的对话 */
  const [chatItems, setChatItems] = useState<ChatListItem[]>(mockChatListItems);
  
  /** 当前正在标注的Chat */
  const [currentChatItem, setCurrentChatItem] = useState<ChatListItem | null>(null);
  
  /** 当前Chat在列表中的索引位置 */
  const [currentChatIndex, setCurrentChatIndex] = useState(0);
  
  /** 标注模态框的显示状态 */
  const [modalVisible, setModalVisible] = useState(false);
  
  /** 搜索文本内容 */
  const [searchText, setSearchText] = useState('');
  
  /** 标注状态筛选条件 */
  const [statusFilter, setStatusFilter] = useState<string>('');

  // ========== 数据计算 ==========
  
  /**
   * 过滤后的Chat列表
   * 根据搜索文本和状态筛选条件动态计算
   */
  const filteredChatItems = useMemo(() => {
    return chatItems.filter(chatItem => {
      // 搜索匹配逻辑：对话标题、任务名称、任务描述
      const matchesSearch = !searchText || 
        chatItem.chat.title.toLowerCase().includes(searchText.toLowerCase()) ||
        chatItem.task.title.toLowerCase().includes(searchText.toLowerCase()) ||
        chatItem.task.description.toLowerCase().includes(searchText.toLowerCase());
      
      // 状态筛选逻辑
      const matchesStatus = !statusFilter || chatItem.chat.annotationStatus === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [chatItems, searchText, statusFilter]);

  // ========== 事件处理函数 ==========
  
  /**
   * 开始标注Chat
   * @param chatItem - 要标注的ChatListItem对象
   */
  const handleAnnotate = (chatItem: ChatListItem) => {
    setCurrentChatItem(chatItem);
    // 在原始Chat列表中查找索引位置，用于Chat间切换
    setCurrentChatIndex(chatItems.findIndex(item => item.chat.id === chatItem.chat.id));
    setModalVisible(true);
  };

  /**
   * 关闭标注模态框
   */
  const handleModalClose = () => {
    setModalVisible(false);
    setCurrentChatItem(null);
  };

  /**
   * 保存标注结果
   * @param updatedChat - 更新后的Chat对象
   */
  const handleSave = (updatedChat: Chat) => {
    setChatItems(prevChatItems => 
      prevChatItems.map(chatItem => 
        chatItem.chat.id === updatedChat.id 
          ? { 
              ...chatItem,
              chat: {
                ...updatedChat, 
                annotationStatus: 'completed' as const, // 标记为已完成状态
                createdAt: new Date().toISOString() // 更新时间戳
              }
            }
          : chatItem
      )
    );
    // 同步更新当前Chat状态
    if (currentChatItem) {
      setCurrentChatItem({
        ...currentChatItem,
        chat: updatedChat
      });
    }
  };

  /**
   * 切换到下一个Chat
   * 在标注模态框中快速切换Chat
   */
  const handleNext = () => {
    if (currentChatIndex < chatItems.length - 1) {
      const nextIndex = currentChatIndex + 1;
      setCurrentChatIndex(nextIndex);
      setCurrentChatItem(chatItems[nextIndex]);
    }
  };

  /**
   * 切换到上一个Chat
   * 在标注模态框中快速切换Chat
   */
  const handlePrevious = () => {
    if (currentChatIndex > 0) {
      const prevIndex = currentChatIndex - 1;
      setCurrentChatIndex(prevIndex);
      setCurrentChatItem(chatItems[prevIndex]);
    }
  };

  // ========== 导航状态计算 ==========
  
  /** 是否可以切换到下一个Chat */
  const hasNext = currentChatIndex < chatItems.length - 1;
  
  /** 是否可以切换到上一个Chat */
  const hasPrevious = currentChatIndex > 0;

  // ========== 页面渲染 ==========
  
  return (
    <ConfigProvider theme={theme}>
      <Layout style={layoutStyle}>
        {/* 页面头部 */}
        <Header style={{ ...headerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 64 }}>
          <Space align="center" style={{ display: 'flex', alignItems: 'center' }}>
            {/* 应用图标 */}
            <TagOutlined style={{ fontSize: 24, color: '#00BFA5', display: 'flex', alignItems: 'center' }} />
            {/* 应用标题 */}
            <Title level={3} style={{ margin: 0, color: '#222222', lineHeight: 1 }}>
              LLM 对话标注系统
            </Title>
          </Space>
        </Header>
        
        {/* 主要内容区域 */}
        <Content style={contentStyle}>
          {/* Chat列表表格 */}
          <ChatTable
            chatItems={filteredChatItems}
            onAnnotate={handleAnnotate}
            searchText={searchText}
            onSearchChange={setSearchText}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            style={{ width: '100%' }}
          />
        </Content>
        {/* 页面底部 */}
        <Footer style={footerStyle}>VectorForge</Footer>
        
        {/* 标注工作模态框 */}
        {currentChatItem && (
          <AnnotationModal
            visible={modalVisible}
            task={{
              id: currentChatItem.chat.id,
              dialoguePreview: `${currentChatItem.chat.title} - ${currentChatItem.task.title}`,
              status: 'pending',
              llmModel: currentChatItem.chat.llmModel,
              ragEnabled: currentChatItem.chat.ragEnabled,
              annotator: currentChatItem.chat.annotator,
              lastUpdate: currentChatItem.chat.createdAt,
              dialogue: currentChatItem.chat.dialogue,
              intentCategory: currentChatItem.chat.intentCategory,
              completeness: currentChatItem.chat.completeness,
              overallSatisfaction: currentChatItem.chat.overallSatisfaction,
              generalNotes: currentChatItem.chat.generalNotes
            }}
            allTasks={chatItems.map(item => ({
              id: item.chat.id,
              dialoguePreview: `${item.chat.title} - ${item.task.title}`,
              status: 'pending',
              llmModel: item.chat.llmModel,
              ragEnabled: item.chat.ragEnabled,
              annotator: item.chat.annotator,
              lastUpdate: item.chat.createdAt,
              dialogue: item.chat.dialogue,
              intentCategory: item.chat.intentCategory,
              completeness: item.chat.completeness,
              overallSatisfaction: item.chat.overallSatisfaction,
              generalNotes: item.chat.generalNotes
            }))}
            onClose={handleModalClose}
            onSave={(updatedTask) => {
              // 将AnnotationTask转换回Chat格式
              const updatedChat: Chat = {
                id: updatedTask.id,
                title: currentChatItem.chat.title,
                taskId: currentChatItem.chat.taskId,
                messageCount: currentChatItem.chat.messageCount,
                createdAt: updatedTask.lastUpdate,
                annotationStatus: 'completed',
                llmModel: updatedTask.llmModel,
                ragEnabled: updatedTask.ragEnabled,
                annotator: updatedTask.annotator,
                dialogue: updatedTask.dialogue,
                intentCategory: updatedTask.intentCategory,
                completeness: updatedTask.completeness,
                overallSatisfaction: updatedTask.overallSatisfaction,
                generalNotes: updatedTask.generalNotes
              };
              handleSave(updatedChat);
            }}
            onNext={handleNext}
            onPrevious={handlePrevious}
            hasNext={hasNext}
            hasPrevious={hasPrevious}
          />
        )}
      </Layout>
    </ConfigProvider>
  );
}

export default Annotation;


