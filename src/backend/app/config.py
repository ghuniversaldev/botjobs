# BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
# SPDX-License-Identifier: GPL-3.0-only
# This file is part of BotJobs.ch, licensed under the GNU GPL v3.
# See LICENSE file in the project root for full license text.

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str
    supabase_key: str           # anon key (used by frontend)
    supabase_jwt_secret: str    # Project Settings → API → JWT Secret
    database_url: str           # postgresql+asyncpg://...
    secret_key: str = "change-me-in-production"
    debug: bool = False
    allowed_origins: str = "http://localhost:3000,http://localhost:3001"

    class Config:
        env_file = ".env"


settings = Settings()
