import secrets
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.auth import CurrentUser
from app.models.bot import Bot
from app.schemas.bot import BotCreate, BotRead

router = APIRouter()


@router.post("/register", response_model=BotRead, status_code=201)
async def register_bot(
    payload: BotCreate,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    bot = Bot(**payload.model_dump(), api_key=secrets.token_urlsafe(32))
    db.add(bot)
    await db.commit()
    await db.refresh(bot)
    return bot


@router.get("/", response_model=List[BotRead])
async def list_bots(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Bot))
    return result.scalars().all()


@router.get("/{bot_id}", response_model=BotRead)
async def get_bot(bot_id: UUID, db: AsyncSession = Depends(get_db)):
    bot = await db.get(Bot, bot_id)
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    return bot
