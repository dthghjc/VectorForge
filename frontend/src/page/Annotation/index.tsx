/**
 * 重构后的标注页面
 * 使用正确的数据流：Task → TaskChat → Chat + Messages
 * 
 * 核心改进：
 * 1. 遵循数据库设计的层级结构
 * 2. 分离 Chat 级别和 Message 级别标注
 * 3. 正确使用 annotation_data JSON 字段
 * 4. 简化组件职责，消除复杂性
 */

import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Typography, 
  Space, 
  Button, 
  Spin,
  Card,
  Row,
  Col,
  Statistic,
  Alert,
  Progress,
  Tag
} from 'antd';
import { 
  TagOutlined, 
  ReloadOutlined,
  BarChartOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useTaskChatData } from '../../hooks/useTaskChatData';
import TaskChatList from '../../components/annotation/TaskChatList';
import AnnotationWorkspace from '../../components/annotation/AnnotationWorkspace';
import type { TaskChatListItem } from '../../types/annotation';

const { Header, Content } = Layout;
const { Title } = Typography;

// ============= 样式定义 =============

const layoutStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#f5f5f5',
};

const headerStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  borderBottom: '1px solid #f0f0f0',
  padding: '0 24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
};

const contentStyle: React.CSSProperties = {
  padding: '24px',
  minHeight: 'calc(100vh - 64px)',
};

// ============= 主组件 =============

