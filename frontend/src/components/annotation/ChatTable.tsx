import React from 'react';
import { Table, Tag, Button, Space, Input, Select, Tooltip } from 'antd';
import { SearchOutlined, EditOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { ChatListItem } from './types';

const { Search } = Input;
const { Option } = Select;

/**
 * Chat表格组件属性接口
 */
interface ChatTableProps {
  /** Chat列表数据 */
  chatItems: ChatListItem[];
  /** 开始标注Chat的回调函数 */
  onAnnotate: (chatItem: ChatListItem) => void;
  /** 搜索文本 */
  searchText: string;
  /** 搜索文本变化的回调函数 */
  onSearchChange: (value: string) => void;
  /** 状态筛选值 */
  statusFilter: string;
  /** 状态筛选变化的回调函数 */
  onStatusFilterChange: (value: string) => void;
  /** 表格加载状态 */
  loading?: boolean;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

/**
 * 标注状态映射配置
 * 定义每种状态对应的显示样式和文本
 */
const annotationStatusMap = {
  /** 待标注状态 - 橙色标签 */
  pending: { color: 'orange', text: '待标注' },
  /** 已完成状态 - 绿色标签 */
  completed: { color: 'green', text: '已完成' },
  /** 已跳过状态 - 灰色标签 */
  skipped: { color: 'default', text: '已跳过' },
};

/**
 * 格式化时间显示
 * @param dateStr - 时间字符串
 * @returns 格式化后的时间
 */
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

/**
 * Chat表格组件
 * 用于显示Chat标注任务列表，支持搜索、筛选和操作功能
 * 
 * @param props - 组件属性
 * @returns React 函数组件
 */
const ChatTable: React.FC<ChatTableProps> = ({
  chatItems,
  onAnnotate,
  searchText,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  loading = false,
  style,
}) => {
  /**
   * 表格列配置
   * 定义表格的列结构、渲染方式和交互行为
   */
  const columns: ColumnsType<ChatListItem> = [
    {
      title: '对话标题',
      key: 'chatTitle',
      width: 200,
      fixed: 'left', // 固定在左侧，防止横向滚动时丢失
      render: (_, record) => (
        <Tooltip title={record.chat.title} placement="topLeft">
          <div style={{ 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap',
            maxWidth: '180px'
          }}>
            {record.chat.title}
          </div>
        </Tooltip>
      ),
    },
    {
      title: '任务名称',
      key: 'taskTitle',
      width: 150,
      render: (_, record) => (
        <div style={{ 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
          maxWidth: '130px'
        }}>
          {record.task.title}
        </div>
      ),
    },
    {
      title: '任务描述',
      key: 'taskDescription',
      width: 250,
      render: (_, record) => (
        <Tooltip title={record.task.description} placement="topLeft">
          <div style={{ 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap',
            maxWidth: '230px'
          }}>
            {record.task.description}
          </div>
        </Tooltip>
      ),
    },
    {
      title: '消息数量',
      key: 'messageCount',
      width: 100,
      align: 'center',
      render: (_, record) => `${record.chat.messageCount} 条`,
    },
    {
      title: '最后更新时间',
      key: 'createdAt',
      width: 150,
      render: (_, record) => formatDate(record.chat.createdAt),
    },
    {
      title: '状态',
      key: 'annotationStatus',
      width: 100,
      align: 'center',
      render: (_, record) => {
        const statusConfig = annotationStatusMap[record.chat.annotationStatus];
        return (
          <Tag color={statusConfig.color}>
            {statusConfig.text}
          </Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right', // 固定在右侧，确保操作按钮始终可见
      align: 'center',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<EditOutlined />}
          onClick={() => onAnnotate(record)}
          disabled={record.chat.annotationStatus === 'skipped'} // 已跳过的不能编辑
        >
          {/* 根据Chat状态显示不同的按钮文本 */}
          {record.chat.annotationStatus === 'pending' ? '开始标注' : 
           record.chat.annotationStatus === 'completed' ? '查看编辑' : '已跳过'}
        </Button>
      ),
    },
  ];

  return (
    <div
      className="chat-table"
      style={{
        ...style,
        display: 'flex',
        flexDirection: 'column',
        width: '100%', // 确保占满父容器宽度
        boxSizing: 'border-box', // 确保 padding 包含在宽度内
      }}
    >
      {/* 表格头部工具栏 */}
      <div className="table-header" style={{ marginBottom: 16 }}>
        <Space size="middle">
          {/* 搜索框 - 支持对话标题、任务名称搜索 */}
          <Search
            placeholder="搜索对话标题或任务名称"
            allowClear
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ width: 280 }}
            prefix={<SearchOutlined />}
          />
          {/* 状态筛选下拉框 */}
          <Select
            placeholder="筛选状态"
            allowClear
            value={statusFilter}
            onChange={onStatusFilterChange}
            style={{ width: 120 }}
          >
            <Option value="pending">待标注</Option>
            <Option value="completed">已完成</Option>
            <Option value="skipped">已跳过</Option>
          </Select>
        </Space>
      </div>
      
      {/* 主要数据表格 */}
      <Table
        columns={columns}
        dataSource={chatItems}
        rowKey={(record) => record.chat.id} // 使用ChatID作为行的唯一标识
        loading={loading}
        pagination={{
          pageSize: 10, // 每页显示10条记录
          showSizeChanger: true, // 允许改变每页条数
          showQuickJumper: true, // 显示快速跳转
          showTotal: (total, range) =>
            `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
        }}
        scroll={{ x: 'max-content' }} // 自适应内容宽度
        size="middle" // 中等大小的表格行高
      />
    </div>
  );
};

export default ChatTable;
