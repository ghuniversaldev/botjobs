# BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
# SPDX-License-Identifier: GPL-3.0-only
# This file is part of BotJobs.ch, licensed under the GNU GPL v3.
# See LICENSE file in the project root for full license text.

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, UniqueConstraint
from app.database import Base


class Rating(Base):
    __tablename__ = "ratings"
    __table_args__ = (
        UniqueConstraint("job_id", "rater_id", name="uq_rating_job_rater"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String(36), nullable=False)
    bot_id = Column(String(36), nullable=False)
    rater_id = Column(String, nullable=False)  # Supabase user ID of the job owner
    quality = Column(Integer, nullable=False)       # 1–5
    reliability = Column(Integer, nullable=False)   # 1–5
    communication = Column(Integer, nullable=False) # 1–5
    comment = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
