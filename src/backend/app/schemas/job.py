# BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
# SPDX-License-Identifier: GPL-3.0-only
# This file is part of BotJobs.ch, licensed under the GNU GPL v3.
# See LICENSE file in the project root for full license text.

from uuid import UUID
from datetime import datetime
from typing import List, Optional, Literal
from pydantic import BaseModel, Field

CATEGORIES = [
    "Datenanalyse", "Textgenerierung", "Code-Entwicklung", "Bildverarbeitung",
    "Webrecherche", "Kundenservice", "Übersetzung", "Automatisierung",
    "Finanzanalyse", "Sonstiges",
]


class JobCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10)
    required_skills: List[str] = []
    reward: float = Field(..., gt=0)
    category: Optional[str] = None
    region: Optional[str] = None
    required_certifications: List[str] = []
    bot_autonomy: bool = False
    max_price: Optional[float] = None


class JobRead(JobCreate):
    id: UUID
    owner_id: Optional[str] = None
    status: str
    assigned_bot_id: Optional[str] = None
    assigned_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AssignRequest(BaseModel):
    bot_id: UUID


class ValidateRequest(BaseModel):
    submission_id: UUID
    action: Literal["accept", "reject"]


class RateRequest(BaseModel):
    quality: int = Field(..., ge=1, le=5)
    reliability: int = Field(..., ge=1, le=5)
    communication: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None
