import { get, post, patch, del } from "../utils/http/request";

// 任务状态枚举
export enum TaskStatus {
    CREATED = "created",
    ASSIGNED = "assigned",
    IN_PROGRESS = "in_progress", 
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}

// 任务优先级枚举
export enum TaskPriority {
    LOW = "low",
    NORMAL = "normal",
    HIGH = "high",
    URGENT = "urgent"
}

// 标注结果枚举
export enum AnnotationResult {
    APPROVED = "approved",
    REJECTED = "rejected", 
    FLAGGED = "flagged"
}

// 基础用户信息（从 auth 模块导入）
import type { UserBasic } from './auth';

// 任务创建参数
export interface TaskCreate {
    title: string;
    description?: string;
    priority?: TaskPriority;
    deadline?: string;
    assigned_to_id?: string;
    chat_ids: string[];
    auto_assign?: boolean;
    max_annotations_per_chat?: number;
    task_metadata?: Record<string, any>;
}

// 任务更新参数
export interface TaskUpdate {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    deadline?: string;
    assigned_to_id?: string;
    task_metadata?: Record<string, any>;
}

// 任务分配参数
export interface TaskAssign {
    assigned_to_id: string;
}

// 任务对话标注参数
export interface TaskChatAnnotate {
    annotation_result: AnnotationResult;
    annotation_comment?: string;
}

// 任务查询参数
export interface TaskQueryParams {
    status?: TaskStatus;
    priority?: TaskPriority;
    assigned_to_id?: string;
    created_by_id?: string;
    overdue_only?: boolean;
    skip?: number;
    limit?: number;
}

// 任务响应接口
export interface TaskResponse {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    total_chats: number;
    completed_chats: number;
    completion_rate: number;
    deadline?: string;
    created_by_id: string;
    assigned_to_id?: string;
    auto_assign: boolean;
    max_annotations_per_chat: number;
    task_metadata?: Record<string, any>;
    created_at: string;
    updated_at: string;
    is_overdue: boolean;
    created_by?: UserBasic;
    assigned_to?: UserBasic;
}

// 任务对话响应接口
export interface TaskChatResponse {
    id: string;
    task_id: string;
    chat_id: string;
    annotation_status: string;
    annotation_result?: string;
    annotation_comment?: string;
    annotated_by_id?: string;
    annotated_at?: string;
    created_at: string;
    chat_title?: string;
    chat_message_count?: number;
}

// 任务详情响应接口
export interface TaskDetailResponse extends TaskResponse {
    task_chats: TaskChatResponse[];
}

// 任务统计接口
export interface TaskStats {
    total_tasks: number;
    pending_tasks: number;
    in_progress_tasks: number;
    completed_tasks: number;
    overdue_tasks: number;
    total_chats: number;
    completed_chats: number;
    overall_completion_rate: number;
}

// 任务日志接口
export interface TaskLogResponse {
    id: string;
    task_id: string;
    user_id: string;
    action: string;
    description?: string;
    old_value?: Record<string, any>;
    new_value?: Record<string, any>;
    created_at: string;
    user?: UserBasic;
}

// 待审核对话接口
export interface PendingChat {
    id: string;
    title: string;
    pending_message_count: number;
    last_message_at: string;
    created_at: string;
    user_id: string;
}

// API 函数

// 创建任务
export function createTask(data: TaskCreate): Promise<TaskResponse> {
    return post("/api/v1/tasks/", data) as unknown as Promise<TaskResponse>;
}

// 获取任务列表
export function getTasks(params?: TaskQueryParams): Promise<TaskResponse[]> {
    const queryParams = new URLSearchParams();
    
    if (params?.status) queryParams.append('status', params.status);
    if (params?.priority) queryParams.append('priority', params.priority);
    if (params?.assigned_to_id) queryParams.append('assigned_to_id', params.assigned_to_id);
    if (params?.created_by_id) queryParams.append('created_by_id', params.created_by_id);
    if (params?.overdue_only) queryParams.append('overdue_only', params.overdue_only.toString());
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    const url = queryString ? `/api/v1/tasks/?${queryString}` : '/api/v1/tasks/';
    
    return get(url) as unknown as Promise<TaskResponse[]>;
}

// 获取任务详情
export function getTaskDetail(taskId: string): Promise<TaskDetailResponse> {
    return get(`/api/v1/tasks/${taskId}`) as unknown as Promise<TaskDetailResponse>;
}

// 更新任务
export function updateTask(taskId: string, data: TaskUpdate): Promise<TaskResponse> {
    return patch(`/api/v1/tasks/${taskId}`, data) as unknown as Promise<TaskResponse>;
}

// 分配任务
export function assignTask(taskId: string, data: TaskAssign): Promise<TaskResponse> {
    return post(`/api/v1/tasks/${taskId}/assign`, data) as unknown as Promise<TaskResponse>;
}

// 获取任务对话列表
export function getTaskChats(taskId: string, annotationStatus?: string): Promise<TaskChatResponse[]> {
    const url = annotationStatus 
        ? `/api/v1/tasks/${taskId}/chats?annotation_status=${annotationStatus}`
        : `/api/v1/tasks/${taskId}/chats`;
    return get(url) as unknown as Promise<TaskChatResponse[]>;
}

// 标注任务对话
export function annotateTaskChat(
    taskId: string, 
    taskChatId: string, 
    data: TaskChatAnnotate
): Promise<TaskChatResponse> {
    return post(`/api/v1/tasks/${taskId}/chats/${taskChatId}/annotate`, data) as unknown as Promise<TaskChatResponse>;
}

// 获取任务统计
export function getTaskStats(): Promise<TaskStats> {
    return get("/api/v1/tasks/stats/overview") as unknown as Promise<TaskStats>;
}

// 获取任务日志
export function getTaskLogs(taskId: string): Promise<TaskLogResponse[]> {
    return get(`/api/v1/tasks/${taskId}/logs`) as unknown as Promise<TaskLogResponse[]>;
}

// 删除任务
export function deleteTask(taskId: string): Promise<{message: string}> {
    return del(`/api/v1/tasks/${taskId}`) as unknown as Promise<{message: string}>;
}

// 获取待审核对话
export function getPendingChats(params?: {limit?: number, skip?: number}): Promise<PendingChat[]> {
    const queryParams = new URLSearchParams();
    
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    
    const queryString = queryParams.toString();
    const url = queryString ? `/api/v1/tasks/chats/pending?${queryString}` : '/api/v1/tasks/chats/pending';
    
    return get(url) as unknown as Promise<PendingChat[]>;
} 