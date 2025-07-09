import React, { useState, useMemo } from 'react';
import { ConfigProvider, Flex, Layout, Typography, Space } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import TaskTable from '../../components/annotation/TaskTable';
import AnnotationModal from '../../components/annotation/AnnotationModal';
import { mockTasks } from '../../data/mockData';
import { theme } from '../../components/annotation/theme';
import type { AnnotationTask } from '../../components/annotation/types.ts';

const { Header, Footer, Content } = Layout;
const { Title } = Typography;

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
  
  /** 任务列表数据 - 包含所有标注任务 */
  const [tasks, setTasks] = useState<AnnotationTask[]>(mockTasks);
  
  /** 当前正在标注的任务 */
  const [currentTask, setCurrentTask] = useState<AnnotationTask | null>(null);
  
  /** 当前任务在任务列表中的索引位置 */
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  
  /** 标注模态框的显示状态 */
  const [modalVisible, setModalVisible] = useState(false);
  
  /** 搜索文本内容 */
  const [searchText, setSearchText] = useState('');
  
  /** 任务状态筛选条件 */
  const [statusFilter, setStatusFilter] = useState<string>('');

  // ========== 数据计算 ==========
  
  /**
   * 过滤后的任务列表
   * 根据搜索文本和状态筛选条件动态计算
   */
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // 搜索匹配逻辑：任务ID、对话预览、标注员姓名
      const matchesSearch = !searchText || 
        task.id.toLowerCase().includes(searchText.toLowerCase()) ||
        task.dialoguePreview.toLowerCase().includes(searchText.toLowerCase()) ||
        task.annotator.toLowerCase().includes(searchText.toLowerCase());
      
      // 状态筛选逻辑
      const matchesStatus = !statusFilter || task.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [tasks, searchText, statusFilter]);

  // ========== 事件处理函数 ==========
  
  /**
   * 开始标注任务
   * @param task - 要标注的任务对象
   */
  const handleAnnotate = (task: AnnotationTask) => {
    setCurrentTask(task);
    // 在原始任务列表中查找索引位置，用于任务间切换
    setCurrentTaskIndex(tasks.findIndex(t => t.id === task.id));
    setModalVisible(true);
  };

  /**
   * 关闭标注模态框
   */
  const handleModalClose = () => {
    setModalVisible(false);
    setCurrentTask(null);
  };

  /**
   * 保存标注结果
   * @param updatedTask - 更新后的任务对象
   */
  const handleSave = (updatedTask: AnnotationTask) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === updatedTask.id 
          ? { 
              ...updatedTask, 
              status: 'annotated' as const, // 标记为已标注状态
              lastUpdate: new Date().toLocaleString() // 更新时间戳
            }
          : task
      )
    );
    // 同步更新当前任务状态
    setCurrentTask(updatedTask);
  };

  /**
   * 切换到下一个任务
   * 在标注模态框中快速切换任务
   */
  const handleNext = () => {
    if (currentTaskIndex < tasks.length - 1) {
      const nextIndex = currentTaskIndex + 1;
      setCurrentTaskIndex(nextIndex);
      setCurrentTask(tasks[nextIndex]);
    }
  };

  /**
   * 切换到上一个任务
   * 在标注模态框中快速切换任务
   */
  const handlePrevious = () => {
    if (currentTaskIndex > 0) {
      const prevIndex = currentTaskIndex - 1;
      setCurrentTaskIndex(prevIndex);
      setCurrentTask(tasks[prevIndex]);
    }
  };

  // ========== 导航状态计算 ==========
  
  /** 是否可以切换到下一个任务 */
  const hasNext = currentTaskIndex < tasks.length - 1;
  
  /** 是否可以切换到上一个任务 */
  const hasPrevious = currentTaskIndex > 0;

  // ========== 页面渲染 ==========
  
  return (
    <ConfigProvider theme={theme}>
      <Layout style={layoutStyle}>
        {/* 页面头部 */}
        <Header style={headerStyle}>
          <Space align="center">
            {/* 应用图标 */}
            <FileTextOutlined style={{ fontSize: 24, color: '#00BFA5' }} />
            {/* 应用标题 */}
            <Title level={3} style={{ margin: 0, color: '#222222' }}>
              LLM 对话标注系统
            </Title>
          </Space>
        </Header>
        
        {/* 主要内容区域 */}
        <Content style={contentStyle}>
          {/* 任务列表表格 */}
          <TaskTable
            tasks={filteredTasks}
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
        <AnnotationModal
          visible={modalVisible}
          task={currentTask}
          allTasks={tasks}
          onClose={handleModalClose}
          onSave={handleSave}
          onNext={handleNext}
          onPrevious={handlePrevious}
          hasNext={hasNext}
          hasPrevious={hasPrevious}
        />
      </Layout>
    </ConfigProvider>
  );
}

export default Annotation;


