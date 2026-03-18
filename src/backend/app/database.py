# BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
# SPDX-License-Identifier: GPL-3.0-only
# This file is part of BotJobs.ch, licensed under the GNU GPL v3.
# See LICENSE file in the project root for full license text.

import socket
from urllib.parse import urlparse, urlunparse

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings


def _resolve_ipv4(url: str) -> str:
    """Replace hostname with its IPv4 address to avoid IPv6 on platforms like Railway."""
    try:
        parsed = urlparse(url)
        host = parsed.hostname
        if host and not host.replace(".", "").isdigit():
            results = socket.getaddrinfo(host, parsed.port, socket.AF_INET)
            if results:
                ipv4 = results[0][4][0]
                netloc = parsed.netloc.replace(host, ipv4)
                url = urlunparse(parsed._replace(netloc=netloc))
    except Exception:
        pass
    return url


engine = create_async_engine(
    _resolve_ipv4(settings.database_url),
    echo=settings.debug,
    pool_pre_ping=True,
    pool_recycle=300,
)

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


class Base(DeclarativeBase):
    pass


async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
