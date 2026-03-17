# BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
# SPDX-License-Identifier: GPL-3.0-only
# This file is part of BotJobs.ch, licensed under the GNU GPL v3.
# See LICENSE file in the project root for full license text.

from uuid import UUID
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class BotCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    skills: List[str] = []
    owner: str
    bot_type: Optional[str] = None
    region: Optional[str] = None
    certifications: List[str] = []
    bot_autonomy: bool = False
    max_price: Optional[float] = None
    min_price: Optional[float] = None


class BotRead(BotCreate):
    id: UUID
    reputation_score: float
    created_at: datetime

    class Config:
        from_attributes = True


class BotRegisterRead(BotRead):
    """Registration response — includes api_key (returned once only)."""
    api_key: Optional[str] = None
