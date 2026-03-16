"""
Auth helpers — verifies Supabase JWT tokens directly via PyJWT.
No supabase-py client needed on the backend.
"""
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from app.config import settings

bearer = HTTPBearer(auto_error=False)


class AuthUser(BaseModel):
    id: str
    email: str | None = None
    role: str = "authenticated"


async def require_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Security(bearer)],
) -> AuthUser:
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
        return AuthUser(
            id=payload["sub"],
            email=payload.get("email"),
            role=payload.get("role", "authenticated"),
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


CurrentUser = Annotated[AuthUser, Depends(require_user)]
