# VectorForge - LLM 对话与向量数据管理平台

## 项目概述

VectorForge 是一个基于现代技术栈构建的 LLM 对话与向量数据管理平台，专注于对话标注审核和向量数据工具两大核心功能模块。项目采用前后端分离架构，支持高并发对话处理、智能标注审核、以及 Milvus 向量数据库的管理工具。

## 技术栈

### 后端技术栈
- **FastAPI** - 现代 Python Web 框架，提供自动 API 文档生成
- **SQLAlchemy** - ORM 框架，支持 MySQL 数据库
- **MySQL** - 主数据库，存储用户、对话、任务等核心数据
- **Milvus/Milvus-lite** - 向量数据库，处理向量存储与检索
- **MinIO** - 对象存储，管理文件上传与向量数据
- **Pydantic** - 数据验证与序列化
- **Alembic** - 数据库迁移工具
- **uv** - Python 包管理器
- **OpenAI API** - LLM 集成服务

### 前端技术栈
- **React 19** - 现代 React 框架
- **TypeScript** - 类型安全的 JavaScript
- **Ant Design** - 企业级 UI 组件库
- **Ant Design X** - 对话 UI 组件扩展
- **Redux Toolkit** - 状态管理
- **React Router** - 路由管理
- **Axios** - HTTP 客户端
- **Vite** - 现代前端构建工具
- **Sass** - CSS 预处理器

## 项目架构

### 后端架构 (`/backend/`)

```
backend/
├── app/                          # 应用核心代码
│   ├── main.py                  # FastAPI 应用入口，多应用架构设计
│   ├── api/                     # API 路由层
│   │   └── v1/                  # API v1 版本
│   │       ├── api.py           # 主路由聚合
│   │       ├── auth/            # 认证相关接口
│   │       ├── chat/            # 对话管理接口
│   │       ├── task/            # 任务管理接口
│   │       ├── audit/           # 审核管理接口
│   │       └── vectors/         # 向量工具接口
│   ├── models/                  # SQLAlchemy 数据模型
│   │   ├── base.py              # 基础模型类
│   │   ├── user.py              # 用户模型
│   │   ├── chat.py              # 对话模型
│   │   └── task.py              # 任务模型
│   ├── schemas/                 # Pydantic 数据模式
│   │   ├── user.py              # 用户数据模式
│   │   ├── chat.py              # 对话数据模式
│   │   ├── task.py              # 任务数据模式
│   │   ├── dify.py              # Dify 集成模式
│   │   └── token.py             # 认证令牌模式
│   ├── crud/                    # 数据访问层
│   │   ├── user.py              # 用户数据操作
│   │   ├── chat.py              # 对话数据操作
│   │   └── task.py              # 任务数据操作
│   ├── services/                # 业务服务层
│   │   ├── conversation_service.py    # 对话服务
│   │   ├── knowledge_retrieval.py     # 知识检索
│   │   ├── openai_client.py           # OpenAI 客户端
│   │   ├── rag_process.py             # RAG 处理
│   │   ├── response_generation.py     # 响应生成
│   │   └── title_generation.py       # 标题生成
│   ├── core/                    # 核心配置
│   │   ├── config.py            # 应用配置
│   │   ├── security.py          # 安全相关
│   │   └── exceptions.py        # 异常处理
│   ├── db/                      # 数据库配置
│   ├── dify_api/                # Dify 第三方集成
│   │   └── v1/                  # Dify API v1
│   ├── storage/                 # 存储服务
│   ├── plugins/                 # 插件系统
│   ├── utils/                   # 工具函数
│   └── templates/               # 模板文件
├── alembic/                     # 数据库迁移
├── scripts/                     # 脚本工具
│   ├── init_db.py               # 数据库初始化
│   ├── migrate.py               # 迁移脚本
│   ├── seed_data.py             # 种子数据
│   └── setup_dev.sh             # 开发环境设置
├── docs/                        # 项目文档
├── tests/                       # 测试文件
├── examples/                    # 示例代码
├── pyproject.toml               # Python 项目配置
├── requirements.txt             # 依赖列表
└── alembic.ini                  # Alembic 配置
```

#### 核心设计特点

1. **多应用架构**: 
   - 主 API 服务 (`/api`) - 启用 CORS，支持前端调用
   - Dify 集成服务 (`/dify_api`) - 不启用 CORS，专用于第三方集成

2. **分层架构**:
   - API 层：处理 HTTP 请求与响应
   - Service 层：业务逻辑处理
   - CRUD 层：数据访问抽象
   - Model 层：数据模型定义

3. **数据结构设计**:
   - 用户系统：支持角色权限管理
   - 对话系统：支持多轮对话与上下文
   - 任务系统：支持异步任务处理
   - 审核系统：支持对话质量评估

### 前端架构 (`/frontend/`)

