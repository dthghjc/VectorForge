/**
 * 创建任务弹窗组件
 * 提供任务创建表单和对话选择功能
 */
import React from 'react';
import { Modal, Form, Input, Select, DatePicker, Button, Space, Row, Col } from 'antd';
import type { UserBasic } from '../../../api';
import ChatSelector from '../shared/ChatSelector';

const { Option } = Select;
const { TextArea } = Input;

interface CreateTaskModalProps {
    /** 弹窗显示状态 */
    visible: boolean;
    /** 加载状态 */
    loading: boolean;
    /** 标注员用户列表 */
    users: UserBasic[];
    /** 对话来源类型 */
    chatSourceType: 'pending' | 'all';
    /** 已选择的对话数量 */
    selectedChatsCount: number;
    /** 表单实例 */
    form: any;
    /** 关闭弹窗回调 */
    onCancel: () => void;
    /** 表单提交回调 */
    onSubmit: (values: any) => void;
    /** 设置对话来源类型回调 */
    onChatSourceTypeChange: (type: 'pending' | 'all') => void;
    /** 选择对话回调 */
    onSelectChats: () => void;
}

/**
 * 任务优先级选项
 */
const PRIORITY_OPTIONS = [
    { value: 'low', label: '低' },
    { value: 'normal', label: '普通' },
    { value: 'high', label: '高' },
    { value: 'urgent', label: '紧急' },
];

/**
 * 创建任务弹窗组件
 * 包含完整的任务创建表单
 */
const CreateTaskModal: React.FC<CreateTaskModalProps> = React.memo(({
    visible,
    loading,
    users,
    chatSourceType,
    selectedChatsCount,
    form,
    onCancel,
    onSubmit,
    onChatSourceTypeChange,
    onSelectChats
}) => {
    return (
        <Modal
            title="创建新任务"
            open={visible}
            onCancel={onCancel}
            footer={null}                    // 不使用默认footer，使用表单内的按钮
            width={800}                      // 弹窗宽度
        >
            {/* 创建任务表单 */}
            <Form
                form={form}
                layout="vertical"              // 垂直布局，标签在输入框上方
                onFinish={onSubmit}
            >
                {/* 任务标题输入 - 必填 */}
                <Form.Item
                    name="title"
                    label="任务标题"
                    rules={[{ required: true, message: '请输入任务标题' }]}
                >
                    <Input placeholder="请输入任务标题" />
                </Form.Item>

                {/* 任务描述输入 - 可选 */}
                <Form.Item
                    name="description"
                    label="任务描述"
                >
                    <TextArea rows={4} placeholder="请输入任务描述" />
                </Form.Item>

                {/* 优先级和截止时间 - 两列布局 */}
                <Row gutter={16}>
                    <Col span={12}>
                        {/* 优先级选择 */}
                        <Form.Item
                            name="priority"
                            label="优先级"
                        >
                            <Select placeholder="选择优先级">
                                {PRIORITY_OPTIONS.map(option => (
                                    <Option key={option.value} value={option.value}>
                                        {option.label}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        {/* 截止时间选择 */}
                        <Form.Item
                            name="deadline"
                            label="截止时间"
                        >
                            <DatePicker
                                showTime                    // 支持时间选择
                                style={{ width: '100%' }}
                                placeholder="选择截止时间"
                            />
                        </Form.Item>
                    </Col>
                </Row>

                {/* 分配标注员选择 */}
                <Form.Item
                    name="assigned_to_id"
                    label="分配给"
                >
                    <Select
                        placeholder="选择标注员"
                        allowClear                      // 允许清除选择
                        showSearch                      // 支持搜索
                        filterOption={(input, option: any) =>
                            option?.children?.toLowerCase().includes(input.toLowerCase())
                        }
                    >
                        {/* 遍历标注员用户列表 */}
                        {users.map(user => (
                            <Option key={user.id} value={user.id}>
                                {user.username}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                {/* 对话选择区域 */}
                <Form.Item label="选择对话">
                    <ChatSelector
                        chatSourceType={chatSourceType}
                        selectedCount={selectedChatsCount}
                        onSourceTypeChange={onChatSourceTypeChange}
                        onSelectChats={onSelectChats}
                    />
                </Form.Item>

                {/* 表单操作按钮 */}
                <Form.Item>
                    <Space>
                        {/* 提交按钮 */}
                        <Button type="primary" htmlType="submit" loading={loading}>
                            创建任务
                        </Button>
                        {/* 取消按钮 */}
                        <Button onClick={onCancel}>
                            取消
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Modal>
    );
});

// 设置显示名称，便于调试
CreateTaskModal.displayName = 'CreateTaskModal';

export default CreateTaskModal;