const Annotation: React.FC = () => {
  
  // ============= 状态管理 =============
  
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [workspaceVisible, setWorkspaceVisible] = useState(false);
  
  // 使用数据管理 Hook
  const {
    // 状态数据
    tasks,
    currentTask,
    taskChats,
    currentTaskChat,
    tasksLoading,
    taskChatsLoading,
    annotating,
    pagination,
    
    // 计算属性
    hasNext,
    hasPrevious,
    pendingCount,
    completedCount,
    
    // 操作方法
    fetchTasks,
    selectTask,
    fetchTaskChats,
    selectTaskChat,
    submitChatAnnotation,
    goToNextTaskChat,
    goToPreviousTaskChat,
    clearSelection,
    changePage,
  } = useTaskChatData();

  // ============= 副作用处理 =============

  // 组件挂载时获取任务列表
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // 当选择任务时，获取该任务的对话列表
  useEffect(() => {
    if (selectedTaskId) {
      selectTask(selectedTaskId).then(() => {
        fetchTaskChats(selectedTaskId);
      });
    } else {
      clearSelection();
    }
  }, [selectedTaskId, selectTask, fetchTaskChats, clearSelection]);

  // ============= 事件处理函数 =============

  /**
   * 选择任务
   */
  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
    // 清空搜索和筛选条件
    setSearchText('');
    setStatusFilter('');
  };

  /**
   * 开始标注对话
   */
  const handleAnnotate = async (taskChatItem: TaskChatListItem) => {
    if (!currentTask) return;
    
    try {
      await selectTaskChat(currentTask.id, taskChatItem.id);
      setWorkspaceVisible(true);
    } catch (error) {
      console.error('打开标注工作区失败:', error);
    }
  };

  /**
   * 关闭标注工作区
   */
  const handleWorkspaceClose = () => {
    setWorkspaceVisible(false);
  };

  /**
   * 保存标注
   */
  const handleSave = async (updatedTaskChatDetail: any) => {
    if (!currentTask || !currentTaskChat) return;

    await submitChatAnnotation(
      currentTask.id,
      currentTaskChat.id,
      {
        annotation_result: updatedTaskChatDetail.annotation_result,
        annotation_comment: updatedTaskChatDetail.annotation_comment,
        annotation_data: updatedTaskChatDetail.annotation_data,
      }
    );

    // 刷新任务对话列表
    await fetchTaskChats(currentTask.id);
  };

  /**
   * 切换到下一个对话
   */
  const handleNext = async () => {
    await goToNextTaskChat();
  };

  /**
   * 切换到上一个对话
   */
  const handlePrevious = async () => {
    await goToPreviousTaskChat();
  };

  /**
   * 刷新数据
   */
  const handleRefresh = () => {
    if (selectedTaskId) {
      fetchTaskChats(selectedTaskId);
    }
    fetchTasks();
  };

  /**
   * 处理分页变化
   */
  const handlePageChange = (page: number, pageSize: number) => {
    if (selectedTaskId) {
      changePage(selectedTaskId, page, pageSize);
    }
  };

  // ============= 计算数据 =============

  const filteredTasks = (tasks || []).filter(task => {
    const isNotCancelled = task.status !== 'cancelled';
    const hasAssignedTo = Boolean(task.assigned_to_id);
    return isNotCancelled && hasAssignedTo;
  });

  // ============= 渲染 =============
  
  return (
      <Layout style={layoutStyle}>
        {/* 页面头部 */}
      <Header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Space>
            <TagOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
            <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
              标注系统
            </Title>
          </Space>
        </div>

        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={handleRefresh}
            loading={tasksLoading || taskChatsLoading}
          >
            刷新
          </Button>
          </Space>
        </Header>
        
      {/* 主内容区 */}
        <Content style={contentStyle}>
        {!selectedTaskId ? (
          // 任务列表显示
          <div>
            <div style={{ marginBottom: '24px' }}>
              <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                <TagOutlined style={{ marginRight: '8px' }} />
                我的标注任务
              </Title>
              <p style={{ color: '#666', margin: '8px 0 0 0' }}>
                选择一个任务开始标注工作
              </p>
            </div>
            
            {tasksLoading ? (
              <Card>
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Spin size="large" />
                  <p style={{ marginTop: '16px', color: '#666' }}>加载任务列表...</p>
                </div>
              </Card>
            ) : filteredTasks.length === 0 ? (
              <Card>
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <TagOutlined style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }} />
                  <Title level={4} style={{ color: '#999' }}>暂无标注任务</Title>
                  <p style={{ color: '#666' }}>当前没有分配给您的标注任务</p>
                </div>
              </Card>
            ) : (
              <Row gutter={[16, 16]}>
                {filteredTasks.map(task => (
                  <Col key={task.id} xs={24} sm={12} lg={8} xl={6}>
                    <Card
                      hoverable
                      style={{ height: '100%' }}
                      actions={[
                        <Button 
                          type="primary" 
                          onClick={() => handleTaskSelect(task.id)}
                          style={{ width: '80%' }}
                        >
                          开始标注
                        </Button>
                      ]}
                    >
                      <div style={{ marginBottom: '12px' }}>
                        <Title level={5} style={{ margin: 0, marginBottom: '8px' }} ellipsis>
                          {task.title}
                        </Title>
                        {task.description && (
                          <p style={{ 
                            color: '#666', 
                            fontSize: '12px', 
                            margin: 0,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {task.description}
                          </p>
                        )}
                      </div>
                      
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', color: '#666' }}>进度</span>
                          <span style={{ fontSize: '12px', fontWeight: 500 }}>
                            {task.completed_chats}/{task.total_chats}
                          </span>
                        </div>
                        <Progress 
                          percent={Number(task.completion_rate?.toFixed(1)) || 0}
                          size="small"
                          strokeColor={
                            (task.completion_rate || 0) >= 80 ? '#52c41a' :
                            (task.completion_rate || 0) >= 50 ? '#faad14' : '#ff4d4f'
                          }
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: '#666' }}>优先级</span>
                          <Tag color={
                            task.priority === 'high' ? 'red' : 
                            task.priority === 'normal' ? 'blue' : 'default'
                          }>
                            {task.priority === 'high' ? '高' : 
                             task.priority === 'normal' ? '普通' : '低'}
                          </Tag>
                        </div>
                        
                        {task.deadline && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: '#666' }}>截止时间</span>
                            <span style={{ 
                              fontSize: '12px', 
                              color: task.is_overdue ? '#ff4d4f' : '#666',
                              fontWeight: task.is_overdue ? 500 : 'normal'
                            }}>
                              {new Date(task.deadline).toLocaleDateString('zh-CN')}
                            </span>
                          </div>
                        )}
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: '#666' }}>状态</span>
                          <Tag color={
                            task.status === 'in_progress' ? 'processing' :
                            task.status === 'completed' ? 'success' : 'default'
                          }>
                            {task.status === 'in_progress' ? '进行中' :
                             task.status === 'completed' ? '已完成' : task.status}
                          </Tag>
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </div>
        ) : (
          <div>
            {/* 返回任务列表按钮 */}
            <div style={{ marginBottom: '16px' }}>
              <Button 
                onClick={() => setSelectedTaskId(null)}
                style={{ marginRight: '16px' }}
              >
                ← 返回任务列表
              </Button>
              {currentTask && (
                <span style={{ fontSize: '16px', fontWeight: 500, color: '#1890ff' }}>
                  {currentTask.title}
                </span>
              )}
            </div>

            {/* 统计信息卡片 */}
            <Row gutter={16} style={{ marginBottom: '24px' }}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="总对话数"
                    value={currentTask?.total_chats || 0}
                    loading={tasksLoading}
                    prefix={<FileTextOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="已完成"
                    value={completedCount}
                    loading={taskChatsLoading}
                    valueStyle={{ color: '#3f8600' }}
                    prefix={<BarChartOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="待标注"
                    value={pendingCount}
                    loading={taskChatsLoading}
                    valueStyle={{ color: '#faad14' }}
                    prefix={<BarChartOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="完成率"
                    value={currentTask?.completion_rate || 0}
                    loading={tasksLoading}
                    precision={1}
                    suffix="%"
                    valueStyle={{ 
                      color: (currentTask?.completion_rate || 0) > 80 ? '#3f8600' : '#cf1322' 
                    }}
                    prefix={<BarChartOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            {/* 任务状态提醒 */}
            {currentTask?.is_overdue && (
              <Alert
                message="任务已逾期"
                description={`截止时间：${new Date(currentTask.deadline!).toLocaleString('zh-CN')}`}
                type="warning"
                showIcon
                style={{ marginBottom: '16px' }}
              />
            )}

            {/* 对话列表 */}
            <Card>
              <Spin spinning={taskChatsLoading}>
                <TaskChatList
                  task={currentTask}
                  taskChats={taskChats}
                  loading={taskChatsLoading}
                  pagination={pagination}
            onAnnotate={handleAnnotate}
            searchText={searchText}
            onSearchChange={setSearchText}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
                  onPageChange={handlePageChange}
                />
              </Spin>
            </Card>
          </div>
        )}

        {/* 标注工作区模态框 */}
        <AnnotationWorkspace
          visible={workspaceVisible}
          taskChatDetail={currentTaskChat}
          loading={taskChatsLoading}
          saving={annotating}
          onClose={handleWorkspaceClose}
          onSave={handleSave}
            onNext={handleNext}
            onPrevious={handlePrevious}
            hasNext={hasNext}
            hasPrevious={hasPrevious}
          />
      </Content>
      </Layout>
  );
};

export default Annotation;