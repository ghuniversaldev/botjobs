"""
Auth helpers — verifies Supabase JWT tokens and extracts the current user.

Usage in a protected router:
    from app.auth import require_user, CurrentUser

    @router.get("/me")
    async def me(user: CurrentUser):
        return user
"""
from typing import Annotated

from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import create_client
from pydantic import BaseModel

from app.config import settings

_supabase = create_client(settings.supabase_url, settings.supabase_service_key)

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
        response = _supabase.auth.get_user(token)
        user = response.user
        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return AuthUser(id=user.id, email=user.email, role=user.role or "authenticated")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# Convenience type alias for dependency injection
CurrentUser = Annotated[AuthUser, Depends(require_user)]
