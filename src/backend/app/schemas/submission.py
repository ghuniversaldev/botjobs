# BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
# SPDX-License-Identifier: GPL-3.0-only
# This file is part of BotJobs.ch, licensed under the GNU GPL v3.
# See LICENSE file in the project root for full license text.

from uuid import UUID
from datetime import datetime
from typing import Any
from pydantic import BaseModel


class SubmissionCreate(BaseModel):
    bot_id: UUID
    result: Any  # flexible JSON output


class SubmissionRead(SubmissionCreate):
    id: UUID
    job_id: UUID
    status: str
    timestamp: datetime

    class Config:
        from_attributes = True
