/**
 * 对话选择弹窗组件
 * 用于在创建任务时选择要包含的对话
 */
import React, { useMemo } from 'react';
import { Modal, Table, Tag } from 'antd';
import dayjs from 'dayjs';
import type { PendingChat } from '../../../api';
import type { ChatBasicResponse } from '../../../api/chat';

interface ChatSelectionModalProps {
    /** 弹窗显示状态 */
    visible: boolean;
    /** 对话来源类型 */
    chatSourceType: 'pending' | 'all';
    /** 待审核对话列表 */
    pendingChats: PendingChat[];
    /** 所有对话列表 */
    allChats: ChatBasicResponse[];
    /** 已选择的对话ID列表 */
    selectedChats: string[];
    /** 关闭弹窗回调 */
    onCancel: () => void;
    /** 确认选择回调 */
    onOk: () => void;
    /** 选择变化回调 */
    onSelectionChange: (selectedRowKeys: string[]) => void;
}

/**
 * 对话选择弹窗组件
 * 提供对话列表展示和多选功能
 */
const ChatSelectionModal: React.FC<ChatSelectionModalProps> = React.memo(({
    visible,
    chatSourceType,
    pendingChats,
    allChats,
    selectedChats,
    onCancel,
    onOk,
    onSelectionChange
}) => {
    /**
     * 待审核对话表格列配置
     */
    const pendingChatColumns = useMemo(() => [
        {
            title: '对话标题',
            dataIndex: 'title',
            key: 'title',
            ellipsis: true,  // 标题过长时显示省略号
        },
        {
            title: '待审核消息数',
            dataIndex: 'pending_message_count',
            key: 'pending_message_count',
            render: (count: number) => (
                // 用橙色标签显示待审核消息数量
                <Tag color="orange">{count} 条消息</Tag>
            ),
        },
        {
            title: '最后活动时间',
            dataIndex: 'last_message_at',
            key: 'last_message_at',
            render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
        },
        {
            title: '创建时间',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
        },
    ], []);

    /**
     * 所有对话表格列配置
     */
    const allChatColumns = useMemo(() => [
        {
            title: '对话标题',
            dataIndex: 'title',
            key: 'title',
            ellipsis: true,  // 标题过长时显示省略号
            render: (title: string) => title || '未命名对话',  // 无标题时显示默认文本
        },
        {
            title: '消息数量',
            dataIndex: 'message_count',
            key: 'message_count',
            render: (count: number) => (
                // 用蓝色标签显示消息数量
                <Tag color="blue">{count} 条消息</Tag>
            ),
        },
        {
            title: '创建时间',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
        },
        {
            title: '更新时间',
            dataIndex: 'updated_at',
            key: 'updated_at',
            render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
        },
    ], []);

    // 根据对话来源类型选择数据和列配置
    const dataSource = chatSourceType === 'pending' ? pendingChats : allChats;
    const columns = chatSourceType === 'pending' ? pendingChatColumns : allChatColumns;

    return (
        <Modal
            title={chatSourceType === 'pending' ? "选择待审核对话" : "选择对话"}
            open={visible}
            onCancel={onCancel}
            onOk={onOk}
            width={1000}                    // 较宽的弹窗以适应表格
        >
            {/* 对话选择表格 */}
            <Table
                columns={columns}
                dataSource={dataSource as any}
                rowKey="id"
                rowSelection={{
                    selectedRowKeys: selectedChats,
                    onChange: (selectedRowKeys) => {
                        onSelectionChange(selectedRowKeys as string[]);
                    },
                }}
                pagination={{
                    showSizeChanger: true,      // 显示每页条数选择器
                    showTotal: (total) => `共 ${total} 个对话`,  // 显示总数
                }}
            />
        </Modal>
    );
});

// 设置显示名称，便于调试
ChatSelectionModal.displayName = 'ChatSelectionModal';

export default ChatSelectionModal;