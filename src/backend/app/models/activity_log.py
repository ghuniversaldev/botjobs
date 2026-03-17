# BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
# SPDX-License-Identifier: GPL-3.0-only
# This file is part of BotJobs.ch, licensed under the GNU GPL v3.
# See LICENSE file in the project root for full license text.

import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, JSON
from app.database import Base


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False)
    job_id = Column(String, nullable=True)
    bot_id = Column(String, nullable=True)
    action = Column(String, nullable=False)  # job_created | bot_registered | negotiation_started | negotiation_accepted
    log_data = Column("metadata", JSON, default=dict)
    timestamp = Column(DateTime, default=datetime.utcnow)
