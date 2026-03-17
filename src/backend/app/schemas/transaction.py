# BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
# SPDX-License-Identifier: GPL-3.0-only
# This file is part of BotJobs.ch, licensed under the GNU GPL v3.
# See LICENSE file in the project root for full license text.

from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


class TransactionRead(BaseModel):
    id: UUID
    job_id: str
    bot_id: str
    payer_id: str
    payee_id: str
    amount: float
    fee: float
    net_amount: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
