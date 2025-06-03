import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    servers=[
        {
            "url": settings.server_url,
            "description": f"{settings.ENVIRONMENT.title()} server"
        },
    ]
)


# 配置 CORS 中间件
# allow_origins: 允许的源域名列表
# allow_credentials: 允许携带认证信息（如 cookies）
# allow_methods: 允许的 HTTP 方法，["*"] 表示允许所有方法
# allow_headers: 允许的请求头，["*"] 表示允许所有请求头
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 根路由
@app.get("/v1", operation_id="root")
def root():
    """
    根路由
    """
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }

app.include_router(api_router, prefix=settings.API_V1_STR)