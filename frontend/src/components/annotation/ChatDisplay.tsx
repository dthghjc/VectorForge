/**
 * 对话显示组件
 * 用于在标注工作区中显示对话内容
 */

import React from 'react';
import { Card, Avatar, Typography, Tag, Space, Divider } from 'antd';
import { UserOutlined, RobotOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { ChatWithMessages, Task } from '../../types/annotation';

const { Text, Paragraph } = Typography;

// ============= 组件属性 =============

interface ChatDisplayProps {
  /** 对话数据 */
  chat: ChatWithMessages;
  /** 任务数据 */
  task: Task;
  /** 高亮的消息 ID */
  highlightMessageId?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

// ============= 主组件 =============

const ChatDisplay: React.FC<ChatDisplayProps> = ({
  chat,
  task,
  highlightMessageId,
  style,
}) => {
  
  // ============= 渲染辅助函数 =============

  /**
   * 渲染消息项
   */
  const renderMessage = (message: any, index: number) => {
    const isUser = message.role === 'user';
    const isHighlighted = message.id === highlightMessageId;
    const hasAudits = message.audits && message.audits.length > 0;
    const latestAudit = hasAudits ? message.audits[0] : null;
    
    return (
      <div
        key={message.id}
        style={{
          marginBottom: '16px',
          padding: '12px',
          borderRadius: '8px',
          border: isHighlighted ? '2px solid #1890ff' : '1px solid #f0f0f0',
          backgroundColor: isHighlighted ? '#f6ffed' : '#fafafa',
          transition: 'all 0.3s ease',
        }}
      >
        {/* 消息头部 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: '8px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Avatar
              size="small"
              icon={isUser ? <UserOutlined /> : <RobotOutlined />}
              style={{
                backgroundColor: isUser ? '#87d068' : '#1890ff',
              }}
            />
            <Text strong style={{ fontSize: '13px' }}>
              {isUser ? '用户' : 'AI助手'}
            </Text>
            {isHighlighted && (
              <Tag color="blue" size="small">正在标注</Tag>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
            {/* 审核状态 */}
            {!isUser && (
              <>
                {message.audit_status === 'approved' && (
                  <Tag color="green" size="small">已通过</Tag>
                )}
                {message.audit_status === 'rejected' && (
                  <Tag color="red" size="small">已拒绝</Tag>
                )}
                {message.audit_status === 'pending' && (
                  <Tag color="orange" size="small">待审核</Tag>
                )}
              </>
            )}
            
            {/* 创建时间 */}
            <Text type="secondary" style={{ fontSize: '11px' }}>
              <ClockCircleOutlined style={{ marginRight: '4px' }} />
              {new Date(message.created_at).toLocaleString('zh-CN', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </div>
        </div>

        {/* 消息内容 */}
        <div style={{ 
          paddingLeft: isUser ? '0' : '28px',
          lineHeight: '1.6'
        }}>
          <Paragraph
            style={{
              margin: 0,
              fontSize: '14px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
            copyable={false}
          >
            {message.content}
          </Paragraph>
        </div>

        {/* 审核信息（仅 AI 消息） */}
        {!isUser && latestAudit && (
          <div style={{ 
            marginTop: '8px', 
            paddingTop: '8px', 
            borderTop: '1px solid #f0f0f0',
            fontSize: '12px'
          }}>
            <Space size="small" wrap>
              <Text type="secondary">最新审核:</Text>
              <Tag 
                color={latestAudit.status === 'approved' ? 'green' : 'red'}
                size="small"
              >
                {latestAudit.status === 'approved' ? '通过' : '拒绝'}
              </Tag>
              {latestAudit.comment && (
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  {latestAudit.comment}
                </Text>
              )}
            </Space>
          </div>
        )}

        {/* 元数据（如果存在） */}
        {message.meta_data && Object.keys(message.meta_data).length > 0 && (
          <div style={{ 
            marginTop: '8px', 
            paddingTop: '8px', 
            borderTop: '1px solid #f0f0f0' 
          }}>
            <details>
              <summary style={{ fontSize: '11px', color: '#666', cursor: 'pointer' }}>
                元数据 ▼
              </summary>
              <pre style={{ 
                fontSize: '10px', 
                color: '#666', 
                margin: '4px 0 0 0',
                maxHeight: '100px',
                overflow: 'auto',
                background: '#f8f8f8',
                padding: '4px',
                borderRadius: '4px'
              }}>
                {JSON.stringify(message.meta_data, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    );
  };

  // ============= 渲染 =============

  return (
    <div style={style}>
      <Card 
        title={
          <Space>
            <span>对话内容</span>
            <Tag color="blue">{chat.messages.length} 条消息</Tag>
          </Space>
        }
        size="small"
        style={{ height: '100%' }}
        styles={{ 
          body: { 
            height: 'calc(100% - 57px)', 
            overflow: 'auto',
            padding: '12px' 
          }
        }}
      >
        {/* 对话信息头部 */}
        <div style={{ 
          marginBottom: '16px', 
          padding: '12px', 
          background: '#f6f8fa', 
          borderRadius: '6px',
          border: '1px solid #e1e4e8'
        }}>
          <div style={{ fontSize: '13px' }}>
            <div style={{ marginBottom: '6px' }}>
              <Text strong>对话标题:</Text>
              <span style={{ marginLeft: '8px' }}>{chat.title}</span>
            </div>
            <div style={{ marginBottom: '6px' }}>
              <Text strong>任务:</Text>
              <span style={{ marginLeft: '8px' }}>{task.title}</span>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div>
                <Text strong>创建时间:</Text>
                <span style={{ marginLeft: '8px' }}>
                  {new Date(chat.created_at).toLocaleString('zh-CN')}
                </span>
              </div>
              <div>
                <Text strong>消息统计:</Text>
                <span style={{ marginLeft: '8px' }}>
                  用户 {chat.messages.filter(m => m.role === 'user').length} 条，
                  AI {chat.messages.filter(m => m.role === 'assistant').length} 条
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 消息列表 */}
        <div>
          {chat.messages.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: '#999', 
              padding: '40px 0' 
            }}>
              暂无消息
            </div>
          ) : (
            chat.messages.map((message, index) => renderMessage(message, index))
          )}
        </div>

        {/* 对话结束标记 */}
        {chat.messages.length > 0 && (
          <div style={{ 
            textAlign: 'center', 
            margin: '20px 0',
            color: '#999',
            fontSize: '12px'
          }}>
            <Divider>
              <Text type="secondary">对话结束</Text>
            </Divider>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ChatDisplay;
