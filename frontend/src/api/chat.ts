import { get, post, del, patch } from "../utils/http/request";

// ===== 消息相关类型 =====
export interface MessageResponse {
    id: string;
    chat_id: string;
    role: string;
    content: string;
    metadata?: Record<string, any> | null;

    is_flagged: string;
    created_at: string;
    updated_at: string;
}

interface MessageCreate {
    chat_id: string;
    role: string;
    content: string;
    meta_data?: Record<string, any> | null;
}

// ===== 对话相关类型 =====
export interface ChatBasicResponse {
    id: string;
    title?: string | null;
    user_id: string;
    created_at: string;
    updated_at: string;
    message_count: number;
}

export interface ChatWithMessagesResponse {
    id: string;
    title?: string | null;
    user_id: string;
    created_at: string;
    updated_at: string;
    messages: MessageResponse[];
}

interface ChatCreate {
    id?: string;
    title?: string | null;
}

interface ChatUpdate {
    title?: string | null;
}

// ===== 对话API =====

/**
 * 获取当前用户的所有对话（轻量版本）
 * 不包含消息内容，适用于对话列表展示
 */
export function getChats(params?: {
    skip?: number;
    limit?: number;
}): Promise<ChatBasicResponse[]> {
    const { skip = 0, limit = 100 } = params || {};
    return get("/api/v1/chats/", { skip, limit }) as unknown as Promise<ChatBasicResponse[]>;
}

/**
 * 获取指定对话详情
 * 包含该对话的所有消息
 */
export function getChat(chatId: string): Promise<ChatWithMessagesResponse> {
    return get(`/api/v1/chats/${chatId}`) as unknown as Promise<ChatWithMessagesResponse>;
}

/**
 * 更新指定对话标题
 */
export function updateChat(chatId: string, data: ChatUpdate): Promise<ChatBasicResponse> {
    return patch(`/api/v1/chats/${chatId}`, data) as unknown as Promise<ChatBasicResponse>;
}

/**
 * 删除指定对话
 */
export function deleteChat(chatId: string): Promise<{ status: string }> {
    return del(`/api/v1/chats/${chatId}`) as unknown as Promise<{ status: string }>;
}

/**
 * 检查对话是否存在
 */
export function checkChatExists(chatId: string): Promise<{ exists: boolean }> {
    return get(`/api/v1/chats/${chatId}/exists`) as unknown as Promise<{ exists: boolean }>;
}

/**
 * 获取所有对话（详细版本，包含消息）
 * 适用于需要查看对话详情的场景
 */
export function getChatsWithMessages(params?: {
    skip?: number;
    limit?: number;
}): Promise<ChatWithMessagesResponse[]> {
    const { skip = 0, limit = 100 } = params || {};
    return get("/api/v1/chats/with-messages", { skip, limit }) as unknown as Promise<ChatWithMessagesResponse[]>;
} 