/**
 * Message 级别标注面板
 * 处理单个消息（特别是 AI 回复）的详细标注
 */

import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Card, 
  Select, 
  Radio, 
  Input, 
  Switch,
  Checkbox,
  Space,
  Divider,
  Typography,
  Button,
  message as antMessage
} from 'antd';
import { 
  RobotOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import type { 
  Message, 
  MessageAnnotationForm 
} from '../../types/annotation';
import { TONE_AND_STYLE_OPTIONS, VIOLATION_TYPE_OPTIONS } from '../../types/annotation';


const { Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// ============= 组件属性 =============

interface MessageAnnotationPanelProps {
  /** 要标注的消息 */
  message: Message;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

// ============= 选项配置 =============

const RELEVANCE_OPTIONS = [
  { value: 'strong', label: '强相关', color: '#52c41a' },
  { value: 'relevant', label: '相关', color: '#1890ff' },
  { value: 'weak', label: '弱相关', color: '#faad14' },
  { value: 'irrelevant', label: '不相关', color: '#ff4d4f' },
];

const FLUENCY_OPTIONS = [
  { value: 'very_fluent', label: '非常流畅', color: '#52c41a' },
  { value: 'fluent', label: '流畅', color: '#1890ff' },
  { value: 'not_fluent', label: '不流畅', color: '#ff4d4f' },
];

const ACCURACY_OPTIONS = [
  { value: 'accurate', label: '准确', color: '#52c41a' },
  { value: 'partially_accurate', label: '部分准确', color: '#faad14' },
  { value: 'inaccurate', label: '不准确', color: '#ff4d4f' },
  { value: 'unknown', label: '无法判断', color: '#d9d9d9' },
];

const COMPLIANCE_OPTIONS = [
  { value: 'compliant', label: '合规', color: '#52c41a' },
  { value: 'risky', label: '风险', color: '#faad14' },
  { value: 'violation', label: '违规', color: '#ff4d4f' },
  { value: 'unknown', label: '无法判断', color: '#d9d9d9' },
];

const INSTRUCTION_FOLLOWING_OPTIONS = [
  { value: 'PERFECT_COMPLIANCE', label: '完美遵循' },
  { value: 'NEAR_PERFECT', label: '高度遵循' },
  { value: 'PARTIAL_COMPLIANCE', label: '部分遵循' },
  { value: 'MINIMAL_COMPLIANCE', label: '最小遵循' },
  { value: 'NO_COMPLIANCE', label: '基本未遵循' },
];

// ============= 主组件 =============

const MessageAnnotationPanel: React.FC<MessageAnnotationPanelProps> = ({
  message,
  style,
}) => {
  
  // ============= 状态管理 =============
  
  const [form] = Form.useForm<MessageAnnotationForm>();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<MessageAnnotationForm>({
    relevance: '',
    fluency: '',
    accuracy: '',
    compliance: '',
    tone_and_style: [],
    violation_types: [],
    violation_details: '',
    has_hallucination: false,
    hallucination_details: '',
    improvement_suggestion: '',
    rewrite: '',

  });

  // ============= 初始化表单 =============

  useEffect(() => {
    // 从现有审核记录初始化表单
    // 消息级别标注无需初始化
    {
      // 使用默认值
      setFormData(formData);
      form.setFieldsValue(formData);
    }
  }, [message.id, form]);

  // ============= 表单处理 =============

  /**
   * 表单值变化处理
   */
  const handleFormChange = (changedValues: Partial<MessageAnnotationForm>) => {
    setFormData(prev => ({ ...prev, ...changedValues }));
  };

  /**
   * 保存消息标注
   */
  const handleSave = async () => {
    try {
      setSaving(true);
      
      // 验证表单
      await form.validateFields();
      const values = form.getFieldsValue();
      
      console.log('保存消息标注数据:', values);
      
      // TODO: 实现消息级别标注保存逻辑
      // 目前只在本地保存，需要配合后端API实现
      
      antMessage.success('消息标注保存成功');
      
    } catch (error) {
      console.error('保存消息标注失败:', error);
      antMessage.error('保存消息标注失败');
    } finally {
      setSaving(false);
    }
  };

  // ============= 渲染辅助 =============

  const isAssistantMessage = message.role === 'assistant';
  const isCompleted = false; // TODO: 需要根据实际标注状态判断

  return (
    <div style={{ ...style, overflow: 'auto' }}>
      <Card 
        title={
          <Space>
            <RobotOutlined />
            消息级别标注
            {isCompleted && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
          </Space>
        }
        size="small"
        style={{ height: '100%' }}
        styles={{ body: { height: 'calc(100% - 57px)', overflow: 'auto' } }}
        extra={
          <Button
            type="primary"
            size="small"
            loading={saving}
            onClick={handleSave}
          >
保存标注
          </Button>
        }
      >
        {/* 消息信息概览 */}
        <Card size="small" style={{ marginBottom: '16px', background: '#fafafa' }}>
          <div style={{ fontSize: '13px' }}>
            <div style={{ marginBottom: '8px' }}>
              <Text type="secondary">消息角色:</Text>
              <span style={{ marginLeft: '8px' }}>
                {message.role === 'user' ? '👤 用户' : '🤖 AI助手'}
              </span>
            </div>

            <div>
              <Text type="secondary">消息长度:</Text>
              <span style={{ marginLeft: '8px' }}>{message.content.length} 字符</span>
            </div>
          </div>
        </Card>

        {/* 如果不是 AI 消息，显示提示 */}
        {!isAssistantMessage && (
          <Card size="small" style={{ marginBottom: '16px', background: '#fff7e6', border: '1px solid #ffd591' }}>
            <div style={{ textAlign: 'center', color: '#d46b08' }}>
              <ExclamationCircleOutlined style={{ marginRight: '8px' }} />
              用户消息通常不需要详细标注，主要关注 AI 回复质量
            </div>
          </Card>
        )}

        {/* 标注表单 */}
        <Form
          form={form}
          layout="vertical"
          size="small"
          onValuesChange={handleFormChange}
          preserve={false}
        >
          {/* LLM 回复质量评估 */}
          {isAssistantMessage && (
            <>
              {/* 相关性 */}
              <Form.Item
                name="relevance"
                label={<strong>回复相关性</strong>}
                rules={[{ required: true, message: '请评估回复相关性' }]}
              >
                <Radio.Group style={{ width: '100%' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {RELEVANCE_OPTIONS.map(option => (
                      <Radio key={option.value} value={option.value}>
                        <span style={{ color: option.color, fontWeight: 500 }}>
                          {option.label}
                        </span>
                      </Radio>
                    ))}
                  </div>
                </Radio.Group>
              </Form.Item>

              {/* 流畅性 */}
              <Form.Item
                name="fluency"
                label={<strong>语言流畅性</strong>}
                rules={[{ required: true, message: '请评估语言流畅性' }]}
              >
                <Radio.Group>
                  {FLUENCY_OPTIONS.map(option => (
                    <Radio key={option.value} value={option.value}>
                      <span style={{ color: option.color, fontWeight: 500 }}>
                        {option.label}
                      </span>
                    </Radio>
                  ))}
                </Radio.Group>
              </Form.Item>

              {/* 准确性 */}
              <Form.Item
                name="accuracy"
                label={<strong>信息准确性</strong>}
                rules={[{ required: true, message: '请评估信息准确性' }]}
              >
                <Radio.Group>
                  {ACCURACY_OPTIONS.map(option => (
                    <Radio key={option.value} value={option.value}>
                      <span style={{ color: option.color, fontWeight: 500 }}>
                        {option.label}
                      </span>
                    </Radio>
                  ))}
                </Radio.Group>
              </Form.Item>

              {/* 合规性 */}
              <Form.Item
                name="compliance"
                label={<strong>内容合规性</strong>}
                rules={[{ required: true, message: '请评估内容合规性' }]}
              >
                <Radio.Group>
                  {COMPLIANCE_OPTIONS.map(option => (
                    <Radio key={option.value} value={option.value}>
                      <span style={{ color: option.color, fontWeight: 500 }}>
                        {option.label}
                      </span>
                    </Radio>
                  ))}
                </Radio.Group>
              </Form.Item>

              {/* 语气与风格 */}
              <Form.Item
                name="tone_and_style"
                label={<strong>语气与风格</strong>}
              >
                <Checkbox.Group>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {TONE_AND_STYLE_OPTIONS.map(option => (
                      <Checkbox key={option.value} value={option.value}>
                        {option.label}
                      </Checkbox>
                    ))}
                  </div>
                </Checkbox.Group>
              </Form.Item>

              <Divider style={{ margin: '16px 0' }} />

              {/* 违规检测 */}
              <Form.Item
                name="violation_types"
                label={<strong>违规类型</strong>}
              >
                <Checkbox.Group>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                    {VIOLATION_TYPE_OPTIONS.map(option => (
                      <Checkbox key={option.value} value={option.value}>
                        <span style={{ fontSize: '12px' }}>{option.label}</span>
                      </Checkbox>
                    ))}
                  </div>
                </Checkbox.Group>
              </Form.Item>

              <Form.Item
                name="violation_details"
                label="违规详情"
              >
                <TextArea
                  rows={2}
                  placeholder="如有违规，请详细描述..."
                  maxLength={500}
                />
              </Form.Item>

              <Divider style={{ margin: '16px 0' }} />

              {/* 幻觉检测 */}
              <Form.Item
                name="has_hallucination"
                label={<strong>幻觉检测</strong>}
                valuePropName="checked"
              >
                <Switch checkedChildren="有幻觉" unCheckedChildren="无幻觉" />
              </Form.Item>

              <Form.Item
                name="hallucination_details"
                label="幻觉详情"
              >
                <TextArea
                  rows={2}
                  placeholder="如有幻觉或事实错误，请详细描述..."
                  maxLength={500}
                />
              </Form.Item>

              <Divider style={{ margin: '16px 0' }} />

              {/* 指令遵循（可选） */}
              <Form.Item
                name="is_instruction_following"
                label="是否评估指令遵循"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item shouldUpdate={(prevValues, currentValues) => 
                prevValues.is_instruction_following !== currentValues.is_instruction_following
              }>
                {({ getFieldValue }) => 
                  getFieldValue('is_instruction_following') ? (
                    <Form.Item
                      name="instruction_following_rating"
                      label="指令遵循度"
                    >
                      <Select placeholder="请选择指令遵循度">
                        {INSTRUCTION_FOLLOWING_OPTIONS.map(option => (
                          <Option key={option.value} value={option.value}>
                            {option.label}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  ) : null
                }
              </Form.Item>

              <Form.Item shouldUpdate={(prevValues, currentValues) => 
                prevValues.is_instruction_following !== currentValues.is_instruction_following
              }>
                {({ getFieldValue }) => 
                  getFieldValue('is_instruction_following') ? (
                    <Form.Item
                      name="instruction_following_details"
                      label="指令遵循详情"
                    >
                      <TextArea
                        rows={2}
                        placeholder="请详细描述指令遵循情况..."
                        maxLength={500}
                        showCount
                      />
                    </Form.Item>
                  ) : null
                }
              </Form.Item>

              <Divider style={{ margin: '16px 0' }} />
            </>
          )}

          {/* 改进建议 */}
          <Form.Item
            name="improvement_suggestion"
            label={<strong>改进建议</strong>}
          >
            <TextArea
              rows={3}
              placeholder="请提供具体的改进建议..."
              maxLength={1000}
              showCount
            />
          </Form.Item>

          {/* 优化重写 */}
          <Form.Item
            name="rewrite"
            label={<strong>优化重写</strong>}
          >
            <TextArea
              rows={4}
              placeholder="如需要，请提供优化后的回复版本..."
              maxLength={2000}
              showCount
            />
          </Form.Item>


        </Form>
      </Card>
    </div>
  );
};

export default MessageAnnotationPanel;
