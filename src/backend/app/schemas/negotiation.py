# BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
# SPDX-License-Identifier: GPL-3.0-only
# This file is part of BotJobs.ch, licensed under the GNU GPL v3.
# See LICENSE file in the project root for full license text.

from uuid import UUID
from datetime import datetime
from typing import Any, Optional, List
from pydantic import BaseModel, Field


class NegotiationOffer(BaseModel):
    price: float = Field(..., gt=0)
    bot_id: str
    bot_autonomy: bool = False
    max_price: Optional[float] = None
    min_price: Optional[float] = None


class NegotiationCounter(BaseModel):
    price: float = Field(..., gt=0)


class NegotiationRead(BaseModel):
    id: UUID
    job_id: str
    bot_id: str
    initial_price: float
    current_price: float
    status: str
    history: List[Any]
    bot_autonomy: bool
    max_price: Optional[float] = None
    min_price: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
