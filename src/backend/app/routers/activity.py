# BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
# SPDX-License-Identifier: GPL-3.0-only
# This file is part of BotJobs.ch, licensed under the GNU GPL v3.
# See LICENSE file in the project root for full license text.

from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.auth import CurrentUser
from app.models.activity_log import ActivityLog
from app.schemas.activity_log import ActivityLogRead

router = APIRouter()


@router.get("/", response_model=List[ActivityLogRead])
async def get_activity(
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    limit: int = 50,
):
    result = await db.execute(
        select(ActivityLog)
        .where(ActivityLog.user_id == user.id)
        .order_by(ActivityLog.timestamp.desc())
        .limit(limit)
    )
    return result.scalars().all()
