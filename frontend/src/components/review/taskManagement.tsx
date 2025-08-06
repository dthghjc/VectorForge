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
        fetchPendingChats,
        fetchAllChats,
        fetchInitialData, // 统一初始化函数，替代原来的单独调用
        handlePageChange,
        addTaskOptimistically,
        removeTaskOptimistically,
        updateTaskOptimistically,
        rollbackTaskCreation,
        rollbackTaskDeletion,
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

    // 任务操作Hook（传入乐观更新函数）
    const {
        handleCreateTask,
        handleAssignTask,
        handleDeleteTask,
    } = useTaskOperations({
        addTaskOptimistically,
        removeTaskOptimistically,
        updateTaskOptimistically,
        rollbackTaskCreation,
        rollbackTaskDeletion,
    });

    // ==================== 表单实例 ====================
    const [form] = Form.useForm();         // 创建任务表单实例
    const [assignForm] = Form.useForm();   // 分配任务表单实例

    // ==================== 状态解构 ====================
    const { users, tasks, stats, pendingChats, allChats, pagination } = dataState;
    const { 
        loading, 
        modals: { create: createModalVisible, chat: chatModalVisible, assign: assignModalVisible },
        selection: { chatIds: selectedChats, chatSourceType, task: selectedTask }
    } = uiState;

    // ==================== 组件初始化 ====================

    /**
     * 组件初始化时获取必要数据
     * 使用统一的初始化函数，通过Promise.all确保所有数据同时完成
     * 避免竞态条件导致的显示问题
     */
    useEffect(() => {
        const loadData = async () => {
            setLoading(true); // 开始加载，显示全局loading
            try {
                await fetchInitialData(); // 使用统一的初始化函数
            } finally {
                setLoading(false); // 完成加载，关闭loading
            }
        };

        loadData();
    }, [fetchInitialData, setLoading]); // 依赖统一初始化函数和loading设置函数

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
                // 成功回调：重置UI状态，乐观更新已处理数据刷新
                toggleModal('create', false);
                resetSelection();
                form.resetFields();
                // fetchTasks(); // 注释掉，因为乐观更新已处理
                // fetchStats(); // 注释掉，因为乐观更新已处理
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
                // 成功回调：重置UI状态，乐观更新已处理数据刷新
                toggleModal('assign', false);
                setSelectedTask(null);
                assignForm.resetFields();
                // fetchTasks(); // 注释掉，因为乐观更新已处理
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
        // 找到要删除的任务数据，用于乐观更新回滚
        const taskToDelete = tasks.find(task => task.id === taskId);
        
        setLoading(true);
        try {
            await handleDeleteTask(taskId, taskToDelete, () => {
                // 成功回调：由于已经进行乐观更新，不需要手动刷新
                // fetchTasks(); // 注释掉，因为乐观更新已处理
                // fetchStats(); // 注释掉，因为乐观更新已处理
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
                pagination={pagination}
                onCreate={handleCreateClick}
                onAssign={handleTaskAssign}
                onDelete={onDeleteTask}
                onPageChange={handlePageChange}
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