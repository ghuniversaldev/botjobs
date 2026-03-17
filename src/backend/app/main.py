# BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
# SPDX-License-Identifier: GPL-3.0-only
# This file is part of BotJobs.ch, licensed under the GNU GPL v3.
# See LICENSE file in the project root for full license text.

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import jobs, bots, submissions, mock_openclaw, activity, reports, negotiations
from app.database import create_tables
# Import new models so SQLAlchemy registers them with Base.metadata
import app.models.rating  # noqa: F401
import app.models.transaction  # noqa: F401

app = FastAPI(
    title="BotJobs.ch API",
    description="AI Agent Job Platform — REST API",
    version="0.3.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs.router, prefix="/jobs", tags=["Jobs"])
app.include_router(bots.router, prefix="/bots", tags=["Bots"])
app.include_router(submissions.router, prefix="/jobs", tags=["Submissions"])
app.include_router(negotiations.router, prefix="/jobs", tags=["Negotiations"])
app.include_router(activity.router, prefix="/activity", tags=["Activity"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])
app.include_router(mock_openclaw.router, prefix="/mock/openclaw", tags=["Mock OpenClaw"])


@app.on_event("startup")
async def startup():
    await create_tables()


@app.get("/health")
async def health():
    return {"status": "ok"}
