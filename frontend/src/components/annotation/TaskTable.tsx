import React from 'react';
import { Table, Tag, Button, Space, Input, Select } from 'antd';
import { SearchOutlined, EditOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { AnnotationTask } from './types';

const { Search } = Input;
const { Option } = Select;

/**
 * 任务表格组件属性接口
 */
interface TaskTableProps {
  /** 任务列表数据 */
  tasks: AnnotationTask[];
  /** 开始标注任务的回调函数 */
  onAnnotate: (task: AnnotationTask) => void;
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
 * 任务状态映射配置
 * 定义每种状态对应的显示样式和文本
 */
const statusMap = {
  /** 待标注状态 - 橙色标签 */
  pending: { color: 'orange', text: '待标注' },
  /** 已标注状态 - 蓝色标签 */
  annotated: { color: 'blue', text: '已标注' },
  /** 审核中状态 - 紫色标签 */
  reviewing: { color: 'purple', text: '审核中' },
  /** 已通过状态 - 绿色标签 */
  approved: { color: 'green', text: '已通过' },
  /** 已驳回状态 - 红色标签 */
  rejected: { color: 'red', text: '已驳回' },
};

/**
 * 任务表格组件
 * 用于显示标注任务列表，支持搜索、筛选和操作功能
 * 
 * @param props - 组件属性
 * @returns React 函数组件
 */
const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
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
  const columns: ColumnsType<AnnotationTask> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      fixed: 'left', // 固定在左侧，防止横向滚动时丢失
    },
    {
      title: '对话预览',
      dataIndex: 'dialoguePreview',
      key: 'dialoguePreview',
      ellipsis: true, // 超长文本显示省略号
      width: 300,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: keyof typeof statusMap) => (
        <Tag color={statusMap[status].color}>
          {statusMap[status].text}
        </Tag>
      ),
    },
    {
      title: 'LLM模型',
      dataIndex: 'llmModel',
      key: 'llmModel',
      width: 100,
    },
    {
      title: 'RAG启用',
      dataIndex: 'ragEnabled',
      key: 'ragEnabled',
      width: 100,
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'green' : 'default'}>
          {enabled ? '是' : '否'}
        </Tag>
      ),
    },
    {
      title: '标注员',
      dataIndex: 'annotator',
      key: 'annotator',
      width: 100,
      render: (annotator: string) => annotator || '未分配',
    },
    {
      title: '最后更新',
      dataIndex: 'lastUpdate',
      key: 'lastUpdate',
      width: 150,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right', // 固定在右侧，确保操作按钮始终可见
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<EditOutlined />}
          onClick={() => onAnnotate(record)}
        >
          {/* 根据任务状态显示不同的按钮文本 */}
          {record.status === 'pending' ? '开始标注' : '编辑'}
        </Button>
      ),
    },
  ];

  return (
    <div className="task-table" style={style}>
      {/* 表格头部工具栏 */}
      <div className="table-header" style={{ marginBottom: 16 }}>
        <Space size="middle">
          {/* 搜索框 - 支持任务ID、对话内容、标注员搜索 */}
          <Search
            placeholder="搜索任务ID、对话内容或标注员"
            allowClear
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ width: 300 }}
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
            <Option value="annotated">已标注</Option>
            <Option value="reviewing">审核中</Option>
            <Option value="approved">已通过</Option>
            <Option value="rejected">已驳回</Option>
          </Select>
        </Space>
      </div>
      
      {/* 主要数据表格 */}
      <Table
        columns={columns}
        dataSource={tasks}
        rowKey="id" // 使用任务ID作为行的唯一标识
        loading={loading}
        pagination={{
          pageSize: 10, // 每页显示10条记录
          showSizeChanger: true, // 允许改变每页条数
          showQuickJumper: true, // 显示快速跳转
          showTotal: (total, range) =>
            `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
        }}
        scroll={{ x: 1200 }} // 设置最小宽度，超出时显示横向滚动条
        size="middle" // 中等大小的表格行高
      />
    </div>
  );
};

export default TaskTable;