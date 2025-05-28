from fastapi import APIRouter

from app.api.v1.sql import auth, chat, audit
from app.api.v1.dify.api import dify_router

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/v1/auth", tags=["auth"])
api_router.include_router(chat.router, prefix="/v1/chats", tags=["chats"])
api_router.include_router(audit.router, prefix="/v1/audit", tags=["audit"])
api_router.include_router(dify_router, prefix="/v1", tags=["dify"])