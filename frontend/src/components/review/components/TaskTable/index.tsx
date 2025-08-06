/**
 * 任务表格组件
 * 显示任务列表，包含任务信息和操作按钮
 */
import React, { useMemo } from 'react';
import { Card, Button, Table, Tag } from 'antd';
import { PlusOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { TaskResponse } from '../../../../api';
import TaskActions from './TaskActions';

interface TaskTableProps {
    /** 任务列表数据 */
    tasks: TaskResponse[];
    /** 加载状态 */
    loading: boolean;
    /** 分页信息 */
    pagination: {
        current: number;
        pageSize: number;
        total: number;
    };
    /** 创建任务回调 */
    onCreate: () => void;
    /** 分配任务回调 */
    onAssign: (task: TaskResponse) => void;
    /** 删除任务回调 */
    onDelete: (taskId: string) => void;
    /** 分页变化回调 */
    onPageChange: (page: number, pageSize?: number) => void;
}

/**
 * 任务状态对应的颜色映射
 */
const statusColors = {
    'created': 'default',
    'assigned': 'processing',
    'in_progress': 'warning',
    'completed': 'success',
    'cancelled': 'error',
};

/**
 * 任务优先级对应的颜色映射
 */
const priorityColors = {
    'low': 'default',
    'normal': 'blue',
    'high': 'orange',
    'urgent': 'red',
};

/**
 * 任务表格组件
 * 提供任务列表展示和操作功能
 * 
 * 性能优化：
 * - 使用React.memo避免不必要的重渲染
 * - 使用useMemo缓存表格列配置
 * - 使用useCallback缓存事件处理函数
 */
const TaskTable: React.FC<TaskTableProps> = React.memo(({
    tasks,
    loading,
    pagination,     // 分页信息
    onCreate,       // 创建任务回调
    onAssign,       // 分配任务回调
    onDelete,       // 删除任务回调
    onPageChange    // 分页变化回调
}) => {
    /**
     * 任务表格列配置
     * 使用useMemo优化性能，避免每次渲染都重新创建列配置
     */
    const taskColumns = useMemo(() => [
        {
            title: '任务标题',
            dataIndex: 'title',
            key: 'title',
            render: (text: string, record: TaskResponse) => (
                <div>
                    {/* 任务标题，加粗显示 */}
                    <div style={{ fontWeight: 'bold' }}>{text}</div>
                    {/* 任务描述，小字灰色显示 */}
                    {record.description && (
                        <div style={{ fontSize: '12px', color: '#666' }}>
                            {record.description}
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                // 根据任务状态显示相应颜色的标签
                <Tag color={statusColors[status as keyof typeof statusColors]}>
                    {status.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: '优先级',
            dataIndex: 'priority',
            key: 'priority',
            render: (priority: string) => (
                // 根据任务优先级显示相应颜色的标签
                <Tag color={priorityColors[priority as keyof typeof priorityColors]}>
                    {priority.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: '进度',
            key: 'progress',
            render: (_: any, record: TaskResponse) => (
                <div>
                    {/* 显示已完成/总数量 */}
                    <div>{record.completed_chats}/{record.total_chats}</div>
                    {/* 显示完成百分比 */}
                    <div style={{ fontSize: '12px', color: '#666' }}>
                        {record.completion_rate}%
                    </div>
                </div>
            ),
        },
        {
            title: '分配给',
            key: 'assigned_to',
            render: (_: any, record: TaskResponse) => (
                record.assigned_to ? (
                    // 已分配时显示用户名和图标
                    <span>
                        <UserOutlined /> {record.assigned_to.username}
                    </span>
                ) : (
                    // 未分配时显示灰色提示
                    <span style={{ color: '#999' }}>未分配</span>
                )
            ),
        },
        {
            title: '截止时间',
            dataIndex: 'deadline',
            key: 'deadline',
            render: (deadline: string, record: TaskResponse) => (
                deadline ? (
                    // 有截止时间时显示时间，逾期时用红色显示
                    <span style={{ color: record.is_overdue ? '#ff4d4f' : undefined }}>
                        <ClockCircleOutlined /> {dayjs(deadline).format('YYYY-MM-DD HH:mm')}
                        {/* 逾期时显示逾期标签 */}
                        {record.is_overdue && <Tag color="red">逾期</Tag>}
                    </span>
                ) : (
                    // 无截止时间时显示提示
                    <span style={{ color: '#999' }}>无限制</span>
                )
            ),
        },
        {
            title: '操作',
            key: 'actions',
            render: (_: any, record: TaskResponse) => (
                <TaskActions
                    record={record}
                    onAssign={onAssign}
                    onDelete={onDelete}
                />
            ),
        },
    ], [onAssign, onDelete]);

    return (
        <Card
            title="任务列表"
            extra={
                /* 创建任务按钮 */
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={onCreate}
                >
                    创建任务
                </Button>
            }
        >
            {/* 任务列表表格 */}
            <Table
                columns={taskColumns}
                dataSource={tasks}
                rowKey="id"
                loading={loading}
                pagination={{
                    current: pagination.current,           // 当前页码
                    pageSize: pagination.pageSize,         // 每页条数
                    total: pagination.total,               // 总条数
                    showSizeChanger: true,                  // 显示每页条数选择器
                    showQuickJumper: true,                  // 显示快速跳转到某页
                    showTotal: (total, range) => 
                        `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,  // 显示总数和范围
                    pageSizeOptions: ['10', '20', '50', '100'],  // 每页条数选项
                    onChange: onPageChange,                  // 分页变化回调
                    onShowSizeChange: onPageChange,          // 每页条数变化回调
                }}
            />
        </Card>
    );
});

// 设置显示名称，便于调试
TaskTable.displayName = 'TaskTable';

export default TaskTable;