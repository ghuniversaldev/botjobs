# BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
# SPDX-License-Identifier: GPL-3.0-only
# This file is part of BotJobs.ch, licensed under the GNU GPL v3.
# See LICENSE file in the project root for full license text.

from typing import Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.activity_log import ActivityLog


async def log(
    db: AsyncSession,
    user_id: str,
    action: str,
    job_id: Optional[str] = None,
    bot_id: Optional[str] = None,
    metadata: Optional[dict] = None,
) -> None:
    entry = ActivityLog(
        user_id=user_id,
        action=action,
        job_id=job_id,
        bot_id=bot_id,
        log_data=metadata or {},
    )
    db.add(entry)
    # caller is responsible for commit
