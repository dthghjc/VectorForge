/**
 * 任务管理组件
 * 用于管理对话标注任务，包括任务创建、分配、删除等功能
 * 支持对话选择、标注员分配、任务统计等核心功能
 * 
 * 重构说明：
 * - 使用useReducer管理复杂状态
 * - 提取自定义Hook处理业务逻辑
 * - 拆分为多个职责单一的子组件
 * - 优化组件结构和可维护性
 */
import React, { useEffect, useCallback } from 'react';
import { Typography, Form } from 'antd';
// 导入任务相关的类型定义
import { type TaskResponse, type TaskCreate } from '../../api';
// 导入自定义Hook (从全局hooks文件夹)
import { useTaskData } from '../../hooks/useTaskData';
import { useTaskUI } from '../../hooks/useTaskUI';
import { useTaskOperations } from '../../hooks/useTaskOperations';
// 导入拆分后的子组件
import TaskStatsComponent from './components/TaskStats';
import TaskTable from './components/TaskTable';
import CreateTaskModal from './modals/CreateTaskModal';
import ChatSelectionModal from './modals/ChatSelectionModal';
import AssignTaskModal from './modals/AssignTaskModal';

// 从Ant Design组件中解构需要的子组件
const { Title } = Typography;

/**
 * 任务管理主组件
 * 提供任务的创建、分配、删除等完整功能
 * 
 * 重构后的组件使用自定义Hook管理状态，提高了代码的可维护性和可测试性
 */
