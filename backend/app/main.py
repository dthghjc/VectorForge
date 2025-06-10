import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.api import api_router
from app.dify_api.v1.api import router as dify_router
from app.core.config import settings

def create_main_api_app() -> FastAPI:
    """
    创建主要的API应用（带CORS）
    """
    api_app = FastAPI(
        title=f"{settings.PROJECT_NAME} - Main API",
        version=settings.VERSION,
        description=f"{settings.DESCRIPTION} - 主要API服务",
        openapi_url="/v1/openapi.json",
        docs_url="/v1/docs",
        redoc_url="/v1/redoc",
    )
    
    # 配置 CORS 中间件SS
    api_app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # 包含所有主要API路由
    api_app.include_router(api_router, prefix="/v1")
    
    return api_app

def create_dify_api_app() -> FastAPI:
    """
    创建Dify集成应用（不带CORS）
    专门用于第三方集成，不启用CORS以符合某些集成要求
    """
    dify_app = FastAPI(
        title=f"{settings.PROJECT_NAME} - Dify Integration",
        version=settings.VERSION,
        description=f"{settings.DESCRIPTION} - Dify集成服务",
        openapi_url="/v1/openapi.json",
        docs_url="/v1/docs",
        redoc_url="/v1/redoc",
    )
    
    # 注意：故意不添加CORS中间件
    # Dify集成可能需要特殊的跨域处理
    
    # 包含Dify集成路由
    dify_app.include_router(
        dify_router, 
        prefix="/v1",
        tags=["Dify集成"]
    )
    
    return dify_app

def create_root_app() -> FastAPI:
    """
    创建根应用
    负责路由分发和基础服务
    """
    root_app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description=settings.DESCRIPTION,
        # 禁用根应用的文档，因为子应用有各自的文档
        docs_url=None,
        redoc_url=None,
        openapi_url=None,
    )
    
    # 根路由
    @root_app.get("/api/v1", operation_id="api_info")
    async def api_info():
        """
        API版本信息
        """
        return {
            "api_version": "v1",
            "project": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT,
        }
    
    # 根路由
    @root_app.get("/dify_api/v1", operation_id="dify_api_info")
    async def dify_api_info():
        """
        API版本信息
        """
        return {
            "api_version": "v1",
            "project": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT
        }
    
    
    # 创建子应用
    main_api_app = create_main_api_app()
    dify_api_app = create_dify_api_app()
    
    # 挂载子应用
    # 主API服务挂载到 /api 路径
    root_app.mount("/api", main_api_app)
    
    # Dify集成服务挂载到 /integrations/dify 路径
    root_app.mount("/dify_api", dify_api_app)
    
    return root_app

# 创建应用实例
app = create_root_app()