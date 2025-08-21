/**
 * 标注系统类型定义
 * 定义了标注任务相关的所有数据结构
 */

/**
 * RAG召回知识片段标注数据
 * 用于评估检索增强生成(RAG)中召回的知识片段质量
 */
export interface RAGRecall {
    /** 知识片段唯一标识符 */
    id: string;

    /** 知识片段内容文本 */
    snippet: string;

    /** 知识来源(如文档名、URL等) */
    source: string;

    /** 与用户问题的相关性评级
     * strong: 强相关
     * relevant: 相关
     * weak: 弱相关
     * irrelevant: 不相关
     */
    relevanceToQuestion: 'strong' | 'relevant' | 'weak' | 'irrelevant' | '';

    /** 对LLM回复的支持程度
     * full: 完全支持
     * partial: 部分支持
     * none: 不支持
     */
    supportToResponse: 'full' | 'partial' | 'none' | '';

    /** 是否包含错误或过时信息 */
    hasError: boolean;

    /** 错误信息详细描述 */
    errorDetails: string;

    /** 是否为冗余信息 */
    isRedundant: boolean;

    /** RAG改进建议 */
    improvementSuggestion: string;
}

/**
 * LLM回复标注数据
 * 用于评估大语言模型生成回复的各项指标
 */
export interface LLMResponse {
    /** LLM回复唯一标识符 */
    id: string;

    /** LLM回复内容文本 */
    content: string;

    /** 回复与用户问题的相关性
     * strong: 强相关
     * relevant: 相关
     * weak: 弱相关
     * irrelevant: 不相关
     */
    relevance: 'strong' | 'relevant' | 'weak' | 'irrelevant' | '';

    /** 回复的流畅性评级
     * very_fluent: 非常流畅
     * fluent: 流畅
     * not_fluent: 不流畅
     */
    fluency: 'very_fluent' | 'fluent' | 'not_fluent' | '';

    /** 语气与风格
     * professional_and_Rigorous: 专业严谨
     * Friendly_and_Enthusiastic: 友好热情
     * Efficient_and_Practical: 清晰易懂
     * Clear_and_Understandable: 高效实用
     */
    toneAndStyle: string[];

    /** 信息准确性
     * accurate: 准确
     * partially_accurate: 部分准确
     * inaccurate: 不准确
     * unknown: 无法判断
     */
    accuracy: 'accurate' | 'partially_accurate' | 'inaccurate' | 'unknown' | '';

    /** 内容合规性评估
     * compliant: 合规
     * risky: 风险
     * violation: 违规
     * unknown: 无法判断
     */
    compliance: 'compliant' | 'risky' | 'violation' | 'unknown' | '';

    /** 违规类型列表
     * political：政治敏感
     * illegal：非法信息
     * pornographic：色情/低俗
     * violence：暴力
     * discrimination：歧视/仇恨
     * rumor：谣言/虚假信息
     * privacy：侵犯隐私
     * other：其他
     */
    violationTypes: string[];

    /** 违规情况详细描述 */
    violationDetails: string;

    /** 是否进行指令遵循评估 */
    isInstructionFollowing: boolean;

    /** 指令遵循总体遵循度
     * PERFECT_COMPLIANCE: 完美遵循
     * NEAR_PERFECT: 高度遵循，仅有细微瑕疵
     * PARTIAL_COMPLIANCE: 部分遵循，有明显遗漏或偏差
     * MINIMAL_COMPLIANCE: 最小遵循，仅遵循部分关键指令
     * NO_COMPLIANCE: 基本未遵循指令
     */
    instructionFollowingRating: 'PERFECT_COMPLIANCE' | 'NEAR_PERFECT' | 'PARTIAL_COMPLIANCE' | 'MINIMAL_COMPLIANCE' | 'NO_COMPLIANCE' | '';

    /** 指令遵循评估详细描述 */
    instructionFollowingDetails: string;

    /** 是否存在幻觉或事实错误 */
    hasHallucination: boolean;

    /** 幻觉或事实错误的详细描述 */
    hallucinationDetails: string;

    /** 改进建议 */
    improvementSuggestion: string;

    /** 优化重写 */
    rewrite: string;

