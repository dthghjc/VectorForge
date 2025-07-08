import React, { useState, useEffect } from 'react';
import {
  Modal,
  Card,
  Radio,
  Checkbox,
  Input,
  Select,
  Rate,
  Button,
  Space,
  Divider,
  Collapse,
  Typography,
  Row,
  Col,
  Form,
  message,
} from 'antd';
import { LeftOutlined, RightOutlined, SaveOutlined } from '@ant-design/icons';
import type { AnnotationTask, LLMResponse, RAGRecall } from './types';

const { TextArea } = Input;
const { Panel } = Collapse;
const { Title, Text } = Typography;
const { Option } = Select;

/**
 * 标注模态框组件属性接口
 */
interface AnnotationModalProps {
  /** 模态框显示状态 */
  visible: boolean;
  /** 当前要标注的任务 */
  task: AnnotationTask | null;
  /** 所有任务列表（用于任务间切换） */
  allTasks: AnnotationTask[];
  /** 关闭模态框的回调函数 */
  onClose: () => void;
  /** 保存标注结果的回调函数 */
  onSave: (task: AnnotationTask) => void;
  /** 切换到下一个任务的回调函数 */
  onNext: () => void;
  /** 切换到上一个任务的回调函数 */
  onPrevious: () => void;
  /** 是否有下一个任务 */
  hasNext: boolean;
  /** 是否有上一个任务 */
  hasPrevious: boolean;
}

/**
 * 标注模态框组件
 * 
 * 主要功能：
 * - 显示对话内容和LLM回复
 * - 提供多维度标注功能（相关性、流畅性、合规性等）
 * - 支持RAG召回知识片段的评估
 * - 整体对话质量评估
 * - 任务间快速切换
 * - 表单验证和数据保存
 * 
 * 标注维度：
 * - LLM回复质量：相关性、流畅性、幻觉检测、合规性
 * - RAG召回评估：知识片段相关性、支持度、错误检测
 * - 整体评估：对话意图、完整性、满意度
 */
