"""
实现多种知识库检索逻辑，如向量检索（Milvus）、关键字检索、图数据库检索等。
"""
import logging
import json
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.core.config import settings
from app.db.milvus import MilvusClient
from app.services.openai_client import OpenAIClient

logger = logging.getLogger(__name__)

class KnowledgeRetrievalService:
    """知识检索服务"""
    
    def __init__(self):
        self.milvus_client = MilvusClient()
        self.openai_client = OpenAIClient()
    
    async def search_knowledge(
        self, 
        query: str, 
        collection_name: str = None,
        top_k: int = None,
        filters: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """
        搜索知识库
        
        Args:
            query: 查询文本
            collection_name: 集合名称，默认使用配置中的前缀
            top_k: 返回结果数量
            filters: 过滤条件
        
        Returns:
            搜索结果列表
        """
        try:
            # 使用默认值
            if top_k is None:
                top_k = settings.MILVUS_SEARCH_TOP_K
            
            if collection_name is None:
                collection_name = f"{settings.MILVUS_COLLECTION_PREFIX}default"
            
            # 生成查询向量
            query_vector = await self.openai_client.get_embedding(query)
            
            # 在 Milvus 中搜索
            results = await self.milvus_client.search(
                collection_name=collection_name,
                query_vector=query_vector,
                top_k=top_k,
                filters=filters
            )
            
            logger.info(f"Knowledge search completed: query='{query}', results={len(results)}")
            return results
            
        except Exception as e:
            logger.error(f"Knowledge search failed: {e}")
            raise
    
    async def add_knowledge(
        self,
        content: str,
        metadata: Dict[str, Any] = None,
        collection_name: str = None
    ) -> bool:
        """
        添加知识到向量数据库
        
        Args:
            content: 文本内容
            metadata: 元数据
            collection_name: 集合名称
        
        Returns:
            是否成功
        """
        try:
            if collection_name is None:
                collection_name = f"{settings.MILVUS_COLLECTION_PREFIX}default"
            
            # 生成向量
            vector = await self.openai_client.get_embedding(content)
            
            # 准备数据
            data = {
                "content": content,
                "vector": vector,
                "metadata": json.dumps(metadata or {}),
                "created_at": datetime.now().isoformat()
            }
            
            # 插入到 Milvus
            success = await self.milvus_client.insert(
                collection_name=collection_name,
                data=[data]
            )
            
            logger.info(f"Knowledge added: collection='{collection_name}', success={success}")
            return success
            
        except Exception as e:
            logger.error(f"Failed to add knowledge: {e}")
            raise
    
    async def batch_add_knowledge(
        self,
        contents: List[str],
        metadatas: List[Dict[str, Any]] = None,
        collection_name: str = None
    ) -> bool:
        """
        批量添加知识到向量数据库
        
        Args:
            contents: 文本内容列表
            metadatas: 元数据列表
            collection_name: 集合名称
        
        Returns:
            是否成功
        """
        try:
            if collection_name is None:
                collection_name = f"{settings.MILVUS_COLLECTION_PREFIX}default"
            
            if metadatas is None:
                metadatas = [{}] * len(contents)
            
            # 批量生成向量
            vectors = []
            for content in contents:
                vector = await self.openai_client.get_embedding(content)
                vectors.append(vector)
            
            # 准备批量数据
            data_list = []
            for i, (content, vector, metadata) in enumerate(zip(contents, vectors, metadatas)):
                data = {
                    "content": content,
                    "vector": vector,
                    "metadata": json.dumps(metadata),
                    "created_at": datetime.now().isoformat()
                }
                data_list.append(data)
            
            # 批量插入到 Milvus
            success = await self.milvus_client.insert(
                collection_name=collection_name,
                data=data_list
            )
            
            logger.info(f"Batch knowledge added: collection='{collection_name}', count={len(contents)}, success={success}")
            return success
            
        except Exception as e:
            logger.error(f"Failed to batch add knowledge: {e}")
            raise

# 向后兼容的函数（简化版本）
def retrieve_knowledge(user_query: str) -> Optional[List[Dict[str, Any]]]:
    """
    简化的知识检索函数，用于向后兼容
    
    Args:
        user_query: 用户查询字符串
    
    Returns:
        检索结果列表或 None
    """
    try:
        service = KnowledgeRetrievalService()
        # 注意：这是同步调用，实际使用时建议使用异步版本
        import asyncio
        results = asyncio.run(service.search_knowledge(user_query))
        return results if results else None
    except Exception as e:
        logger.error(f"Knowledge retrieval failed: {e}")
        return None

if __name__ == "__main__":
    # 测试示例
    user_query = "VectorForge 平台的主要功能是什么？"
    results = retrieve_knowledge(user_query)
    if results:
        print(f"Found {len(results)} results:")
        for result in results:
            print(f"- {result}")
    else:
        print("No relevant knowledge found.")