import React, { useState, useEffect } from 'react';
import { 
    Card, 
    Button, 
    Table, 
    Modal, 
    Form, 
    Input, 
    Select, 
    DatePicker, 
    message, 
    Tabs, 
    Statistic, 
    Tag, 
    Space,
    Row,
    Col,
    Spin,
    Typography,
    Popconfirm,
    Checkbox
} from 'antd';
import { 
    PlusOutlined, 
    EditOutlined, 
    DeleteOutlined, 
    UserOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { 
    getAllUsers,
    type UserBasic,
    getTasks,
    createTask,
    assignTask,
    deleteTask,
    getTaskStats,
    getPendingChats,
    type TaskResponse,
    type TaskCreate,
    type TaskStats,
    type PendingChat,
    TaskStatus,
    TaskPriority
} from '../../api';
import { getChats, type ChatBasicResponse } from '../../api/chat';

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;
const { TabPane } = Tabs;

// 状态颜色映射
const statusColors = {
    [TaskStatus.CREATED]: 'default',
    [TaskStatus.ASSIGNED]: 'processing',
    [TaskStatus.IN_PROGRESS]: 'warning',
    [TaskStatus.COMPLETED]: 'success',
    [TaskStatus.CANCELLED]: 'error',
};

// 优先级颜色映射
const priorityColors = {
    [TaskPriority.LOW]: 'default',
    [TaskPriority.NORMAL]: 'blue',
    [TaskPriority.HIGH]: 'orange',
    [TaskPriority.URGENT]: 'red',
};

const TaskManagement: React.FC = () => {
    const [users, setUsers] = useState<UserBasic[]>([]);
    const [tasks, setTasks] = useState<TaskResponse[]>([]);
    const [stats, setStats] = useState<TaskStats | null>(null);
    const [pendingChats, setPendingChats] = useState<PendingChat[]>([]);
    const [allChats, setAllChats] = useState<ChatBasicResponse[]>([]);
    const [selectedChats, setSelectedChats] = useState<string[]>([]);
    const [chatSourceType, setChatSourceType] = useState<'pending' | 'all'>('pending');
    
    const [loading, setLoading] = useState(false);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [chatModalVisible, setChatModalVisible] = useState(false);
    const [assignModalVisible, setAssignModalVisible] = useState(false);
    const [selectedTask, setSelectedTask] = useState<TaskResponse | null>(null);
    
    const [form] = Form.useForm();
    const [assignForm] = Form.useForm();

    // 获取标注员列表
    const fetchUsers = async () => {
        try {
            const annotationUsers = await getAllUsers({
                skip: 0,
                limit: 100,
                role: "annotation",
                is_active: true
            });
            setUsers(annotationUsers);
        } catch (error) {
            console.error("获取用户失败:", error);
            message.error("获取用户失败");
        }
    };

    // 获取任务列表
    const fetchTasks = async () => {
        try {
            setLoading(true);
            const taskList = await getTasks();
            setTasks(taskList);
        } catch (error) {
            console.error("获取任务失败:", error);
            message.error("获取任务失败");
        } finally {
            setLoading(false);
        }
    };

    // 获取任务统计
    const fetchStats = async () => {
        try {
            const taskStats = await getTaskStats();
            setStats(taskStats);
        } catch (error) {
            console.error("获取统计失败:", error);
        }
    };

    // 获取待审核对话
    const fetchPendingChats = async () => {
        try {
            const chats = await getPendingChats({ limit: 100 });
            setPendingChats(chats);
        } catch (error) {
            console.error("获取待审核对话失败:", error);
            message.error("获取待审核对话失败");
        }
    };

    // 获取所有对话
    const fetchAllChats = async () => {
        try {
            const chats = await getChats({ limit: 200 });
            setAllChats(chats);
        } catch (error) {
            console.error("获取对话列表失败:", error);
            message.error("获取对话列表失败");
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchTasks();
        fetchStats();
    }, []);

    // 创建任务
    const handleCreateTask = async (values: any) => {
        try {
            setLoading(true);
            const taskData: TaskCreate = {
                title: values.title,
                description: values.description,
                priority: values.priority || TaskPriority.NORMAL,
                deadline: values.deadline ? values.deadline.toISOString() : undefined,
                assigned_to_id: values.assigned_to_id,
                chat_ids: selectedChats,
            };
            
            await createTask(taskData);
            message.success('任务创建成功');
            setCreateModalVisible(false);
            setSelectedChats([]);
            form.resetFields();
            fetchTasks();
            fetchStats();
        } catch (error) {
            console.error("创建任务失败:", error);
            message.error("创建任务失败");
        } finally {
            setLoading(false);
        }
    };

    // 分配任务
    const handleAssignTask = async (values: any) => {
        if (!selectedTask) return;
        
        try {
            setLoading(true);
            await assignTask(selectedTask.id, { assigned_to_id: values.assigned_to_id });
            message.success('任务分配成功');
            setAssignModalVisible(false);
            setSelectedTask(null);
            assignForm.resetFields();
            fetchTasks();
        } catch (error) {
            console.error("分配任务失败:", error);
            message.error("分配任务失败");
        } finally {
            setLoading(false);
        }
    };

    // 删除任务
    const handleDeleteTask = async (taskId: string) => {
        try {
            setLoading(true);
            await deleteTask(taskId);
            message.success('任务删除成功');
            fetchTasks();
            fetchStats();
        } catch (error) {
            console.error("删除任务失败:", error);
            message.error("删除任务失败");
        } finally {
            setLoading(false);
        }
    };

    // 选择对话
    const handleSelectChats = () => {
        if (chatSourceType === 'pending') {
            fetchPendingChats();
        } else {
            fetchAllChats();
        }
        setChatModalVisible(true);
    };

    // 任务表格列定义
    const taskColumns = [
        {
            title: '任务标题',
            dataIndex: 'title',
            key: 'title',
            render: (text: string, record: TaskResponse) => (
                <div>
                    <div style={{ fontWeight: 'bold' }}>{text}</div>
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
                <Tag color={statusColors[status as TaskStatus]}>
                    {status.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: '优先级',
            dataIndex: 'priority',
            key: 'priority',
            render: (priority: string) => (
                <Tag color={priorityColors[priority as TaskPriority]}>
                    {priority.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: '进度',
            key: 'progress',
            render: (_: any, record: TaskResponse) => (
                <div>
                    <div>{record.completed_chats}/{record.total_chats}</div>
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
                    <span>
                        <UserOutlined /> {record.assigned_to.username}
                    </span>
                ) : (
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
                    <span style={{ color: record.is_overdue ? '#ff4d4f' : undefined }}>
                        <ClockCircleOutlined /> {dayjs(deadline).format('YYYY-MM-DD HH:mm')}
                        {record.is_overdue && <Tag color="red">逾期</Tag>}
                    </span>
                ) : (
                    <span style={{ color: '#999' }}>无限制</span>
                )
            ),
        },
        {
            title: '操作',
            key: 'actions',
            render: (_: any, record: TaskResponse) => (
                <Space>
                    {!record.assigned_to_id && (
                        <Button
                            type="link"
                            icon={<UserOutlined />}
                            onClick={() => {
                                setSelectedTask(record);
                                setAssignModalVisible(true);
                            }}
                        >
                            分配
                        </Button>
                    )}
                    <Popconfirm
                        title="确定删除这个任务吗？"
                        onConfirm={() => handleDeleteTask(record.id)}
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
            ),
        },
    ];

    // 待审核对话表格列定义
    const pendingChatColumns = [
        {
            title: '对话标题',
            dataIndex: 'title',
            key: 'title',
            ellipsis: true,
        },
        {
            title: '待审核消息数',
            dataIndex: 'pending_message_count',
            key: 'pending_message_count',
            render: (count: number) => (
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
    ];

    // 所有对话表格列定义
    const allChatColumns = [
        {
            title: '对话标题',
            dataIndex: 'title',
            key: 'title',
            ellipsis: true,
            render: (title: string) => title || '未命名对话',
        },
        {
            title: '消息数量',
            dataIndex: 'message_count',
            key: 'message_count',
            render: (count: number) => (
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
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Title level={2}>任务管理</Title>

            {/* 统计卡片 */}
            <Row gutter={16} style={{ marginBottom: '24px' }}>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="总任务数"
                            value={stats?.total_tasks || 0}
                            prefix={<ExclamationCircleOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="进行中"
                            value={stats?.in_progress_tasks || 0}
                            prefix={<ClockCircleOutlined />}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="已完成"
                            value={stats?.completed_tasks || 0}
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="完成率"
                            value={stats?.overall_completion_rate || 0}
                            suffix="%"
                            precision={1}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* 任务列表 */}
            <Card
                title="任务列表"
                extra={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setCreateModalVisible(true)}
                    >
                        创建任务
                    </Button>
                }
            >
                <Table
                    columns={taskColumns}
                    dataSource={tasks}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total) => `共 ${total} 条记录`,
                    }}
                />
            </Card>

            {/* 创建任务Modal */}
            <Modal
                title="创建新任务"
                open={createModalVisible}
                onCancel={() => {
                    setCreateModalVisible(false);
                    setSelectedChats([]);
                    form.resetFields();
                }}
                footer={null}
                width={800}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreateTask}
                >
                    <Form.Item
                        name="title"
                        label="任务标题"
                        rules={[{ required: true, message: '请输入任务标题' }]}
                    >
                        <Input placeholder="请输入任务标题" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="任务描述"
                    >
                        <TextArea rows={4} placeholder="请输入任务描述" />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="priority"
                                label="优先级"
                            >
                                <Select placeholder="选择优先级">
                                    <Option value={TaskPriority.LOW}>低</Option>
                                    <Option value={TaskPriority.NORMAL}>普通</Option>
                                    <Option value={TaskPriority.HIGH}>高</Option>
                                    <Option value={TaskPriority.URGENT}>紧急</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="deadline"
                                label="截止时间"
                            >
                                <DatePicker
                                    showTime
                                    style={{ width: '100%' }}
                                    placeholder="选择截止时间"
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="assigned_to_id"
                        label="分配给"
                    >
                        <Select
                            placeholder="选择标注员"
                            allowClear
                            showSearch
                            filterOption={(input, option: any) =>
                                option?.children?.toLowerCase().includes(input.toLowerCase())
                            }
                        >
                            {users.map(user => (
                                <Option key={user.id} value={user.id}>
                                    {user.username}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item label="选择对话">
                        <div style={{ marginBottom: '8px' }}>
                            <Select
                                value={chatSourceType}
                                onChange={setChatSourceType}
                                style={{ width: '200px', marginRight: '8px' }}
                            >
                                <Option value="pending">仅待审核对话</Option>
                                <Option value="all">所有对话</Option>
                            </Select>
                            <Button onClick={handleSelectChats}>
                                选择对话 ({selectedChats.length} 已选择)
                            </Button>
                        </div>
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                创建任务
                            </Button>
                            <Button onClick={() => {
                                setCreateModalVisible(false);
                                setSelectedChats([]);
                                form.resetFields();
                            }}>
                                取消
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* 选择对话Modal */}
            <Modal
                title={chatSourceType === 'pending' ? "选择待审核对话" : "选择对话"}
                open={chatModalVisible}
                onCancel={() => setChatModalVisible(false)}
                onOk={() => setChatModalVisible(false)}
                width={1000}
            >
                <Table
                    columns={chatSourceType === 'pending' ? pendingChatColumns : allChatColumns}
                    dataSource={chatSourceType === 'pending' ? pendingChats : allChats as any}
                    rowKey="id"
                    rowSelection={{
                        selectedRowKeys: selectedChats,
                        onChange: (selectedRowKeys) => {
                            setSelectedChats(selectedRowKeys as string[]);
                        },
                    }}
                    pagination={{
                        showSizeChanger: true,
                        showTotal: (total) => `共 ${total} 个对话`,
                    }}
                />
            </Modal>

            {/* 分配任务Modal */}
            <Modal
                title="分配任务"
                open={assignModalVisible}
                onCancel={() => {
                    setAssignModalVisible(false);
                    setSelectedTask(null);
                    assignForm.resetFields();
                }}
                footer={null}
            >
                <Form
                    form={assignForm}
                    layout="vertical"
                    onFinish={handleAssignTask}
                >
                    <Form.Item
                        name="assigned_to_id"
                        label="分配给"
                        rules={[{ required: true, message: '请选择标注员' }]}
                    >
                        <Select
                            placeholder="选择标注员"
                            showSearch
                            filterOption={(input, option: any) =>
                                option?.children?.toLowerCase().includes(input.toLowerCase())
                            }
                        >
                            {users.map(user => (
                                <Option key={user.id} value={user.id}>
                                    {user.username}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                分配任务
                            </Button>
                            <Button onClick={() => {
                                setAssignModalVisible(false);
                                setSelectedTask(null);
                                assignForm.resetFields();
                            }}>
                                取消
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default TaskManagement;