    /** 关联的RAG召回知识片段(可选) */
    ragRecalls?: RAGRecall[];
}

/**
 * 对话轮次数据
 * 表示对话中的一个回合(用户输入或LLM回复)
 */
export interface DialogueTurn {
    /** 对话轮次唯一标识符 */
    id: string;

    /** 角色类型 - 用户或LLM */
    role: 'user' | 'llm';

    /** 对话内容文本 */
    content: string;

    /** LLM回复的标注数据(仅当role为'llm'时存在) */
    llmResponse?: LLMResponse;
}

/**
 * 任务优先级枚举
 */
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * 管理员分配的标注任务
 * 一个任务可以包含多个对话(Chat)
 */
export interface Task {
    /** 任务唯一标识符 */
    id: string;

    /** 任务标题 */
    title: string;

    /** 任务描述 */
    description: string;

    /** 任务优先级 */
    priority: TaskPriority;

    /** 任务截止时间 */
    deadline: string;

    /** 任务创建时间 */
    createdAt: string;

    /** 任务创建者 */
    createdBy: string;

    /** 任务状态
     * active: 活跃
     * completed: 已完成
     * paused: 已暂停
     */
    status: 'active' | 'completed' | 'paused';
}

/**
 * Chat对话数据结构
 * 每个Chat属于一个Task，是实际的标注对象
 */
export interface Chat {
    /** Chat唯一标识符 */
    id: string;

    /** Chat标题 */
    title: string;

    /** 所属任务ID */
    taskId: string;

    /** 消息数量 */
    messageCount: number;

    /** 创建时间 */
    createdAt: string;

    /** 标注状态
     * pending: 待标注
     * completed: 已完成
     */
    annotationStatus: 'pending' | 'completed';

    /** 使用的LLM模型名称 */
    llmModel: string;

    /** 是否启用RAG功能 */
    ragEnabled: boolean;

    /** 分配的标注员姓名 */
    annotator: string;

    /** 完整对话内容 */
    dialogue: DialogueTurn[];

    /** 对话意图分类
     * information_query：信息查询
     * instruction_following：指令遵循
     * content_creation：内容创作
     * chat：闲聊
     */
    intentCategory: 'information_query' | 'instruction_following' | 'content_creation' | 'chat' | '';

    /** 对话完整性评估
     * complete: 完整
     * incomplete: 不完整
     */
    completeness: 'complete' | 'incomplete' | '';

    /** 整体满意度评分(1-5星) */
    overallSatisfaction: number;
    
    /** 一般备注 */
    generalNotes: string;
}

/**
 * Chat列表显示项
 * 包含Task信息和Chat信息的组合数据
 */
export interface ChatListItem {
    /** Chat信息 */
    chat: Chat;
    
    /** 关联的Task信息 */
    task: Task;
}

/**
 * 向后兼容：保持原有的AnnotationTask接口
 * @deprecated 请使用 Chat 和 Task 接口
 */
export interface AnnotationTask {
    /** 任务唯一标识符 */
    id: string;

    /** 对话内容预览文本(用于列表显示) */
    dialoguePreview: string;

    /** 任务状态
     * pending: 待标注
     * annotated: 已标注
     * reviewing: 审核中
     * approved: 已批准
     * rejected: 已拒绝
     */
    status: 'pending' | 'annotated' | 'reviewing' | 'approved' | 'rejected';

    /** 使用的LLM模型名称 */
    llmModel: string;

    /** 是否启用RAG功能 */
    ragEnabled: boolean;

    /** 分配的标注员姓名 */
    annotator: string;

    /** 最后更新时间 */
    lastUpdate: string;

    /** 完整对话内容 */
    dialogue: DialogueTurn[];

    /** 对话意图分类
     * information_query：信息查询
     * instruction_following：指令遵循
     * content_creation：内容创作
     * chat：闲聊
     */
    intentCategory: 'information_query' | 'instruction_following' | 'content_creation' | 'chat' | '';

    /** 对话完整性评估
     * complete: 完整
     * incomplete: 不完整
     */
    completeness: 'complete' | 'incomplete' | '';

    /** 整体满意度评分(1-5星) */
    overallSatisfaction: number;
    
    /** 一般备注 */
    generalNotes: string;
}