"""
负责与 Milvus 进行连接和交互。它包括 Milvus 客户端的初始化、配置以及与 Milvus 进行的底层数据操作（如插入、查询等）
"""
import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from app.core.config import settings
from pymilvus import connections, Collection, utility, FieldSchema, CollectionSchema, DataType
import logging
from typing import List, Dict, Any, Optional

# 配置日志
# logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

logger = logging.getLogger(__name__)

class MilvusClient:
    """Milvus 向量数据库客户端"""
    
    def __init__(self):
        """初始化 Milvus 客户端"""
        self.connected = False
        self._connect()
    
    def _connect(self):
        """连接到 Milvus 服务"""
        try:
            if not settings.MILVUS_URI:
                logger.warning("MILVUS_URI not configured")
                return
            
            # 连接到 Milvus
            connections.connect(
                alias="default",
                uri=settings.MILVUS_URI,
                token=settings.MILVUS_TOKEN
            )
            
            self.connected = True
            logger.info("Connected to Milvus successfully")
            
        except Exception as e:
            logger.error(f"Failed to connect to Milvus: {e}")
            self.connected = False
    
    def create_collection(
        self, 
        collection_name: str, 
        dimension: int = None,
        description: str = ""
    ) -> bool:
        """
        创建集合
        
        Args:
            collection_name: 集合名称
            dimension: 向量维度
            description: 集合描述
        
        Returns:
            是否创建成功
        """
        if not self.connected:
            return False
        
        try:
            if dimension is None:
                dimension = settings.EMBEDDING_DIMENSION
            
            # 检查集合是否已存在
            if utility.has_collection(collection_name):
                logger.info(f"Collection '{collection_name}' already exists")
                return True
            
            # 定义字段
            fields = [
                FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
                FieldSchema(name="content", dtype=DataType.VARCHAR, max_length=65535),
                FieldSchema(name="vector", dtype=DataType.FLOAT_VECTOR, dim=dimension),
                FieldSchema(name="metadata", dtype=DataType.VARCHAR, max_length=65535),
                FieldSchema(name="created_at", dtype=DataType.VARCHAR, max_length=100)
            ]
            
            # 创建集合模式
            schema = CollectionSchema(fields, description=description)
            
            # 创建集合
            collection = Collection(collection_name, schema)
            
            # 创建索引
            index_params = {
                "metric_type": "L2",
                "index_type": "IVF_FLAT",
                "params": {"nlist": 128}
            }
            collection.create_index("vector", index_params)
            
            logger.info(f"Collection '{collection_name}' created successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to create collection '{collection_name}': {e}")
            return False
    
    async def insert(
        self, 
        collection_name: str, 
        data: List[Dict[str, Any]]
    ) -> bool:
        """
        插入数据到集合
        
        Args:
            collection_name: 集合名称
            data: 数据列表
        
        Returns:
            是否插入成功
        """
        if not self.connected:
            return False
        
        try:
            # 确保集合存在
            if not utility.has_collection(collection_name):
                self.create_collection(collection_name)
            
            collection = Collection(collection_name)
            
            # 准备插入数据
            insert_data = [
                [item["content"] for item in data],
                [item["vector"] for item in data],
                [item["metadata"] for item in data],
                [item["created_at"] for item in data]
            ]
            
            # 插入数据
            collection.insert(insert_data)
            collection.flush()
            
            logger.info(f"Inserted {len(data)} items to collection '{collection_name}'")
            return True
            
        except Exception as e:
            logger.error(f"Failed to insert data to collection '{collection_name}': {e}")
            return False
    
    async def search(
        self,
        collection_name: str,
        query_vector: List[float],
        top_k: int = None,
        filters: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """
        搜索向量
        
        Args:
            collection_name: 集合名称
            query_vector: 查询向量
            top_k: 返回结果数量
            filters: 过滤条件
        
        Returns:
            搜索结果列表
        """
        if not self.connected:
            return []
        
        try:
            if top_k is None:
                top_k = settings.MILVUS_SEARCH_TOP_K
            
            if not utility.has_collection(collection_name):
                logger.warning(f"Collection '{collection_name}' does not exist")
                return []
            
            collection = Collection(collection_name)
            collection.load()
            
            # 搜索参数
            search_params = {
                "metric_type": "L2",
                "params": {"nprobe": 10}
            }
            
            # 执行搜索
            results = collection.search(
                data=[query_vector],
                anns_field="vector",
                param=search_params,
                limit=top_k,
                output_fields=["content", "metadata", "created_at"]
            )
            
            # 处理结果
            search_results = []
            for hits in results:
                for hit in hits:
                    result = {
                        "id": hit.id,
                        "content": hit.entity.get("content"),
                        "metadata": hit.entity.get("metadata"),
                        "created_at": hit.entity.get("created_at"),
                        "score": hit.score
                    }
                    search_results.append(result)
            
            logger.info(f"Search completed: collection='{collection_name}', results={len(search_results)}")
            return search_results
            
        except Exception as e:
            logger.error(f"Failed to search in collection '{collection_name}': {e}")
            return []
    
    def list_collections(self) -> List[str]:
        """获取所有集合名称"""
        if not self.connected:
            return []
        
        try:
            return utility.list_collections()
        except Exception as e:
            logger.error(f"Failed to list collections: {e}")
            return []
    
    def delete_collection(self, collection_name: str) -> bool:
        """删除集合"""
        if not self.connected:
            return False
        
        try:
            if utility.has_collection(collection_name):
                utility.drop_collection(collection_name)
                logger.info(f"Collection '{collection_name}' deleted successfully")
                return True
            else:
                logger.warning(f"Collection '{collection_name}' does not exist")
                return False
        except Exception as e:
            logger.error(f"Failed to delete collection '{collection_name}': {e}")
            return False
    
    def is_connected(self) -> bool:
        """检查是否已连接"""
        return self.connected

# 向后兼容的类
class VectorDatabaseClient(MilvusClient):
    """向后兼容的向量数据库客户端"""
    
    def __init__(self, collection_name: str = None):
        super().__init__()
        self.collection_name = collection_name or f"{settings.MILVUS_COLLECTION_PREFIX}default"
    
    def search(self, query_vector: List[float], top_k: int = None) -> List[Dict[str, Any]]:
        """向后兼容的搜索方法"""
        import asyncio
        return asyncio.run(super().search(self.collection_name, query_vector, top_k))