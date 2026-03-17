# BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
# SPDX-License-Identifier: GPL-3.0-only
# This file is part of BotJobs.ch, licensed under the GNU GPL v3.
# See LICENSE file in the project root for full license text.

"""
Auth helpers — verifies Supabase JWT tokens via JWKS (ES256).
Supabase now uses asymmetric ES256 keys instead of HS256.
"""
from typing import Annotated

import httpx
import jwt
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.algorithms import ECAlgorithm
from pydantic import BaseModel

from app.config import settings

bearer = HTTPBearer(auto_error=False)

# Cache JWKS keys in memory
_jwks_cache: dict = {}

JWKS_URL = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"


async def _get_public_key(kid: str):
    global _jwks_cache
    if kid not in _jwks_cache:
        async with httpx.AsyncClient() as client:
            resp = await client.get(JWKS_URL)
            resp.raise_for_status()
            jwks = resp.json()
        for key in jwks.get("keys", []):
            _jwks_cache[key["kid"]] = ECAlgorithm.from_jwk(key)
    return _jwks_cache.get(kid)


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
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        if not kid:
            raise HTTPException(status_code=401, detail="Missing kid in token header")

        public_key = await _get_public_key(kid)
        if not public_key:
            raise HTTPException(status_code=401, detail="Unknown signing key")

        payload = jwt.decode(
            token,
            public_key,
            algorithms=["ES256"],
            audience="authenticated",
        )
        return AuthUser(
            id=payload["sub"],
            email=payload.get("email"),
            role=payload.get("role", "authenticated"),
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidAudienceError:
        raise HTTPException(status_code=401, detail="Invalid audience")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Auth failed: {e}")


CurrentUser = Annotated[AuthUser, Depends(require_user)]
