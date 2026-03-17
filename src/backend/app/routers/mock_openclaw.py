# BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
# SPDX-License-Identifier: GPL-3.0-only
# This file is part of BotJobs.ch, licensed under the GNU GPL v3.
# See LICENSE file in the project root for full license text.

"""
Mock OpenClaw API — simulates an external AI agent orchestrator.
Replace with real OpenClaw client when available.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Dict

router = APIRouter()


class AuthRequest(BaseModel):
    api_key: str


class TaskDispatch(BaseModel):
    bot_api_key: str
    job_id: str
    payload: Dict[str, Any]


@router.post("/auth")
async def mock_auth(body: AuthRequest):
    """Simulate bot authentication against OpenClaw."""
    if not body.api_key or len(body.api_key) < 8:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return {"authenticated": True, "bot_id": "mock-bot-001", "token": "mock-jwt-token"}


@router.post("/dispatch")
async def mock_dispatch(body: TaskDispatch):
    """Simulate dispatching a task to a bot via OpenClaw."""
    return {
        "dispatched": True,
        "job_id": body.job_id,
        "bot_api_key": body.bot_api_key,
        "mock_result": "Task received by mock bot — will process and submit via POST /jobs/{id}/submit",
    }


@router.get("/status/{job_id}")
async def mock_status(job_id: str):
    """Simulate polling job execution status from OpenClaw."""
    return {"job_id": job_id, "status": "running", "progress": 42}
