# BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
# SPDX-License-Identifier: GPL-3.0-only
# This file is part of BotJobs.ch, licensed under the GNU GPL v3.
# See LICENSE file in the project root for full license text.

"""
Test configuration for BotJobs.ch backend.

Uses SQLite in-memory (via aiosqlite + StaticPool) so no PostgreSQL required.
Auth is fully mocked — no Supabase JWKS calls happen.
"""
import os

# ── Set env vars BEFORE any app module is imported ─────────────────────────
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "test-anon-key")
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-jwt-secret-at-least-32-chars!!")
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# ── Mock Users ──────────────────────────────────────────────────────────────
JOB_OWNER_ID = "user-job-owner-001"
BOT_OWNER_ID = "user-bot-owner-001"
ADMIN_ID     = "user-admin-001"


class _MockUser:
    def __init__(self, id_: str, email: str):
        self.id = id_
        self.email = email
        self.role = "authenticated"


JOB_OWNER  = _MockUser(JOB_OWNER_ID, "owner@test.com")
BOT_OWNER  = _MockUser(BOT_OWNER_ID, "botowner@test.com")
ADMIN_USER = _MockUser(ADMIN_ID, "admin@test.com")

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


# ── DB Fixture ──────────────────────────────────────────────────────────────
@pytest_asyncio.fixture
async def db_session():
    """Fresh in-memory SQLite DB for each test function."""
    from app.database import Base
    # Ensure all models are registered with Base
    import app.models.job        # noqa: F401
    import app.models.bot        # noqa: F401
    import app.models.submission  # noqa: F401
    import app.models.negotiation  # noqa: F401
    import app.models.activity_log  # noqa: F401
    import app.models.admin_user  # noqa: F401

    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    factory = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


# ── HTTP Client Fixture ─────────────────────────────────────────────────────
@pytest_asyncio.fixture
async def client(db_session):
    """AsyncClient wired to the FastAPI app with SQLite DB."""
    from app.main import app
    from app.database import get_db

    async def override_db():
        yield db_session

    app.dependency_overrides[get_db] = override_db

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


# ── Auth Helper ─────────────────────────────────────────────────────────────
def as_user(user: _MockUser) -> None:
    """Set the authenticated user for the next request(s)."""
    from app.main import app
    from app.auth import require_user

    async def override():
        return user

    app.dependency_overrides[require_user] = override


def no_auth() -> None:
    """Remove user override (simulate unauthenticated request)."""
    from app.main import app
    from app.auth import require_user

    app.dependency_overrides.pop(require_user, None)
