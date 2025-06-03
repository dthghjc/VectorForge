from fastapi import APIRouter

from app.api.v1.integrations.dify import conversations

router = APIRouter()

router.include_router(conversations.router, tags=["Dify集成"]) 