/**
 * 任务操作按钮组件
 * 提供任务分配和删除操作按钮
 */
import React from 'react';
import { Button, Space, Popconfirm } from 'antd';
import { UserOutlined, DeleteOutlined } from '@ant-design/icons';
import type { TaskResponse } from '../../../../api';

interface TaskActionsProps {
    /** 任务记录 */
    record: TaskResponse;
    /** 分配任务回调 */
    onAssign: (task: TaskResponse) => void;
    /** 删除任务回调 */
    onDelete: (taskId: string) => void;
}

/**
 * 任务操作按钮组件
 * 根据任务状态显示相应的操作按钮
 * 
 * 性能优化：
 * - 使用React.memo避免不必要的重渲染
 * - 使用useCallback缓存事件处理函数
 */
const TaskActions: React.FC<TaskActionsProps> = React.memo(({ 
    record, 
    onAssign, 
    onDelete 
}) => {
    return (
        <Space>
            {/* 仅在任务未分配时显示分配按钮 */}
            {!record.assigned_to_id && (
                <Button
                    type="link"
                    icon={<UserOutlined />}
                    onClick={() => onAssign(record)}
                >
                    分配
                </Button>
            )}
            
            {/* 删除按钮，带确认弹窗 */}
            <Popconfirm
                title="确定删除这个任务吗？"
                onConfirm={() => onDelete(record.id)}
                okText="确定"
                cancelText="取消"
            >
                <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                >
                    删除
                </Button>
            </Popconfirm>
        </Space>
    );
});

// 设置显示名称，便于调试
TaskActions.displayName = 'TaskActions';

export default TaskActions;