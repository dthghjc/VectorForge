from fastapi import APIRouter

from app.dify_api.v1 import conversations

router = APIRouter()

router.include_router(conversations.router, tags=["Dify集成"]) 