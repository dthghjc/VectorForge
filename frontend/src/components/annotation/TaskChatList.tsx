/**
 * TaskChat 列表组件
 * 替代原有的 ChatTable，使用正确的 TaskChat 数据流
 */

import React, { useMemo } from 'react';
import { Table, Tag, Button, Space, Input, Select, Tooltip, Progress } from 'antd';
import { SearchOutlined, EditOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { TaskChatListItem, Task } from '../../types/annotation';

const { Search } = Input;
const { Option } = Select;

// ============= 组件属性 =============

interface TaskChatListProps {
  /** 当前选中的任务 */
  task: Task | null;
  /** TaskChat 列表数据 */
  taskChats: TaskChatListItem[];
  /** 加载状态 */
  loading?: boolean;
  /** 分页信息 */
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  /** 开始标注回调 */
  onAnnotate: (taskChatItem: TaskChatListItem) => void;
  /** 搜索文本 */
  searchText: string;
  /** 搜索变化回调 */
  onSearchChange: (value: string) => void;
  /** 状态筛选 */
  statusFilter: string;
  /** 状态筛选变化回调 */
  onStatusFilterChange: (value: string) => void;
  /** 分页变化回调 */
  onPageChange: (page: number, pageSize: number) => void;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

// ============= 状态映射 =============

const annotationStatusMap = {
  pending: { color: 'orange', text: '待标注', icon: <ClockCircleOutlined /> },
  completed: { color: 'green', text: '已完成', icon: <CheckCircleOutlined /> },
  skipped: { color: 'gray', text: '已跳过', icon: <CheckCircleOutlined /> },
};

const annotationResultMap = {
  approved: { color: 'green', text: '通过' },
  rejected: { color: 'red', text: '拒绝' },
  flagged: { color: 'orange', text: '标记' },
};

// ============= 主组件 =============

const TaskChatList: React.FC<TaskChatListProps> = ({
  task,
  taskChats,
  loading = false,
  pagination,
  onAnnotate,
  searchText,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onPageChange,
  style,
}) => {
  
  // ============= 数据过滤 =============
  
  const filteredTaskChats = useMemo(() => {
    return (taskChats || []).filter(taskChat => {
      // 搜索匹配：对话标题
      const matchesSearch = !searchText || 
        taskChat.chat_title.toLowerCase().includes(searchText.toLowerCase());
      
      // 状态筛选
      const matchesStatus = !statusFilter || taskChat.annotation_status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [taskChats, searchText, statusFilter]);

  // ============= 表格列定义 =============
  
  const columns: ColumnsType<TaskChatListItem> = [
    {
      title: '对话标题',
      dataIndex: 'chat_title',
      key: 'chat_title',
      ellipsis: true,
      render: (title: string, record: TaskChatListItem) => (
        <div>
          <div style={{ fontWeight: 500 }}>{title}</div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            {record.chat_message_count} 条消息
          </div>
        </div>
      ),
    },
    {
      title: '标注状态',
      dataIndex: 'annotation_status',
      key: 'annotation_status',
      width: 120,
      render: (status: keyof typeof annotationStatusMap) => {
        const statusConfig = annotationStatusMap[status];
        return (
          <Tag color={statusConfig.color} icon={statusConfig.icon}>
            {statusConfig.text}
          </Tag>
        );
      },
    },
    {
      title: '标注结果',
      dataIndex: 'annotation_result',
      key: 'annotation_result',
      width: 100,
      render: (result: keyof typeof annotationResultMap | undefined) => {
        if (!result) return <span style={{ color: '#ccc' }}>-</span>;
        
        const resultConfig = annotationResultMap[result];
        return (
          <Tag color={resultConfig.color}>
            {resultConfig.text}
          </Tag>
        );
      },
    },
    {
      title: '意图分类',
      dataIndex: ['annotation_data', 'intent_category'],
      key: 'intent_category',
      width: 120,
      render: (intentCategory: string) => {
        const intentMap: Record<string, string> = {
          information_query: '信息查询',
          instruction_following: '指令遵循',
          content_creation: '内容创作',
          chat: '闲聊',
        };
        
        return intentCategory ? (
          <Tag color="blue">{intentMap[intentCategory] || intentCategory}</Tag>
        ) : (
          <span style={{ color: '#ccc' }}>未标注</span>
        );
      },
    },
    {
      title: '满意度',
      dataIndex: ['annotation_data', 'overall_satisfaction'],
      key: 'overall_satisfaction',
      width: 100,
      render: (satisfaction: number) => {
        if (!satisfaction) return <span style={{ color: '#ccc' }}>-</span>;
        
        const getColor = (score: number) => {
          if (score >= 4) return '#52c41a';
          if (score >= 3) return '#faad14';
          return '#ff4d4f';
        };
        
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Progress
              type="circle"
              size={32}
              percent={satisfaction * 20}
              strokeColor={getColor(satisfaction)}
              format={() => satisfaction}
            />
          </div>
        );
      },
    },
    {
      title: '标注时间',
      dataIndex: 'annotated_at',
      key: 'annotated_at',
      width: 160,
      render: (annotatedAt: string) => {
        if (!annotatedAt) return <span style={{ color: '#ccc' }}>-</span>;
        
        return (
          <div style={{ fontSize: '12px' }}>
            {new Date(annotatedAt).toLocaleString('zh-CN', {
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        );
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record: TaskChatListItem) => (
        <Space size="small">
          <Tooltip title={record.annotation_status === 'completed' ? '重新标注' : '开始标注'}>
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onAnnotate(record)}
            >
              {record.annotation_status === 'completed' ? '重标' : '标注'}
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // ============= 统计信息 =============
  
  const stats = useMemo(() => {
    const taskChatsList = taskChats || [];
    const total = taskChatsList.length;
    const completed = taskChatsList.filter(tc => tc.annotation_status === 'completed').length;
    const pending = taskChatsList.filter(tc => tc.annotation_status === 'pending').length;
    const skipped = taskChatsList.filter(tc => tc.annotation_status === 'skipped').length;
    
    return { total, completed, pending, skipped };
  }, [taskChats]);

  // ============= 渲染 =============

  return (
    <div style={style}>


      {/* 搜索和筛选栏 */}
      <div style={{ 
        marginBottom: '16px', 
        display: 'flex', 
        gap: '12px', 
        alignItems: 'center',
        flexWrap: 'wrap' 
      }}>
        <Search
          placeholder="搜索对话标题..."
          allowClear
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ width: '300px' }}
          prefix={<SearchOutlined />}
        />
        
        <Select
          placeholder="标注状态"
          allowClear
          value={statusFilter || undefined}
          onChange={onStatusFilterChange}
          style={{ width: '120px' }}
        >
          <Option value="pending">待标注</Option>
          <Option value="completed">已完成</Option>
          <Option value="skipped">已跳过</Option>
        </Select>

        {/* 统计信息 */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', fontSize: '14px' }}>
          <span>总计: <strong>{stats.total}</strong></span>
          <span style={{ color: '#52c41a' }}>已完成: <strong>{stats.completed}</strong></span>
          <span style={{ color: '#faad14' }}>待标注: <strong>{stats.pending}</strong></span>
          {stats.skipped > 0 && (
            <span style={{ color: '#d9d9d9' }}>已跳过: <strong>{stats.skipped}</strong></span>
          )}
        </div>
      </div>

      {/* 数据表格 */}
      <Table<TaskChatListItem>
        columns={columns}
        dataSource={filteredTaskChats}
        rowKey="id"
        loading={loading}
        pagination={{
          current: pagination.page,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} 共 ${total} 条`,
          pageSizeOptions: ['10', '20', '50', '100'],
          onChange: onPageChange,
          onShowSizeChange: onPageChange,
        }}
        scroll={{ x: 1200 }}
        size="middle"
        rowClassName={(record) => 
          record.annotation_status === 'completed' ? 'ant-table-row-completed' : ''
        }
      />

      {/* 自定义样式 */}
      <style>{`
        .ant-table-row-completed {
          background-color: #f6ffed;
        }
        
        .ant-table-row-completed:hover > td {
          background-color: #f6ffed !important;
        }
      `}</style>
    </div>
  );
};

export default TaskChatList;
