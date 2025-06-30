from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List, Union, Literal
from datetime import datetime

class DifyMessageCreate(BaseModel):
    """Dify 单条消息创建"""
    user_id: Optional[str] = Field(None, description="用户ID，由Dify传入")
    role: str = Field(..., description="消息角色")
    content: str = Field(..., description="消息内容")
    metadata: Optional[Dict[str, Any]] = Field(None, description="消息元数据")

class DifyMessageResponse(BaseModel):
    """Dify 消息响应"""
    message_id: str
    conversation_id: str
    role: str
    content: str
    created_at: datetime

# ========== Dify 对话消息 API Schema ==========

# 向 Dify 发送请求的请求体中的文件对象
class InputFile(BaseModel):
    """输入文件对象"""
    type: Literal["image", "document"] = Field(..., description="文件类型")
    transfer_method: Literal["remote_url", "local_file"] = Field(..., description="传输方式")
    url: Optional[str] = Field(None, description="文件URL（远程文件）")
    upload_file_id: Optional[str] = Field(None, description="上传文件ID（本地文件）")

# 向 Dify 发送请求的请求体
class ChatMessageRequest(BaseModel):
    """发送对话消息请求"""
    query: str = Field(..., description="用户输入/提问内容")
    # user: str = Field(..., description="用户标识，应用内唯一")
    inputs: Dict[str, Any] = Field(default_factory=dict, description="App定义的各变量值")
    response_mode: Literal["streaming", "blocking"] = Field(default="streaming", description="响应模式")
    conversation_id: Optional[str] = Field(None, description="会话ID，用于继续之前的对话")
    files: Optional[List[InputFile]] = Field(None, description="文件列表，仅当模型支持Vision能力时可用")
    # auto_generate_name: bool = Field(default=True, description="自动生成会话标题")

# ========== 阻塞模式响应 ==========

# 阻塞模式的 DIFY 完整响应中的使用情况统计 metadata.usage
class Usage(BaseModel):
    """使用情况统计"""
    prompt_tokens: int = Field(..., description="提示词token数")
    prompt_unit_price: str = Field(..., description="提示词单价")
    prompt_price_unit: str = Field(..., description="提示词价格单位")
    prompt_price: str = Field(..., description="提示词价格")
    completion_tokens: int = Field(..., description="完成token数")
    completion_unit_price: str = Field(..., description="完成单价")
    completion_price_unit: str = Field(..., description="完成价格单位")
    completion_price: str = Field(..., description="完成价格")
    total_tokens: int = Field(..., description="总token数")
    total_price: str = Field(..., description="总价格")
    currency: str = Field(..., description="货币")
    latency: float = Field(..., description="延迟（毫秒）")

# 阻塞模式的 DIFY 完整响应中的检索资源 metadata.retriever_resources
class RetrieverResource(BaseModel):
    """检索资源"""
    position: int = Field(..., description="位置")
    dataset_id: str = Field(..., description="数据集ID")
    dataset_name: str = Field(..., description="数据集名称")
    document_id: str = Field(..., description="文档ID")
    document_name: str = Field(..., description="文档名称")
    segment_id: str = Field(..., description="片段ID")
    score: float = Field(..., description="相关性分数")
    content: str = Field(..., description="内容")

# 阻塞模式的 DIFY 完整响应中的元数据 metadata
class ChatMetadata(BaseModel):
    """对话元数据"""
    usage: Usage = Field(..., description="使用情况统计")
    retriever_resources: List[RetrieverResource] = Field(default_factory=list, description="检索资源列表")

# 阻塞模式的 DIFY 完整响应
class ChatCompletionResponse(BaseModel):
    """阻塞模式完整响应"""
    event: Literal["message"] = Field(default="message", description="事件类型")
    task_id: str = Field(..., description="任务ID")
    id: str = Field(..., description="唯一ID")
    message_id: str = Field(..., description="消息唯一ID")
    conversation_id: str = Field(..., description="会话ID")
    mode: Literal["chat"] = Field(default="chat", description="App模式")
    answer: str = Field(..., description="完整回复内容")
    metadata: ChatMetadata = Field(..., description="元数据")
    created_at: int = Field(..., description="消息创建时间戳")

# ========== 流式响应事件 ==========

class ChunkChatEvent(BaseModel):
    """流式对话事件基类"""
    event: str = Field(..., description="事件类型")
    conversation_id: str = Field(..., description="会话ID")
    message_id: str = Field(..., description="消息ID")
    created_at: int = Field(..., description="创建时间戳")

class MessageEvent(ChunkChatEvent):
    """消息事件"""
    event: Literal["message"] = "message"
    answer: str = Field(..., description="消息内容")

class MessageDeltaEvent(ChunkChatEvent):
    """消息增量事件"""
    event: Literal["message_delta"] = "message_delta"
    delta: str = Field(..., description="增量内容")

class MessageEndEvent(ChunkChatEvent):
    """消息结束事件"""
    event: Literal["message_end"] = "message_end"
    metadata: ChatMetadata = Field(..., description="元数据")

class MessageReplaceEvent(ChunkChatEvent):
    """消息替换事件"""
    event: Literal["message_replace"] = "message_replace"
    answer: str = Field(..., description="替换后的完整内容")

class ErrorEvent(BaseModel):
    """错误事件"""
    event: Literal["error"] = "error"
    error: str = Field(..., description="错误信息")

# Union type for all possible streaming events
StreamingEvent = Union[
    MessageEvent,
    MessageDeltaEvent, 
    MessageEndEvent,
    MessageReplaceEvent,
    ErrorEvent
]