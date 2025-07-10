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
    /** 与用户问题的相关性评级 */
    relevanceToQuestion: 'strong' | 'relevant' | 'weak' | 'irrelevant' | '';
    /** 对LLM回复的支持程度 */
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
    /** 回复与用户问题的相关性 */
    relevance: 'strong' | 'relevant' | 'weak' | 'irrelevant' | '';
    /** 回复的流畅性评级 */
    fluency: 'very_fluent' | 'fluent' | 'not_fluent' | '';
    /** 语气与风格 */
    toneAndStyle: string[];
    /** 信息准确性 */
    accuracy: 'accurate' | 'partially_accurate' | 'inaccurate' | 'unknown' | '';
    /** 内容合规性评估 */
    compliance: 'compliant' | 'risky' | 'violation' | 'unknown' | '';
    /** 违规类型列表 */
    violationTypes: string[];
    /** 违规情况详细描述 */
    violationDetails: string;
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
 * 标注任务完整数据结构
 * 包含整个对话的标注信息和元数据
 */
export interface AnnotationTask {
    /** 任务唯一标识符 */
    id: string;
    /** 对话内容预览文本(用于列表显示) */
    dialoguePreview: string;
    /** 任务状态 */
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
    /** 对话意图分类 */
    intentCategory: 'information_query' | 'instruction_following' | 'content_creation' | 'chat' | '';
    /** 对话完整性评估 */
    completeness: 'complete' | 'incomplete' | '';
    /** 整体满意度评分(1-5星) */
    overallSatisfaction: number;
    /** 一般备注 */
    generalNotes: string;
}