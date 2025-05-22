VectorForge/
├── .cursor/                         # Cursor 编辑器配置
│   ├── cursorrules                  # 全局协作规则（可选）
│   └── rules/                       # 新版 .mdc 规则文件目录（推荐）
│       ├── llm-chat.mdc
│       ├── milvus-tools.mdc
│       └── global-structure.mdc

├── .vscode/                         # VS Code 配置
│   └── settings.json                # 包含解释器路径等

├── .gitignore                       # 已配置前后端忽略规则
├── .gitattributes                   # 换行符统一（LF）
├── README.md                        # 项目说明（强烈推荐维护）
├── docker-compose.yml              # 可选，部署 MinIO/PostgreSQL 等

├── backend/                         # FastAPI 后端目录
│   ├── .venv/                       # uv 创建的虚拟环境（被忽略）
│   ├── .env                         # 私密配置（未提交）
│   ├── .env.example                 # 环境变量示例 ✅
│   ├── requirements.txt             # uv pip freeze 导出的依赖
│   ├── alembic/                     # 数据迁移（可选）
│   └── app/
│       ├── api/                     # 路由模块（chat.py, milvus.py 等）
│       ├── core/                    # 配置、启动、日志
│       ├── crud/                    # SQLAlchemy 封装操作
│       ├── models/                  # 数据库模型定义
│       ├── schemas/                 # Pydantic 数据结构
│       ├── services/                # 核心业务逻辑（如聊天审查、向量处理）
│       ├── storage/                 # MinIO 接口封装
│       ├── plugins/                 # 第三方接入（如 dify.py）
│       └── main.py                  # FastAPI 启动入口

├── frontend/                        # Vite + React 前端目录
│   ├── public/                      # 静态资源
│   ├── .env                         # 私密变量（如 VITE_API_URL）
│   ├── .env.example                 # 示例变量 ✅
│   ├── package.json                 # npm 项目声明
│   ├── vite.config.ts               # Vite 配置
│   ├── tsconfig.json                # TypeScript 配置
│   ├── src/
│   │   ├── pages/                   # 页面（如 chat/, milvus/）
│   │   │   ├── chat/                # LLM 对话模块页面
│   │   │   │   └── ChatPage.tsx
│   │   │   └── milvus/              # Milvus 工具页面
│   │   │       └── MilvusPage.tsx
│   │   ├── components/              # 通用组件（如 ChatMessage.tsx）
│   │   ├── lib/                     # 工具库（如 api.ts, useAxios.ts）
│   │   ├── App.tsx
│   │   └── main.tsx

└── scripts/                         # 可选：项目自动化脚本
    ├── bootstrap.sh                 # 初始化 `.venv` + 安装依赖
    └── deploy.sh                    # 一键部署脚本（如 Docker 启动）
