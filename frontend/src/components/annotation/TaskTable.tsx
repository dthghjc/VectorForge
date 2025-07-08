import React from 'react';
import { Table, Tag, Button, Space, Input, Select } from 'antd';
import { SearchOutlined, EditOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { AnnotationTask } from './types';

const { Search } = Input;
const { Option } = Select;

interface TaskTableProps {
  tasks: AnnotationTask[];
  onAnnotate: (task: AnnotationTask) => void;
  searchText: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  loading?: boolean;
}

const statusMap = {
  pending: { color: 'orange', text: '待标注' },
  annotated: { color: 'blue', text: '已标注' },
  reviewing: { color: 'purple', text: '审核中' },
  approved: { color: 'green', text: '已通过' },
  rejected: { color: 'red', text: '已驳回' },
};

const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  onAnnotate,
  searchText,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  loading = false,
}) => {
  const columns: ColumnsType<AnnotationTask> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      fixed: 'left',
    },
    {
      title: '对话预览',
      dataIndex: 'dialoguePreview',
      key: 'dialoguePreview',
      ellipsis: true,
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
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<EditOutlined />}
          onClick={() => onAnnotate(record)}
        >
          {record.status === 'pending' ? '开始标注' : '编辑'}
        </Button>
      ),
    },
  ];

  return (
    <div className="task-table">
      <div className="table-header" style={{ marginBottom: 16 }}>
        <Space size="middle">
          <Search
            placeholder="搜索任务ID、对话内容或标注员"
            allowClear
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
          />
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
      <Table
        columns={columns}
        dataSource={tasks}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
        }}
        scroll={{ x: 1200 }}
        size="middle"
      />
    </div>
  );
};

export default TaskTable;