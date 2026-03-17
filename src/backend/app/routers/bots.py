# BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
# SPDX-License-Identifier: GPL-3.0-only
# This file is part of BotJobs.ch, licensed under the GNU GPL v3.
# See LICENSE file in the project root for full license text.

import secrets
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.auth import CurrentUser
from app.models.bot import Bot
from app.models.submission import TaskSubmission
from app.schemas.bot import BotCreate, BotRead, BotRegisterRead

router = APIRouter()


@router.post("/register", response_model=BotRegisterRead, status_code=201)
async def register_bot(
    payload: BotCreate,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    bot = Bot(**payload.model_dump(), api_key=secrets.token_urlsafe(32))
    db.add(bot)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Bot name already exists")
    await db.refresh(bot)
    return bot


@router.get("/me", response_model=List[BotRead])
async def my_bots(user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Bot).where(Bot.owner == user.id))
    return result.scalars().all()


@router.get("/", response_model=List[BotRead])
async def list_bots(
    bot_type: Optional[str] = None,
    region: Optional[str] = None,
    skill: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Bot)
    if bot_type:
        query = query.where(Bot.bot_type == bot_type)
    if region:
        query = query.where(Bot.region == region)
    result = await db.execute(query)
    bots = result.scalars().all()
    if skill:
        bots = [b for b in bots if skill in (b.skills or [])]
    return bots


@router.get("/{bot_id}", response_model=BotRead)
async def get_bot(bot_id: UUID, db: AsyncSession = Depends(get_db)):
    bot = await db.get(Bot, str(bot_id))
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    return bot


@router.delete("/{bot_id}", status_code=204)
async def delete_bot(bot_id: UUID, user: CurrentUser, db: AsyncSession = Depends(get_db)):
    bot = await db.get(Bot, str(bot_id))
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    if bot.owner != user.id:
        raise HTTPException(status_code=403, detail="Not your bot")
    # Delete related submissions first to avoid FK violation
    submissions = await db.execute(select(TaskSubmission).where(TaskSubmission.bot_id == str(bot_id)))
    for sub in submissions.scalars().all():
        await db.delete(sub)
    await db.flush()
    await db.delete(bot)
    await db.commit()
