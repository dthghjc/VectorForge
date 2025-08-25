/**
 * 标注工作区组件
 * 集成 Chat 级别和 Message 级别的标注功能
 */

import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Button, 
  Space, 
  Divider, 
  Spin, 
  message,
  Tabs,
  Tag
} from 'antd';
import { 
  LeftOutlined, 
  RightOutlined, 
  SaveOutlined, 
  CloseOutlined,
  MessageOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import type { TaskChatDetail } from '../../types/annotation';
import { useAnnotationForm } from '../../hooks/useAnnotationForm';
import ChatAnnotationPanel from './ChatAnnotationPanel.tsx';
import MessageAnnotationPanel from './MessageAnnotationPanel.tsx';
import ChatDisplay from './ChatDisplay.tsx';

// ============= 组件属性 =============

interface AnnotationWorkspaceProps {
  /** 是否显示模态框 */
  visible: boolean;
  /** 当前标注的 TaskChat 详情 */
  taskChatDetail: TaskChatDetail | null;
  /** 加载状态 */
  loading?: boolean;
  /** 保存中状态 */
  saving?: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 保存标注回调 */
  onSave: (taskChatDetail: TaskChatDetail) => Promise<void>;
  /** 切换到下一个回调 */
  onNext?: () => void;
  /** 切换到上一个回调 */
  onPrevious?: () => void;
  /** 是否有下一个 */
  hasNext?: boolean;
  /** 是否有上一个 */
  hasPrevious?: boolean;
}

// ============= Tab 配置 =============

interface TabItem {
  key: string;
  label: React.ReactNode;
  children: React.ReactNode;
}

// ============= 主组件 =============

const AnnotationWorkspace: React.FC<AnnotationWorkspaceProps> = ({
  visible,
  taskChatDetail,
  loading = false,
  saving = false,
  onClose,
  onSave,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false,
}) => {
  
  // ============= 状态管理 =============
  
  const [activeTab, setActiveTab] = useState('chat');
  const [localSaving, setLocalSaving] = useState(false);
  
  // 使用标注表单 Hook
  const {
    chatFormInstance: chatForm,
    validateAllForms,
    extractAllFormData,
    hasChanges,
    resetAllForms,
  } = useAnnotationForm(taskChatDetail);

  // ============= 副作用处理 =============

  // 当对话变化时，重置到 Chat 标注页签
  useEffect(() => {
    if (taskChatDetail) {
      setActiveTab('chat');
    }
  }, [taskChatDetail?.id]);

  // ============= 事件处理 =============

  /**
   * 保存标注数据
   */
  const handleSave = async () => {
    if (!taskChatDetail) return;

    try {
      setLocalSaving(true);
      
      // 验证所有表单
      const isValid = await validateAllForms();
      if (!isValid) {
        message.error('请完成必填项');
        return;
      }

      // 提取表单数据
      const formData = extractAllFormData();
      
      // 构造保存数据（这里只处理 Chat 级别，Message 级别需要单独处理）
      const updatedTaskChatDetail: TaskChatDetail = {
        ...taskChatDetail,
        annotation_status: 'completed',
        annotation_result: formData.chatAnnotation.annotation_result,
        annotation_comment: formData.chatAnnotation.annotation_comment,
        annotation_data: formData.chatAnnotation.annotation_data,
        annotated_at: new Date().toISOString(),
      };

      await onSave(updatedTaskChatDetail);
      message.success('标注保存成功');
      
    } catch (error) {
      console.error('保存标注失败:', error);
      message.error('保存标注失败');
    } finally {
      setLocalSaving(false);
    }
  };

  /**
   * 保存并继续下一个
   */
  const handleSaveAndNext = async () => {
    await handleSave();
    if (hasNext && onNext) {
      onNext();
    }
  };

  /**
   * 关闭前确认
   */
  const handleClose = () => {
    if (hasChanges) {
      Modal.confirm({
        title: '确认关闭',
        content: '有未保存的修改，确认关闭吗？',
        onOk: () => {
          resetAllForms();
          onClose();
        },
      });
    } else {
      onClose();
    }
  };

  // ============= 渲染内容 =============

  if (!taskChatDetail) {
    return null;
  }

  // 构建标签页
  const tabItems: TabItem[] = [
    {
      key: 'chat',
      label: (
        <Space>
          <MessageOutlined />
          对话标注
          {taskChatDetail.annotation_status === 'completed' && (
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
          )}
        </Space>
      ),
      children: (
        <div style={{ display: 'flex', gap: '16px', height: '600px' }}>
          {/* 左侧：对话显示 */}
          <div style={{ flex: '1 1 50%', minWidth: '400px' }}>
            <ChatDisplay 
              chat={taskChatDetail.chat}
              task={taskChatDetail.task}
              style={{ height: '100%' }}
            />
          </div>
          
          {/* 右侧：Chat 级别标注面板 */}
          <div style={{ flex: '1 1 50%', minWidth: '400px' }}>
            <ChatAnnotationPanel 
              taskChatDetail={taskChatDetail}
              form={chatForm}
              style={{ height: '100%' }}
            />
          </div>
        </div>
      ),
    },
  ];

  // 如果有 assistant 消息，添加消息标注页签
  const assistantMessages = taskChatDetail.chat.messages.filter(m => m.role === 'assistant');
  if (assistantMessages.length > 0) {
    assistantMessages.forEach((message, index) => {
      tabItems.push({
        key: `message-${message.id}`,
        label: (
          <Space>
            <MessageOutlined />
            消息 {index + 1}

          </Space>
        ),
        children: (
          <div style={{ display: 'flex', gap: '16px', height: '600px' }}>
            {/* 左侧：消息上下文显示 */}
            <div style={{ flex: '1 1 50%', minWidth: '400px' }}>
              <ChatDisplay 
                chat={taskChatDetail.chat}
                task={taskChatDetail.task}
                highlightMessageId={message.id}
                style={{ height: '100%' }}
              />
            </div>
            
            {/* 右侧：Message 级别标注面板 */}
            <div style={{ flex: '1 1 50%', minWidth: '400px' }}>
              <MessageAnnotationPanel 
                message={message}
                style={{ height: '100%' }}
              />
            </div>
          </div>
        ),
      });
    });
  }

  return (
    <Modal
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span>标注工作区</span>
            <Divider type="vertical" />
            <Tag color="blue">{taskChatDetail.task.title}</Tag>
            <span style={{ fontWeight: 'normal', fontSize: '14px' }}>
              {taskChatDetail.chat_title || taskChatDetail.chat.title}
            </span>
          </div>
          
          {/* 导航按钮 */}
          <Space>
            <Button
              icon={<LeftOutlined />}
              disabled={!hasPrevious}
              onClick={onPrevious}
              size="small"
            >
              上一个
            </Button>
            <Button
              icon={<RightOutlined />}
              disabled={!hasNext}
              onClick={onNext}
              size="small"
            >
              下一个
            </Button>
            <Button
              icon={<CloseOutlined />}
              onClick={handleClose}
              size="small"
              type="text"
            >
              关闭
            </Button>
          </Space>
        </div>
      }
      open={visible}
      onCancel={handleClose}
      closable={false}
      width="90%"
      style={{ maxWidth: '1400px' }}
      styles={{ body: { padding: '20px' } }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* 左侧：状态信息 */}
          <div>
            {hasChanges && (
              <Tag color="orange">有未保存的修改</Tag>
            )}
            {taskChatDetail.annotation_status === 'completed' && (
              <Tag color="green">已完成标注</Tag>
            )}
          </div>
          
          {/* 右侧：操作按钮 */}
          <Space>
            <Button onClick={handleClose} icon={<CloseOutlined />}>
              关闭
            </Button>
            <Button
              type="primary"
              onClick={handleSave}
              loading={localSaving || saving}
              icon={<SaveOutlined />}
            >
              保存
            </Button>
            {hasNext && (
              <Button
                type="primary"
                onClick={handleSaveAndNext}
                loading={localSaving || saving}
                icon={<RightOutlined />}
              >
                保存并下一个
              </Button>
            )}
          </Space>
        </div>
      }
      destroyOnHidden
      maskClosable={false}
      keyboard={false}
    >
      <Spin spinning={loading}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
          style={{ height: '650px' }}
          tabBarStyle={{ marginBottom: '16px' }}
        />
      </Spin>
    </Modal>
  );
};

export default AnnotationWorkspace;
