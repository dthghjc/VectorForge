"""
OpenAI API 客户端，用于调用 GPT 模型和 Embedding 模型
"""
import logging
from typing import List, Dict, Any, Optional
import openai
from openai import OpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)

class OpenAIClient:
    """OpenAI API 客户端"""
    
    def __init__(self):
        """初始化 OpenAI 客户端"""
        if not settings.OPENAI_API_KEY:
            logger.warning("OPENAI_API_KEY not configured")
            self.client = None
            return
        
        # 配置 OpenAI 客户端
        self.client = OpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=str(settings.OPENAI_BASE_URL) if settings.OPENAI_BASE_URL else None
        )
        
        logger.info("OpenAI client initialized successfully")
    
    async def generate_response(
        self, 
        messages: List[Dict[str, str]], 
        model: str = None,
        max_tokens: int = None,
        temperature: float = None
    ) -> str:
        """
        生成聊天回复
        
        Args:
            messages: 消息列表，格式为 [{"role": "user", "content": "..."}]
            model: 使用的模型，默认使用配置中的模型
            max_tokens: 最大 token 数
            temperature: 温度参数
        
        Returns:
            生成的回复文本
        """
        if not self.client:
            raise ValueError("OpenAI client not initialized")
        
        try:
            # 使用默认配置
            if model is None:
                model = settings.OPENAI_MODEL
            if max_tokens is None:
                max_tokens = settings.OPENAI_MAX_TOKENS
            if temperature is None:
                temperature = settings.OPENAI_TEMPERATURE
            
            response = self.client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature
            )
            
            content = response.choices[0].message.content
            logger.info(f"Generated response: model={model}, tokens={response.usage.total_tokens}")
            return content
            
        except Exception as e:
            logger.error(f"Failed to generate response: {e}")
            raise
    
    async def get_embedding(self, text: str, model: str = None) -> List[float]:
        """
        获取文本的向量嵌入
        
        Args:
            text: 输入文本
            model: 嵌入模型，默认使用配置中的模型
        
        Returns:
            向量嵌入列表
        """
        if not self.client:
            raise ValueError("OpenAI client not initialized")
        
        try:
            if model is None:
                model = settings.OPENAI_EMBEDDING_MODEL
            
            response = self.client.embeddings.create(
                model=model,
                input=text
            )
            
            embedding = response.data[0].embedding
            logger.debug(f"Generated embedding: model={model}, dimension={len(embedding)}")
            return embedding
            
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            raise
    
    async def batch_get_embeddings(
        self, 
        texts: List[str], 
        model: str = None
    ) -> List[List[float]]:
        """
        批量获取文本的向量嵌入
        
        Args:
            texts: 输入文本列表
            model: 嵌入模型
        
        Returns:
            向量嵌入列表的列表
        """
        if not self.client:
            raise ValueError("OpenAI client not initialized")
        
        try:
            if model is None:
                model = settings.OPENAI_EMBEDDING_MODEL
            
            response = self.client.embeddings.create(
                model=model,
                input=texts
            )
            
            embeddings = [data.embedding for data in response.data]
            logger.info(f"Generated {len(embeddings)} embeddings: model={model}")
            return embeddings
            
        except Exception as e:
            logger.error(f"Failed to generate batch embeddings: {e}")
            raise
    
    def is_available(self) -> bool:
        """检查 OpenAI 客户端是否可用"""
        return self.client is not None

# 向后兼容的函数
def generate_embedding(text: str) -> List[float]:
    """
    向后兼容的嵌入生成函数
    
    Args:
        text: 输入文本
    
    Returns:
        向量嵌入列表
    """
    try:
        client = OpenAIClient()
        import asyncio
        return asyncio.run(client.get_embedding(text))
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        raise

if __name__ == "__main__":
    
    OpenAIClient = OpenAIClient()

    # 获取文本的嵌入向量
    text = "This is a sample text for embedding."
    embedding = OpenAIClient.generate_embedding(text)
    print("向量:")
    print(embedding)
    # 获取大模型回复
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {
            "role": "user",
            "content": "Write a haiku about recursion in programming."
        }
    ]
    response = OpenAIClient.generate_response(messages)
    print("模型回复：")
    print(response)
    print("流式模型回复：")
    OpenAIClient.generate_response_stream(messages)