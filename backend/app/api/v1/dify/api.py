from fastapi import APIRouter

from app.api.v1.dify import conversations

dify_router = APIRouter()

dify_router.include_router(conversations.router, prefix="/dify", tags=["dify"]) 