```
frontend/
├── src/
│   ├── main.tsx                 # 应用入口
│   ├── App.tsx                  # 根组件，动态路由加载
│   ├── page/                    # 页面组件
│   │   ├── home/                # 首页
│   │   ├── login/               # 登录页
│   │   ├── chat/                # 对话页面
│   │   ├── Annotation/          # 对话标注页面
│   │   ├── review/              # 审核页面
│   │   ├── vectorTools/         # 向量工具页面
│   │   ├── userManagement/      # 用户管理
│   │   ├── sub1/, sub11/, sub12/ # 子模块页面
│   │   ├── sub2/, sub21/, sub211/, sub212/ # 子模块页面
│   │   └── 404/                 # 404 页面
│   ├── components/              # 通用组件
│   │   ├── annotation/          # 标注相关组件
│   │   ├── review/              # 审核相关组件
│   │   ├── header/              # 头部组件
│   │   └── navLeft/             # 左侧导航
│   ├── api/                     # API 接口封装
│   │   ├── index.ts             # API 基础配置
│   │   ├── auth.ts              # 认证接口
│   │   ├── chat.ts              # 对话接口
│   │   └── task.ts              # 任务接口
│   ├── store/                   # Redux 状态管理
│   │   ├── index.ts             # Store 配置
│   │   ├── login/               # 登录状态
│   │   ├── user/                # 用户状态
│   │   └── finance/             # 财务状态
│   ├── router/                  # 路由配置
│   │   ├── index.tsx            # 基础路由
│   │   └── routerMap.tsx        # 路由映射
│   ├── hooks/                   # 自定义 Hooks
│   ├── utils/                   # 工具函数
│   ├── types/                   # TypeScript 类型定义
│   ├── lib/                     # 第三方库配置
│   ├── data/                    # 模拟数据
│   └── assets/                  # 静态资源
├── public/                      # 公共资源
├── package.json                 # 项目配置
├── vite.config.ts               # Vite 配置
├── tsconfig.json                # TypeScript 配置
└── README.md                    # 前端说明
```

#### 核心设计特点

1. **模块化页面结构**:
   - 每个功能模块独立为页面组件
   - 支持动态路由与权限控制
   - 清晰的页面层次结构

2. **组件复用设计**:
   - 通用组件与业务组件分离
   - 标注、审核等功能组件模块化
   - 基于 Ant Design 的一致性 UI

3. **状态管理**:
   - Redux Toolkit 管理全局状态
   - 模块化 Slice 设计
   - 支持异步数据处理

4. **类型安全**:
   - 完整的 TypeScript 类型定义
   - API 接口类型约束
   - 组件 Props 类型检查

## 核心功能模块

### 1. 对话管理与标注系统

**前端组件**:
- `ChatTable.tsx` - 对话列表与管理
- `AnnotationModal.tsx` - 对话标注弹窗
- `Annotation/index.tsx` - 标注主页面

**后端接口**:
- `/api/v1/chat/` - 对话 CRUD 操作
- `/api/v1/audit/` - 审核管理
- `/api/v1/task/` - 任务处理

**数据流**:
1. 对话数据通过 Dify API 接入
2. 存储到 MySQL 进行结构化管理
3. 前端提供标注界面和审核工作流
4. 支持批量操作和质量评估

### 2. 向量数据工具

**功能范围**:
- Milvus 数据库连接管理
- 向量数据上传与检索
- 数据结构设计工具
- 批量数据处理

**技术实现**:
- 后端集成 Milvus Python SDK
- MinIO 处理大文件上传
- 前端提供可视化操作界面

### 3. 用户权限系统

**认证机制**:
- JWT Token 认证
- 基于角色的权限控制 (RBAC)
- 动态菜单与路由权限

**安全特性**:
- 密码加密存储
- API 接口权限验证
- 跨域请求安全配置

## 环境配置

### 后端启动

```bash
# 进入后端目录
cd backend

# 使用 uv 安装依赖
uv sync

# 启动开发服务器
uv run uvicorn app.main:app --host 0.0.0.0 --port 8009 --reload

# 数据库迁移
uv run alembic upgrade head

# 初始化数据
uv run python scripts/init_db.py
```

### 前端启动

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 环境变量配置

创建 `.env` 文件：

```env
# 数据库配置
DATABASE_URL=mysql+pymysql://user:password@localhost:3306/vectorforge

# OpenAI 配置
OPENAI_API_KEY=your_openai_api_key
OPENAI_BASE_URL=https://api.openai.com/v1

# Milvus 配置
MILVUS_HOST=localhost
MILVUS_PORT=19530

# MinIO 配置
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# 应用配置
SECRET_KEY=your_secret_key
ENVIRONMENT=development
PROJECT_NAME=VectorForge
```

## 开发规范

### 代码组织原则

1. **简洁性优先**: 消除不必要的复杂性和特殊情况处理
2. **数据结构驱动**: 优先设计清晰的数据结构，再实现业务逻辑
3. **模块化设计**: 每个模块职责单一，接口清晰
4. **向后兼容**: 保证 API 变更不破坏现有功能

### 文件命名规范

**前端**:
- 页面组件：PascalCase (如 `Annotation/index.tsx`)
- 通用组件：PascalCase (如 `ChatTable.tsx`)
- 工具函数：camelCase (如 `generateRoutes.ts`)
- 样式文件：kebab-case (如 `index.scss`)

**后端**:
- 模块文件：snake_case (如 `chat_service.py`)
- 类名：PascalCase (如 `ChatModel`)
- 函数名：snake_case (如 `get_chat_list`)

### API 设计规范

1. **RESTful 设计**: 遵循 HTTP 动词语义
2. **统一响应格式**: 使用 Pydantic 模型定义
3. **错误处理**: 标准化错误码与消息
4. **文档自动生成**: FastAPI 自动生成 OpenAPI 文档

## 部署说明

### Docker 部署 (推荐)

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看服务状态
docker-compose ps
```

### 手动部署

1. 配置 MySQL 数据库
2. 配置 Milvus 服务
3. 配置 MinIO 对象存储
4. 部署后端服务 (推荐使用 gunicorn)
5. 构建并部署前端静态文件 (推荐使用 nginx)

## 扩展性设计

### 插件系统
- 支持自定义业务插件
- 标准化插件接口
- 热插拔式架构

### 多模态支持
- 向量工具支持文本、图像、音频向量
- 统一的数据处理接口
- 可扩展的存储策略

### 第三方集成
- Dify 平台集成
- 支持多种 LLM 提供商
- 标准化的 webhook 接口

## 贡献指南

1. 遵循项目代码风格
2. 编写单元测试
3. 更新相关文档
4. 提交 Pull Request 前进行完整测试

## License

MIT License

---