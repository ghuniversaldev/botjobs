from uuid import UUID
from datetime import datetime
from typing import List
from pydantic import BaseModel, Field


class BotCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    skills: List[str] = []
    owner: str


class BotRead(BotCreate):
    id: UUID
    reputation_score: float
    created_at: datetime

    class Config:
        from_attributes = True
