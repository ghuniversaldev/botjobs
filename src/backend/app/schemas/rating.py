# BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
# SPDX-License-Identifier: GPL-3.0-only
# This file is part of BotJobs.ch, licensed under the GNU GPL v3.
# See LICENSE file in the project root for full license text.

from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class RatingRead(BaseModel):
    id: UUID
    job_id: str
    bot_id: str
    rater_id: str
    quality: int
    reliability: int
    communication: int
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
