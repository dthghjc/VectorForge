/**
 * 重构后的标注系统类型定义
 * 严格遵循后端数据库模型：Task → TaskChat → Chat + Messages
 */

// ============= 核心数据模型 =============

/**
 * 任务（对应后端 AnnotationTask 模型）
 */
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'created' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  total_chats: number;
  completed_chats: number;
  deadline?: string;
  created_by_id: string;
  assigned_to_id?: string;
  auto_assign: boolean;
  max_annotations_per_chat: number;
  task_metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  
  // 计算属性
  completion_rate?: number;
  is_overdue?: boolean;
}

/**
 * 对话（对应后端 Chat 模型）
 */
export interface Chat {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * 消息（对应后端 Message 模型）
 */
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  chat_id: string;
  meta_data?: Record<string, any>;
  audit_status: 'pending' | 'approved' | 'rejected';
  is_flagged: '0' | '1';
  created_at: string;
  updated_at: string;
}

// ============= 标注数据结构 =============

/**
 * Chat 级别标注数据（存储在 TaskChat.annotation_data JSON 字段）
 */
export interface ChatAnnotationData {
  // 对话意图分类
  intent_category: 'information_query' | 'instruction_following' | 'content_creation' | 'chat' | '';
  
  // 对话完整性评估
  completeness: 'complete' | 'incomplete' | '';
  
  // 整体满意度评分(1-5)
  overall_satisfaction: number;
  
  // 一般备注
  general_notes: string;
}

/**
 * Message 级别标注数据（存储在 MessageAudit.annotation_data JSON 字段）
 */
export interface MessageAnnotationData {
  // LLM回复质量评估
  relevance: 'strong' | 'relevant' | 'weak' | 'irrelevant' | '';
  fluency: 'very_fluent' | 'fluent' | 'not_fluent' | '';
  accuracy: 'accurate' | 'partially_accurate' | 'inaccurate' | 'unknown' | '';
  compliance: 'compliant' | 'risky' | 'violation' | 'unknown' | '';
  
  // 语气与风格（多选）
  tone_and_style: string[];
  
  // 违规相关
  violation_types: string[];
  violation_details: string;
  
  // 幻觉检测
  has_hallucination: boolean;
  hallucination_details: string;
  
  // 指令遵循（可选）
  is_instruction_following?: boolean;
  instruction_following_rating?: 'PERFECT_COMPLIANCE' | 'NEAR_PERFECT' | 'PARTIAL_COMPLIANCE' | 'MINIMAL_COMPLIANCE' | 'NO_COMPLIANCE' | '';
  instruction_following_details?: string;
  
  // 改进建议
  improvement_suggestion: string;
  rewrite: string;
  
  // RAG 相关（可选）
  rag_recalls?: RAGRecallData[];
}

/**
 * RAG 召回知识片段标注数据
 */
export interface RAGRecallData {
  id: string;
  snippet: string;
  source: string;
  relevance_to_question: 'strong' | 'relevant' | 'weak' | 'irrelevant' | '';
  support_to_response: 'full' | 'partial' | 'none' | '';
  has_error: boolean;
  error_details: string;
  is_redundant: boolean;
  improvement_suggestion: string;
}

// ============= 关联模型 =============

/**
 * 任务对话关联（对应后端 TaskChat 模型）
 */
export interface TaskChat {
  id: string;
  task_id: string;
  chat_id: string;
  annotation_status: 'pending' | 'completed' | 'skipped';
  annotation_result?: 'approved' | 'rejected' | 'flagged';
  annotation_comment?: string;
  annotated_by_id?: string;
  annotated_at?: string;
  created_at: string;
  updated_at: string;
  
  // Chat 级别标注数据 JSON
  annotation_data?: ChatAnnotationData;
}

/**
 * 消息审核记录（对应后端 MessageAudit 模型）
 */
export interface MessageAudit {
  id: string;
  message_id: string;
  annotator_id: string;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  created_at: string;
  updated_at: string;
  
  // Message 级别标注数据 JSON
  annotation_data?: MessageAnnotationData;
}

// ============= 组合视图模型 =============

/**
 * 带消息审核的消息
 */
export interface MessageWithAudits extends Message {
  audits: MessageAudit[];
}

/**
 * 带消息的对话
 */
export interface ChatWithMessages extends Chat {
  messages: MessageWithAudits[];
  message_count?: number;
}

/**
 * TaskChat 详情（用于标注工作区）
 */
export interface TaskChatDetail extends TaskChat {
  // 关联的任务信息
  task: Task;
  
  // 关联的对话及其消息
  chat: ChatWithMessages;
  
  // 方便访问的字段
  chat_title?: string;
  chat_message_count?: number;
}

/**
 * 任务对话列表项（对应后端 TaskChatResponse）
 */
export interface TaskChatListItem {
  id: string;
  task_id: string;
  chat_id: string;
  annotation_status: 'pending' | 'completed' | 'skipped';
  annotation_result?: 'approved' | 'rejected' | 'flagged';
  annotation_comment?: string;
  annotated_by_id?: string;
  annotated_at?: string;
  
  // 冗余字段，用于列表显示
  chat_title: string;
  chat_message_count: number;
  
  // Chat 级别标注数据
  annotation_data?: ChatAnnotationData;
}

// ============= 表单模型 =============

/**
 * Chat 标注表单数据
 */
export interface ChatAnnotationForm extends ChatAnnotationData {
  // 表单额外字段
  annotation_result: 'approved' | 'rejected' | 'flagged';
  annotation_comment: string;
}

/**
 * Message 标注表单数据
 */
export interface MessageAnnotationForm extends MessageAnnotationData {
  // 表单额外字段
  audit_status: 'approved' | 'rejected';
  audit_comment: string;
}

// ============= API 请求/响应模型 =============

/**
 * Chat 标注提交数据
 */
export interface ChatAnnotationSubmit {
  annotation_result: 'approved' | 'rejected' | 'flagged';
  annotation_comment?: string;
  annotation_data: ChatAnnotationData;
}

/**
 * Message 审核提交数据
 */
export interface MessageAuditSubmit {
  status: 'approved' | 'rejected';
  comment?: string;
  annotation_data: MessageAnnotationData;
}

// ============= 选项配置 =============

/**
 * 语气与风格选项
 */
export const TONE_AND_STYLE_OPTIONS = [
  { value: 'professional_and_rigorous', label: '专业严谨' },
  { value: 'friendly_and_enthusiastic', label: '友好热情' },
  { value: 'efficient_and_practical', label: '高效实用' },
  { value: 'clear_and_understandable', label: '清晰易懂' },
] as const;

/**
 * 违规类型选项
 */
export const VIOLATION_TYPE_OPTIONS = [
  { value: 'political', label: '政治敏感' },
  { value: 'illegal', label: '非法信息' },
  { value: 'pornographic', label: '色情/低俗' },
  { value: 'violence', label: '暴力' },
  { value: 'discrimination', label: '歧视/仇恨' },
  { value: 'rumor', label: '谣言/虚假信息' },
  { value: 'privacy', label: '侵犯隐私' },
  { value: 'other', label: '其他' },
] as const;
