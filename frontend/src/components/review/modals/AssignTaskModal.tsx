/**
 * 分配任务弹窗组件
 * 用于将任务分配给指定的标注员
 */
import React from 'react';
import { Modal, Form, Select, Button, Space } from 'antd';
import type { UserBasic } from '../../../api';

const { Option } = Select;

interface AssignTaskModalProps {
    /** 弹窗显示状态 */
    visible: boolean;
    /** 加载状态 */
    loading: boolean;
    /** 标注员用户列表 */
    users: UserBasic[];
    /** 表单实例 */
    form: any;
    /** 关闭弹窗回调 */
    onCancel: () => void;
    /** 表单提交回调 */
    onSubmit: (values: any) => void;
}

/**
 * 分配任务弹窗组件
 * 提供简单的用户选择表单
 */
const AssignTaskModal: React.FC<AssignTaskModalProps> = React.memo(({
    visible,
    loading,
    users,
    form,
    onCancel,
    onSubmit
}) => {
    return (
        <Modal
            title="分配任务"
            open={visible}
            onCancel={onCancel}
            footer={null}                    // 不使用默认footer，使用表单内的按钮
        >
            {/* 分配任务表单 */}
            <Form
                form={form}
                layout="vertical"
                onFinish={onSubmit}
            >
                {/* 标注员选择 - 必填 */}
                <Form.Item
                    name="assigned_to_id"
                    label="分配给"
                    rules={[{ required: true, message: '请选择标注员' }]}
                >
                    <Select
                        placeholder="选择标注员"
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

                {/* 表单操作按钮 */}
                <Form.Item>
                    <Space>
                        {/* 提交分配按钮 */}
                        <Button type="primary" htmlType="submit" loading={loading}>
                            分配任务
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
AssignTaskModal.displayName = 'AssignTaskModal';

export default AssignTaskModal;