const AnnotationModal: React.FC<AnnotationModalProps> = ({
  visible,
  task,
  allTasks,
  onClose,
  onSave,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
}) => {
  // ========== 状态管理 ==========
  
  /** Ant Design 表单实例 */
  const [form] = Form.useForm();
  
  /** 当前编辑中的任务数据（本地副本） */
  const [currentTask, setCurrentTask] = useState<AnnotationTask | null>(null);

  // ========== 副作用处理 ==========
  
  /**
   * 当传入的任务发生变化时，更新本地状态和表单数据
   */
  useEffect(() => {
    if (task) {
      // 创建任务的深拷贝，避免直接修改原始数据
      setCurrentTask({ ...task });
      // 设置表单字段值
      form.setFieldsValue(task);
    }
  }, [task, form]);

  // ========== 数据操作函数 ==========
  
  /**
   * 保存标注数据
   * 验证表单并提交数据
   */
  const handleSave = async () => {
    try {
      // 验证所有表单字段
      const values = await form.validateFields();
      if (currentTask) {
        // 合并表单值到当前任务
        const updatedTask = { ...currentTask, ...values };
        setCurrentTask(updatedTask);
        onSave(updatedTask);
        message.success('保存成功');
      }
    } catch (error) {
      message.error('请完成必填项');
    }
  };

  /**
   * 处理LLM回复标注数据的变化
   * @param turnId - 对话轮次ID
   * @param field - 要更新的字段名
   * @param value - 新的字段值
   */
  const handleLLMResponseChange = (turnId: string, field: string, value: any) => {
    if (!currentTask) return;

    // 创建任务副本
    const updatedTask = { ...currentTask };
    // 查找对应的对话轮次
    const turn = updatedTask.dialogue.find(t => t.id === turnId);
    
    if (turn && turn.llmResponse) {
      // 更新LLM回复的指定字段
      (turn.llmResponse as any)[field] = value;
      setCurrentTask(updatedTask);
      // 同步更新表单数据
      form.setFieldsValue(updatedTask);
    }
  };

  /**
   * 处理RAG召回知识片段标注数据的变化
   * @param turnId - 对话轮次ID
   * @param recallId - RAG召回片段ID
   * @param field - 要更新的字段名
   * @param value - 新的字段值
   */
  const handleRAGRecallChange = (turnId: string, recallId: string, field: string, value: any) => {
    if (!currentTask) return;

    const updatedTask = { ...currentTask };
    const turn = updatedTask.dialogue.find(t => t.id === turnId);
    
    if (turn && turn.llmResponse && turn.llmResponse.ragRecalls) {
      // 查找对应的RAG召回片段
      const recall = turn.llmResponse.ragRecalls.find(r => r.id === recallId);
      if (recall) {
        // 更新召回片段的指定字段
        (recall as any)[field] = value;
        setCurrentTask(updatedTask);
        form.setFieldsValue(updatedTask);
      }
    }
  };

  /**
   * 处理整体对话评估数据的变化
   * @param field - 要更新的字段名
   * @param value - 新的字段值
   */
  const handleOverallChange = (field: string, value: any) => {
    if (!currentTask) return;

    const updatedTask = { ...currentTask };
    // 更新整体评估的指定字段
    (updatedTask as any)[field] = value;
    setCurrentTask(updatedTask);
    form.setFieldsValue(updatedTask);
  };

  // ========== 组件渲染函数 ==========
  
  /**
   * 渲染LLM回复的标注界面
   * @param turn - 对话轮次数据
   * @returns JSX元素或null
   */
  const renderLLMResponseAnnotation = (turn: any) => {
    if (!turn.llmResponse) return null;

    const response = turn.llmResponse as LLMResponse;
    // 根据合规性评估结果决定是否显示违规详情
    const showViolationDetails = response.compliance === 'risky' || response.compliance === 'violation';

    return (
      <Card 
        size="small" 
        title="LLM回复标注" 
        style={{ marginTop: 12, backgroundColor: '#FAFAFA' }}
      >
        <Row gutter={[16, 16]}>
          {/* 相关性评估 */}
          <Col span={12}>
            <div>
              <Text strong>相关性:</Text>
              <Radio.Group
                value={response.relevance}
                onChange={(e) => handleLLMResponseChange(turn.id, 'relevance', e.target.value)}
                style={{ marginTop: 8, display: 'block' }}
              >
                <Radio value="strong">强相关</Radio>
                <Radio value="relevant">相关</Radio>
                <Radio value="weak">弱相关</Radio>
                <Radio value="irrelevant">不相关</Radio>
              </Radio.Group>
            </div>
          </Col>
          
          {/* 流畅性评估 */}
          <Col span={12}>
            <div>
              <Text strong>流畅性:</Text>
              <Radio.Group
                value={response.fluency}
                onChange={(e) => handleLLMResponseChange(turn.id, 'fluency', e.target.value)}
                style={{ marginTop: 8, display: 'block' }}
              >
                <Radio value="very_fluent">非常流畅</Radio>
                <Radio value="fluent">流畅</Radio>
                <Radio value="not_fluent">不流畅</Radio>
              </Radio.Group>
            </div>
          </Col>
          
          {/* 幻觉/事实错误检测 */}
          <Col span={24}>
            <div>
              <Checkbox
                checked={response.hasHallucination}
                onChange={(e) => handleLLMResponseChange(turn.id, 'hasHallucination', e.target.checked)}
              >
                <Text strong>幻觉/事实错误</Text>
              </Checkbox>
              {/* 条件显示幻觉详情输入框 */}
              {response.hasHallucination && (
                <TextArea
                  placeholder="请详细描述幻觉或事实错误"
                  value={response.hallucinationDetails}
                  onChange={(e) => handleLLMResponseChange(turn.id, 'hallucinationDetails', e.target.value)}
                  style={{ marginTop: 8 }}
                  rows={2}
                />
              )}
            </div>
          </Col>
          
          {/* 内容合规性评估 */}
          <Col span={24}>
            <div>
              <Text strong>内容合规性 (中国法规):</Text>
              <Radio.Group
                value={response.compliance}
                onChange={(e) => handleLLMResponseChange(turn.id, 'compliance', e.target.value)}
                style={{ marginTop: 8, display: 'block' }}
              >
                <Radio value="compliant">完全合规</Radio>
                <Radio value="risky">存在风险</Radio>
                <Radio value="violation">严重违规</Radio>
                <Radio value="unknown">无法判断</Radio>
              </Radio.Group>
              
              {/* 条件显示违规详情 */}
              {showViolationDetails && (
                <div style={{ marginTop: 12 }}>
                  <Text strong>违规类型:</Text>
                  <Checkbox.Group
                    value={response.violationTypes}
                    onChange={(values) => handleLLMResponseChange(turn.id, 'violationTypes', values)}
                    style={{ marginTop: 8, display: 'block' }}
                  >
                    <Checkbox value="political">政治敏感</Checkbox>
                    <Checkbox value="illegal">非法信息</Checkbox>
                    <Checkbox value="pornographic">色情/低俗</Checkbox>
                    <Checkbox value="violence">暴力</Checkbox>
                    <Checkbox value="discrimination">歧视/仇恨</Checkbox>
                    <Checkbox value="rumor">谣言/虚假信息</Checkbox>
                    <Checkbox value="privacy">侵犯隐私</Checkbox>
                    <Checkbox value="other">其他</Checkbox>
                  </Checkbox.Group>
                  <TextArea
                    placeholder="请详细描述违规情况"
                    value={response.violationDetails}
                    onChange={(e) => handleLLMResponseChange(turn.id, 'violationDetails', e.target.value)}
                    style={{ marginTop: 8 }}
                    rows={2}
                  />
                </div>
              )}
            </div>
          </Col>
          
          {/* 改进建议 */}
          <Col span={24}>
            <div>
              <Text strong>改进建议:</Text>
              <TextArea
                placeholder="请提供改进建议"
                value={response.improvementSuggestion}
                onChange={(e) => handleLLMResponseChange(turn.id, 'improvementSuggestion', e.target.value)}
                style={{ marginTop: 8 }}
                rows={2}
              />
            </div>
          </Col>
        </Row>

        {/* RAG召回知识库评估 */}
        {response.ragRecalls && response.ragRecalls.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Text strong>RAG召回知识库评估:</Text>
            <Collapse style={{ marginTop: 8 }}>
              {response.ragRecalls.map((recall, index) => (
                <Panel
                  key={recall.id}
                  header={`知识片段 ${index + 1}`}
                  extra={<Text type="secondary">{recall.source}</Text>}
                >
                  {/* 知识片段内容展示 */}
                  <div style={{ marginBottom: 12 }}>
                    <Text strong>片段内容:</Text>
                    <div style={{ 
                      backgroundColor: '#F5F5F5', 
                      padding: 8, 
                      borderRadius: 4, 
                      marginTop: 4,
                      fontSize: 12
                    }}>
                      {recall.snippet}
                    </div>
                  </div>
                  
                  <Row gutter={[16, 16]}>
                    {/* 与用户问题的相关性 */}
                    <Col span={12}>
                      <div>
                        <Text strong>与用户问题的相关性:</Text>
                        <Radio.Group
                          value={recall.relevanceToQuestion}
                          onChange={(e) => handleRAGRecallChange(turn.id, recall.id, 'relevanceToQuestion', e.target.value)}
                          style={{ marginTop: 8, display: 'block' }}
                        >
                          <Radio value="strong">强相关</Radio>
                          <Radio value="relevant">相关</Radio>
                          <Radio value="weak">弱相关</Radio>
                          <Radio value="irrelevant">不相关</Radio>
                        </Radio.Group>
                      </div>
                    </Col>
                    
                    {/* 对LLM回复的支持度 */}
                    <Col span={12}>
                      <div>
                        <Text strong>对LLM回复的支持度:</Text>
                        <Radio.Group
                          value={recall.supportToResponse}
                          onChange={(e) => handleRAGRecallChange(turn.id, recall.id, 'supportToResponse', e.target.value)}
                          style={{ marginTop: 8, display: 'block' }}
                        >
                          <Radio value="full">完全支持</Radio>
                          <Radio value="partial">部分支持</Radio>
                          <Radio value="none">不支持</Radio>
                        </Radio.Group>
                      </div>
                    </Col>
                    
                    {/* 错误信息检测 */}
                    <Col span={12}>
                      <Checkbox
                        checked={recall.hasError}
                        onChange={(e) => handleRAGRecallChange(turn.id, recall.id, 'hasError', e.target.checked)}
                      >
                        <Text strong>包含错误/过时信息</Text>
                      </Checkbox>
                      {recall.hasError && (
                        <TextArea
                          placeholder="请描述错误详情"
                          value={recall.errorDetails}
                          onChange={(e) => handleRAGRecallChange(turn.id, recall.id, 'errorDetails', e.target.value)}
                          style={{ marginTop: 8 }}
                          rows={2}
                        />
                      )}
                    </Col>
                    
                    {/* 冗余信息检测 */}
                    <Col span={12}>
                      <Checkbox
                        checked={recall.isRedundant}
                        onChange={(e) => handleRAGRecallChange(turn.id, recall.id, 'isRedundant', e.target.checked)}
                      >
                        <Text strong>是否冗余</Text>
                      </Checkbox>
                    </Col>
                    
                    {/* RAG改进建议 */}
                    <Col span={24}>
                      <div>
                        <Text strong>RAG改进建议:</Text>
                        <TextArea
                          placeholder="请提供RAG改进建议"
                          value={recall.improvementSuggestion}
                          onChange={(e) => handleRAGRecallChange(turn.id, recall.id, 'improvementSuggestion', e.target.value)}
                          style={{ marginTop: 8 }}
                          rows={2}
                        />
                      </div>
                    </Col>
                  </Row>
                </Panel>
              ))}
            </Collapse>
          </div>
        )}
      </Card>
    );
  };

  // 如果没有当前任务，不渲染组件
  if (!currentTask) return null;

  return (
    <Modal
      title={`标注任务 - ${currentTask.id}`}
      open={visible}
      onCancel={onClose}
      width="calc(100vw - 80px)" // 响应式宽度
      style={{ top: 20 }}
      bodyStyle={{ height: 'calc(100vh - 200px)', overflow: 'auto' }} // 固定高度，内容可滚动
      footer={
        // 自定义底部按钮区域
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* 任务切换按钮 */}
          <Space>
            <Button 
              icon={<LeftOutlined />}
              onClick={onPrevious}
              disabled={!hasPrevious}
            >
              上一条
            </Button>
            <Button 
              icon={<RightOutlined />}
              onClick={onNext}
              disabled={!hasNext}
            >
              下一条
            </Button>
          </Space>
          
          {/* 操作按钮 */}
          <Space>
            <Button onClick={onClose}>
              取消
            </Button>
            <Button 
              type="primary" 
              icon={<SaveOutlined />}
              onClick={handleSave}
            >
              保存并提交
            </Button>
          </Space>
        </div>
      }
    >
      <Form form={form} layout="vertical">
        <Row gutter={24}>
          {/* 左侧：对话内容与LLM回复标注 */}
          <Col span={16}>
            <Card title="对话内容与单轮LLM回复标注" style={{ height: '100%' }}>
              <div style={{ maxHeight: 'calc(100vh - 400px)', overflow: 'auto' }}>
                {currentTask.dialogue.map((turn) => (
                  <div key={turn.id} style={{ marginBottom: 24 }}>
                    {/* 对话内容显示 */}
                    <div style={{ 
                      padding: 12, 
                      backgroundColor: turn.role === 'user' ? '#E8F5E8' : '#F0F8FF', // 用户和LLM使用不同背景色
                      borderRadius: 8,
                      marginBottom: 8
                    }}>
                      <Text strong>{turn.role === 'user' ? '用户' : 'LLM'}：</Text>
                      <div style={{ marginTop: 4 }}>
                        {turn.content}
                      </div>
                    </div>
                    {/* 仅为LLM回复渲染标注界面 */}
                    {turn.role === 'llm' && renderLLMResponseAnnotation(turn)}
                  </div>
                ))}
              </div>
            </Card>
          </Col>
          
          {/* 右侧：整体对话评估 */}
          <Col span={8}>
            <Card title="整体对话评估" style={{ height: '100%' }}>
              <div style={{ maxHeight: 'calc(100vh - 400px)', overflow: 'auto' }}>
                <Row gutter={[0, 24]}>
                  {/* 对话意图分类 */}
                  <Col span={24}>
                    <div>
                      <Text strong>对话意图分类:</Text>
                      <Select
                        value={currentTask.intentCategory}
                        onChange={(value) => handleOverallChange('intentCategory', value)}
                        style={{ width: '100%', marginTop: 8 }}
                        placeholder="请选择对话意图"
                      >
                        <Option value="information_query">信息查询</Option>
                        <Option value="instruction_following">指令遵循</Option>
                        <Option value="content_creation">内容创作</Option>
                        <Option value="chat">闲聊</Option>
                      </Select>
                    </div>
                  </Col>
                  
                  {/* 对话完整性 */}
                  <Col span={24}>
                    <div>
                      <Text strong>对话完整性:</Text>
                      <Radio.Group
                        value={currentTask.completeness}
                        onChange={(e) => handleOverallChange('completeness', e.target.value)}
                        style={{ marginTop: 8, display: 'block' }}
                      >
                        <Radio value="complete">完整</Radio>
                        <Radio value="incomplete">不完整</Radio>
                      </Radio.Group>
                    </div>
                  </Col>
                  
                  {/* 整体满意度评分 */}
                  <Col span={24}>
                    <div>
                      <Text strong>整体满意度:</Text>
                      <div style={{ marginTop: 8 }}>
                        <Rate
                          value={currentTask.overallSatisfaction}
                          onChange={(value) => handleOverallChange('overallSatisfaction', value)}
                        />
                      </div>
                    </div>
                  </Col>
                  
                  {/* 一般备注 */}
                  <Col span={24}>
                    <div>
                      <Text strong>一般备注:</Text>
                      <TextArea
                        placeholder="请填写一般备注"
                        value={currentTask.generalNotes}
                        onChange={(e) => handleOverallChange('generalNotes', e.target.value)}
                        style={{ marginTop: 8 }}
                        rows={4}
                      />
                    </div>
                  </Col>
                </Row>
              </div>
            </Card>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default AnnotationModal;