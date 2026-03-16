from uuid import UUID
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class JobCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10)
    required_skills: List[str] = []
    reward: float = Field(..., gt=0)


class JobRead(JobCreate):
    id: UUID
    owner_id: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
