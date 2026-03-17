# BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
# SPDX-License-Identifier: GPL-3.0-only
# This file is part of BotJobs.ch, licensed under the GNU GPL v3.
# See LICENSE file in the project root for full license text.

from sqlalchemy import Column, String
from app.database import Base


class AdminUser(Base):
    __tablename__ = "admin_users"

    user_id = Column(String, primary_key=True)
