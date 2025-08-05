/**
 * 任务统计组件
 * 显示任务总数、进行中、已完成、完成率等统计信息
 */
import React from 'react';
import { Card, Statistic, Row, Col } from 'antd';
import {
    ExclamationCircleOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';
import type { TaskStats } from '../../../api';

interface TaskStatsProps {
    /** 任务统计数据 */
    stats: TaskStats | null;
}

/**
 * 任务统计卡片组件
 * 展示4个关键统计指标
 * 
 * 性能优化：
 * - 使用React.memo避免不必要的重渲染
 * - 只有当stats发生变化时才重新渲染
 */
const TaskStatsComponent: React.FC<TaskStatsProps> = React.memo(({ stats }) => {
    return (
        <Row gutter={16} style={{ marginBottom: '24px' }}>
            {/* 总任务数统计 */}
            <Col span={6}>
                <Card>
                    <Statistic
                        title="总任务数"
                        value={stats?.total_tasks || 0}
                        prefix={<ExclamationCircleOutlined />}
                    />
                </Card>
            </Col>
            
            {/* 进行中任务数统计 */}
            <Col span={6}>
                <Card>
                    <Statistic
                        title="进行中"
                        value={stats?.in_progress_tasks || 0}
                        prefix={<ClockCircleOutlined />}
                        valueStyle={{ color: '#faad14' }}  // 橙色表示进行中
                    />
                </Card>
            </Col>
            
            {/* 已完成任务数统计 */}
            <Col span={6}>
                <Card>
                    <Statistic
                        title="已完成"
                        value={stats?.completed_tasks || 0}
                        prefix={<CheckCircleOutlined />}
                        valueStyle={{ color: '#52c41a' }}  // 绿色表示已完成
                    />
                </Card>
            </Col>
            
            {/* 总体完成率统计 */}
            <Col span={6}>
                <Card>
                    <Statistic
                        title="完成率"
                        value={stats?.overall_completion_rate || 0}
                        suffix="%"
                        precision={1}
                        valueStyle={{ color: '#1890ff' }}  // 蓝色显示完成率
                    />
                </Card>
            </Col>
        </Row>
    );
});

// 设置显示名称，便于调试
TaskStatsComponent.displayName = 'TaskStatsComponent';

export default TaskStatsComponent;