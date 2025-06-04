# 进入后端目录
`cd backend`

# 使用 uv 启动（推荐）
`uv run uvicorn app.main:app --host 0.0.0.0 --port 8009`

# 或者如果你想要开发模式（自动重载）
`uv run uvicorn app.main:app --host 0.0.0.0 --port 8009 --reload`