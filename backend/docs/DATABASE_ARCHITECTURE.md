# VectorForge 数据库架构说明

## 目录结构与职责分工

### 📁 `app/db/` - 数据库基础设施层
负责数据库连接、客户端初始化和底层数据访问。

```
app/db/
├── session.py              # SQLAlchemy 会话管理
├── milvus.py               # Milvus 向量数据库客户端
├── conversation_manager.py # 内存对话管理器
└── mysql_client.py         # 原始 MySQL 客户端（待重构）
```

**职责**:
- 数据库连接管理
- 客户端初始化
- 底层数据访问接口
- 会话和连接池管理

### 📁 `app/crud/` - 数据访问层
负责具体的业务数据操作，使用 SQLAlchemy ORM。

```
app/crud/
└── user.py                 # 用户和审核相关 CRUD 操作
```

**职责**:
- 业务实体的 CRUD 操作
- 数据验证和转换
- 复杂查询逻辑
- 业务规则实现

## 架构优势

### 1. 清晰的职责分离
- **db层**: 专注于数据库技术细节
- **crud层**: 专注于业务逻辑实现

### 2. 可维护性
- 数据库连接变更只影响 db 层
- 业务逻辑变更只影响 crud 层

### 3. 可测试性
- 可以独立测试数据访问逻辑
- 可以 mock 数据库连接进行单元测试

## 当前问题与改进建议

### ⚠️ 问题1: 混合的数据访问方式
**现状**: 
- `mysql_client.py` 使用原始 SQL
- `crud/user.py` 使用 SQLAlchemy ORM
- `conversation_manager.py` 使用内存存储

**建议**: 统一使用 SQLAlchemy ORM，移除原始 SQL 客户端

### ⚠️ 问题2: 对话数据持久化
**现状**: `conversation_manager.py` 只在内存中存储对话

**建议**: 创建 `crud/chat.py` 实现对话的数据库持久化

### ⚠️ 问题3: 缺少完整的 CRUD 覆盖
**现状**: 只有用户相关的 CRUD

**建议**: 补充其他业务实体的 CRUD

## 推荐的重构方案

### 1. 移除冗余代码
```bash
# 删除或重构这些文件
app/db/mysql_client.py  # 用 SQLAlchemy 替代
```

### 2. 补充 CRUD 文件
```bash
# 新增这些 CRUD 文件
app/crud/chat.py        # 对话相关 CRUD
app/crud/message.py     # 消息相关 CRUD  
app/crud/knowledge.py   # 知识库相关 CRUD
```

### 3. 重构对话管理
```python
# 将 conversation_manager.py 重构为
app/db/conversation_cache.py  # 内存缓存层
app/crud/conversation.py      # 数据库持久化层
```

## 标准使用模式

### 在 API 层使用
```python
from app.crud.user import user_crud
from app.crud.chat import chat_crud
from app.db.session import get_db

@router.post("/users")
def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    return user_crud.create_user(db, user_data)

@router.get("/chats/{chat_id}")
def get_chat(chat_id: str, db: Session = Depends(get_db)):
    return chat_crud.get_chat_by_id(db, chat_id)
```

### 在服务层使用
```python
from app.crud.user import user_crud
from app.crud.message import message_crud

class ChatService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_chat_message(self, user_id: str, content: str):
        # 验证用户存在
        user = user_crud.get_user_by_id(self.db, user_id)
        if not user:
            raise ValueError("User not found")
        
        # 创建消息
        return message_crud.create_message(self.db, user_id, content)
```

## 数据库选择建议

### 主数据库: PostgreSQL
- **用途**: 用户、对话、消息等结构化数据
- **优势**: ACID 事务、复杂查询、JSON 支持

### 向量数据库: Milvus
- **用途**: 向量嵌入、语义搜索
- **优势**: 高性能向量检索

### 缓存层: Redis (可选)
- **用途**: 会话缓存、临时数据
- **优势**: 高性能读写

## 迁移计划

### 阶段1: 清理现有代码
1. 重构 `mysql_client.py` 中有用的功能到 CRUD 层
2. 保持 `conversation_manager.py` 作为缓存层

### 阶段2: 补充 CRUD 层
1. 创建 `crud/chat.py`
2. 创建 `crud/message.py`
3. 实现对话的数据库持久化

### 阶段3: 优化架构
1. 添加 Redis 缓存层
2. 实现读写分离
3. 添加数据库连接池优化

这种架构既保持了现有代码的可用性，又为未来的扩展提供了清晰的路径。 