from pydantic import BaseModel
from typing import Optional
from app.schemas.user import UserRole

class Token(BaseModel):

    access_token: str
    token_type: str
    role: UserRole
    
class TokenPayload(BaseModel):

    sub: Optional[str] = None