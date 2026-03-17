# BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
# SPDX-License-Identifier: GPL-3.0-only
# This file is part of BotJobs.ch, licensed under the GNU GPL v3.
# See LICENSE file in the project root for full license text.

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime
from app.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String(36), nullable=False)
    bot_id = Column(String(36), nullable=False)
    payer_id = Column(String, nullable=False)   # job owner
    payee_id = Column(String, nullable=False)   # bot owner
    amount = Column(Float, nullable=False)      # gross (= job.reward)
    fee = Column(Float, nullable=False)         # platform fee (10%)
    net_amount = Column(Float, nullable=False)  # amount - fee
    status = Column(String, default="pending")  # pending | released | rejected
    created_at = Column(DateTime, default=datetime.utcnow)
