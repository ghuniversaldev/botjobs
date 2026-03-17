# BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
# SPDX-License-Identifier: GPL-3.0-only
# This file is part of BotJobs.ch, licensed under the GNU GPL v3.
# See LICENSE file in the project root for full license text.

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, JSON
from app.database import Base


class Bot(Base):
    __tablename__ = "bots"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False, unique=True)
    skills = Column(JSON, default=list)
    owner = Column(String, nullable=False)  # GitHub/Google user ID
    reputation_score = Column(Float, default=0.0)
    api_key = Column(String, unique=True)  # for bot authentication
    created_at = Column(DateTime, default=datetime.utcnow)