const TaskManagement: React.FC = () => {
    // ==================== Hook状态管理 ====================
    // 数据状态管理Hook
    const {
        dataState,
        fetchUsers,
        fetchTasks,
        fetchStats,
        fetchPendingChats,
        fetchAllChats,
    } = useTaskData();

    // UI状态管理Hook
    const {
        uiState,
        setLoading,
        toggleModal,
        setSelectedChats,
        setChatSourceType,
        setSelectedTask,
        resetSelection,
    } = useTaskUI();

    // 任务操作Hook
    const {
        handleCreateTask,
        handleAssignTask,
        handleDeleteTask,
    } = useTaskOperations();

    // ==================== 表单实例 ====================
    const [form] = Form.useForm();         // 创建任务表单实例
    const [assignForm] = Form.useForm();   // 分配任务表单实例

    // ==================== 状态解构 ====================
    const { users, tasks, stats, pendingChats, allChats } = dataState;
    const { 
        loading, 
        modals: { create: createModalVisible, chat: chatModalVisible, assign: assignModalVisible },
        selection: { chatIds: selectedChats, chatSourceType, task: selectedTask }
    } = uiState;

    // ==================== 组件初始化 ====================

    /**
     * 组件初始化时获取必要数据
     * 包括用户列表、任务列表、统计数据
     */
    useEffect(() => {
        fetchUsers();     // 获取标注员列表
        fetchTasks();     // 获取任务列表
        fetchStats();     // 获取统计数据
    }, [fetchUsers, fetchTasks, fetchStats]);

    // ==================== 事件处理函数 ====================

    /**
     * 处理创建任务表单提交
     * @param values 表单数据
     */
    const onCreateTask = async (values: any) => {
        setLoading(true);
        try {
            // 构造任务创建数据
            const taskData: TaskCreate = {
                title: values.title,
                description: values.description,
                priority: values.priority || 'normal',
                deadline: values.deadline ? values.deadline.toISOString() : undefined,
                assigned_to_id: values.assigned_to_id,
                chat_ids: selectedChats,
            };
            
            await handleCreateTask(taskData, () => {
                // 成功回调：重置UI状态和刷新数据
                toggleModal('create', false);
                resetSelection();
                form.resetFields();
                fetchTasks();
                fetchStats();
            });
        } finally {
            setLoading(false);
        }
    };

    /**
     * 处理任务分配表单提交
     * @param values 表单数据，包含分配的用户ID
     */
    const onAssignTask = async (values: any) => {
        if (!selectedTask) return;
        
        setLoading(true);
        try {
            await handleAssignTask(selectedTask.id, { assigned_to_id: values.assigned_to_id }, () => {
                // 成功回调：重置UI状态和刷新数据
                toggleModal('assign', false);
                setSelectedTask(null);
                assignForm.resetFields();
                fetchTasks();
            });
        } finally {
            setLoading(false);
        }
    };

    /**
     * 处理删除任务操作
     * @param taskId 要删除的任务ID
     */
    const onDeleteTask = async (taskId: string) => {
        setLoading(true);
        try {
            await handleDeleteTask(taskId, () => {
                // 成功回调：刷新数据
                fetchTasks();
                fetchStats();
            });
        } finally {
            setLoading(false);
        }
    };

    /**
     * 处理选择对话操作
     * 根据对话来源类型获取相应的对话列表并显示选择弹窗
     */
    const onSelectChats = () => {
        if (chatSourceType === 'pending') {
            fetchPendingChats();    // 获取待审核对话
        } else {
            fetchAllChats();        // 获取所有对话
        }
        toggleModal('chat', true);
    };

    // ==================== 任务操作回调函数 ====================
    
    /**
     * 处理任务分配操作
     * 使用useCallback缓存函数引用，避免子组件不必要的重渲染
     */
    const handleTaskAssign = useCallback((task: TaskResponse) => {
        setSelectedTask(task);
        toggleModal('assign', true);
    }, [setSelectedTask, toggleModal]);
    
    /**
     * 处理弹窗关闭操作
     * 使用useCallback缓存函数引用
     */
    const handleCreateModalCancel = useCallback(() => {
        toggleModal('create', false);
        resetSelection();
        form.resetFields();
    }, [toggleModal, resetSelection, form]);
    
    const handleAssignModalCancel = useCallback(() => {
        toggleModal('assign', false);
        setSelectedTask(null);
        assignForm.resetFields();
    }, [toggleModal, setSelectedTask, assignForm]);
    
    /**
     * 处理创建任务按钮点击
     */
    const handleCreateClick = useCallback(() => {
        toggleModal('create', true);
    }, [toggleModal]);
    
    /**
     * 处理对话选择按钮点击
     */
    const handleSelectChats = useCallback(() => {
        onSelectChats();
    }, [onSelectChats]);
    
    /**
     * 处理对话选择弹窗关闭
     */
    const handleChatModalCancel = useCallback(() => {
        toggleModal('chat', false);
    }, [toggleModal]);
    
    const handleChatModalOk = useCallback(() => {
        toggleModal('chat', false);
    }, [toggleModal]);

    // ==================== 组件渲染 ====================
    
    return (
        <div style={{ padding: '24px' }}>
            <Title level={2}>任务管理</Title>

            {/* 任务统计组件 */}
            <TaskStatsComponent stats={stats} />

            {/* 任务表格组件 */}
            <TaskTable
                tasks={tasks}
                loading={loading}
                onCreate={handleCreateClick}
                onAssign={handleTaskAssign}
                onDelete={onDeleteTask}
            />

            {/* ==================== 弹窗组件 ==================== */}
            
            {/* 创建任务弹窗 */}
            <CreateTaskModal
                visible={createModalVisible}
                loading={loading}
                users={users}
                chatSourceType={chatSourceType}
                selectedChatsCount={selectedChats.length}
                form={form}
                onCancel={handleCreateModalCancel}
                onSubmit={onCreateTask}
                onChatSourceTypeChange={setChatSourceType}
                onSelectChats={handleSelectChats}
            />

            {/* 对话选择弹窗 */}
            <ChatSelectionModal
                visible={chatModalVisible}
                chatSourceType={chatSourceType}
                pendingChats={pendingChats}
                allChats={allChats}
                selectedChats={selectedChats}
                onCancel={handleChatModalCancel}
                onOk={handleChatModalOk}
                onSelectionChange={setSelectedChats}
            />

            {/* 分配任务弹窗 */}
            <AssignTaskModal
                visible={assignModalVisible}
                loading={loading}
                users={users}
                form={assignForm}
                onCancel={handleAssignModalCancel}
                onSubmit={onAssignTask}
            />
        </div>
    );
};

/**
 * 导出任务管理组件
 * 
 * 主要功能：
 * 1. 任务管理：创建、分配、删除任务
 * 2. 对话选择：支持从待审核对话或全部对话中选择
 * 3. 标注员管理：支持将任务分配给标注员
 * 4. 统计展示：显示任务统计数据和完成情况
 * 5. 进度跟踪：实时展示任务进度和完成率
 * 
 * 使用场景：
 * - 管理员创建标注任务
 * - 分配任务给标注员
 * - 监控任务执行进度
 * - 管理对话审核工作流
 */
export default TaskManagement;