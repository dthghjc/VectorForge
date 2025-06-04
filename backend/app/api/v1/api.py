from fastapi import APIRouter

from app.api.v1.auth.router import router as auth_router
from app.api.v1.chat.router import router as chat_router
from app.api.v1.chat.conversation import conversation_router
from app.api.v1.audit.router import router as audit_router
from app.api.v1.vectors.router import router as vectors_router

api_router = APIRouter()

# Core APIs
api_router.include_router(auth_router, prefix="/auth", tags=["认证"])
api_router.include_router(chat_router, prefix="/chats", tags=["对话管理"])
api_router.include_router(conversation_router, prefix="/chats", tags=["AI对话"])
api_router.include_router(audit_router, prefix="/audit", tags=["审核标注"])

# Vector management APIs
api_router.include_router(vectors_router, prefix="/vectors", tags=["向量管理"])