"""
对话标题生成服务
根据用户输入内容，使用LLM生成简洁有意义的对话标题
"""
from typing import Optional

from app.services.openai_client import OpenAIClient
from app.core.config import settings

class TitleGenerationService:
    """对话标题生成服务"""
    
    def __init__(self):
        self.openai_client = OpenAIClient()
    
    async def generate_title(self, user_query: str) -> str:
        """
        根据用户输入生成对话标题
        
        Args:
            user_query: 用户的输入内容
            
        Returns:
            生成的对话标题，如果生成失败则返回默认标题
        """
        if not self.openai_client.is_available():
            return self._get_default_title(user_query)
        
        try:
            # 构建提示词
            system_prompt = (
                "你是一个对话标题生成助手。请根据用户的输入内容，生成一个简洁、准确、有意义的对话标题。"
                "要求：\n"
                "1. 标题长度不超过10个字符\n"
                "2. 准确概括用户的核心问题或需求\n"
                "3. 使用简洁明了的语言\n"
                "4. 不要包含标点符号（除非必要）\n"
                "5. 直接返回标题内容，不要加任何前缀或解释"
            )
            
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"用户输入：{user_query}"}
            ]
            
            # 调用LLM生成标题
            title = await self.openai_client.generate_response(
                messages=messages,
                model=settings.OPENAI_MODEL,
                max_tokens=50,  # 标题不需要太多token
                temperature=0.3  # 较低的温度保证结果稳定
            )
            
            # 清理和验证标题
            title = title.strip()
            if len(title) > 20:
                title = title[:20]
            
            # 如果标题为空或过短，使用默认标题
            if not title or len(title) < 2:
                title = self._get_default_title(user_query)
            
            return title
            
        except Exception as e:
            return self._get_default_title(user_query)
    
    def _get_default_title(self, user_query: str) -> str:
        """
        生成默认标题
        
        Args:
            user_query: 用户输入
            
        Returns:
            基于用户输入的简单标题
        """
        # 取用户输入的前15个字符作为标题
        if len(user_query) <= 15:
            return user_query
        else:
            return user_query[:15] + "..."

# 全局实例
title_generation_service = TitleGenerationService()

async def generate_conversation_title(user_query: str) -> str:
    """
    生成对话标题的便捷函数
    
    Args:
        user_query: 用户输入
        
    Returns:
        生成的标题
    """
    return await title_generation_service.generate_title(user_query) 