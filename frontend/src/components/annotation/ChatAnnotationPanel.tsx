/**
 * Chat 级别标注面板
 * 处理对话整体的标注：意图分类、完整性、满意度等
 */

import React from 'react';
import { 
  Form, 
  Card, 
  Select, 
  Rate, 
  Input, 
  Radio, 
  Space,
  Divider,
  Typography
} from 'antd';
import { MessageOutlined, StarOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import type { TaskChatDetail, ChatAnnotationForm } from '../../types/annotation';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// ============= 组件属性 =============

interface ChatAnnotationPanelProps {
  /** TaskChat 详情数据 */
  taskChatDetail: TaskChatDetail;
  /** 表单实例 */
  form: FormInstance<ChatAnnotationForm>;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

// ============= 选项配置 =============

const INTENT_CATEGORY_OPTIONS = [
  { value: 'information_query', label: '信息查询', description: '用户询问具体信息或知识' },
  { value: 'instruction_following', label: '指令遵循', description: '用户要求执行特定任务' },
  { value: 'content_creation', label: '内容创作', description: '用户要求创作内容' },
  { value: 'chat', label: '闲聊', description: '日常对话交流' },
];

const COMPLETENESS_OPTIONS = [
  { value: 'complete', label: '完整', description: '对话目标已达成，用户问题得到充分解答' },
  { value: 'incomplete', label: '不完整', description: '对话目标未完全达成，存在遗漏或需要进一步澄清' },
];

const ANNOTATION_RESULT_OPTIONS = [
  { value: 'approved', label: '通过', description: '对话质量良好，符合要求' },
  { value: 'rejected', label: '拒绝', description: '对话质量不佳，需要改进' },
  { value: 'flagged', label: '标记', description: '对话存在问题，需要进一步审查' },
];

// ============= 主组件 =============

const ChatAnnotationPanel: React.FC<ChatAnnotationPanelProps> = ({
  taskChatDetail,
  form,
  style,
}) => {
  
  // ============= 统计信息 =============
  
  const messageCount = taskChatDetail.chat.message_count || taskChatDetail.chat.messages.length;
  const userMessages = taskChatDetail.chat.messages.filter(m => m.role === 'user').length;
  const assistantMessages = taskChatDetail.chat.messages.filter(m => m.role === 'assistant').length;

  // ============= 渲染 =============

  return (
    <div style={{ ...style, overflow: 'auto' }}>
      <Card 
        title={
          <Space>
            <MessageOutlined />
            对话级别标注
          </Space>
        }
        size="small"
        style={{ height: '100%' }}
        styles={{ body: { height: 'calc(100% - 57px)', overflow: 'auto' } }}
      >
        {/* 对话信息概览 */}
        <Card size="small" style={{ marginBottom: '16px', background: '#fafafa' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
            <div>
              <Text type="secondary">对话 ID:</Text>
              <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                {taskChatDetail.chat.id}
              </div>
            </div>
            <div>
              <Text type="secondary">消息总数:</Text>
              <div><strong>{messageCount}</strong> 条</div>
            </div>
            <div>
              <Text type="secondary">用户消息:</Text>
              <div><strong>{userMessages}</strong> 条</div>
            </div>
            <div>
              <Text type="secondary">AI 回复:</Text>
              <div><strong>{assistantMessages}</strong> 条</div>
            </div>
          </div>
        </Card>

        {/* 标注表单 */}
        <Form
          form={form}
          layout="vertical"
          size="small"
          preserve={false}
        >
          {/* 对话意图分类 */}
          <Form.Item
            name="intent_category"
            label={<strong>对话意图分类</strong>}
            rules={[{ required: true, message: '请选择对话意图分类' }]}
          >
            <Radio.Group style={{ width: '100%' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {INTENT_CATEGORY_OPTIONS.map(option => (
                  <Radio key={option.value} value={option.value} style={{ width: '100%' }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{option.label}</div>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                        {option.description}
                      </div>
                    </div>
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          </Form.Item>

          <Divider style={{ margin: '16px 0' }} />

          {/* 对话完整性评估 */}
          <Form.Item
            name="completeness"
            label={<strong>对话完整性评估</strong>}
            rules={[{ required: true, message: '请评估对话完整性' }]}
          >
            <Radio.Group style={{ width: '100%' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {COMPLETENESS_OPTIONS.map(option => (
                  <Radio key={option.value} value={option.value} style={{ width: '100%' }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{option.label}</div>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                        {option.description}
                      </div>
                    </div>
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          </Form.Item>

          <Divider style={{ margin: '16px 0' }} />

          {/* 整体满意度评分 */}
          <Form.Item
            name="overall_satisfaction"
            label={<strong>整体满意度评分</strong>}
            rules={[{ required: true, message: '请给出满意度评分' }]}
          >
            <div>
              <Rate 
                style={{ fontSize: '24px' }}
                character={<StarOutlined />}
              />
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                <div>1星：非常不满意 - 完全未达到期望</div>
                <div>2星：不满意 - 部分达到期望，存在明显问题</div>
                <div>3星：一般 - 基本达到期望，有改进空间</div>
                <div>4星：满意 - 较好达到期望，质量良好</div>
                <div>5星：非常满意 - 完全达到或超出期望</div>
              </div>
            </div>
          </Form.Item>

          <Divider style={{ margin: '16px 0' }} />

          {/* 一般备注 */}
          <Form.Item
            name="general_notes"
            label={<strong>一般备注</strong>}
          >
            <TextArea
              rows={4}
              placeholder="请记录对话中的关键观察、问题、建议等..."
              maxLength={1000}
              showCount
            />
          </Form.Item>

          <Divider style={{ margin: '16px 0' }} />

          {/* 标注结果 */}
          <Form.Item
            name="annotation_result"
            label={<strong>标注结果</strong>}
            rules={[{ required: true, message: '请选择标注结果' }]}
          >
            <Radio.Group style={{ width: '100%' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {ANNOTATION_RESULT_OPTIONS.map(option => (
                  <Radio key={option.value} value={option.value} style={{ width: '100%' }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{option.label}</div>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                        {option.description}
                      </div>
                    </div>
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          </Form.Item>

          {/* 标注备注 */}
          <Form.Item
            name="annotation_comment"
            label={<strong>标注备注</strong>}
          >
            <TextArea
              rows={3}
              placeholder="请详细说明标注结果的原因..."
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ChatAnnotationPanel;
