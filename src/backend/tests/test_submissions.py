# BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
# SPDX-License-Identifier: GPL-3.0-only
# This file is part of BotJobs.ch, licensed under the GNU GPL v3.
# See LICENSE file in the project root for full license text.

"""Tests for job submissions (bot solutions)."""
import pytest
from tests.conftest import as_user, no_auth, JOB_OWNER, BOT_OWNER

JOB_PAYLOAD = {
    "title": "Classify Customer Emails",
    "description": "Classify emails into categories using ML.",
    "required_skills": ["nlp", "classification"],
    "reward": 75.0,
}
BOT_PAYLOAD = {
    "name": "ClassifierBot",
    "skills": ["nlp", "classification"],
    "owner": BOT_OWNER.id,
}


async def _setup(client):
    """Create one job (JOB_OWNER) and one bot (BOT_OWNER). Returns (job_id, bot_id)."""
    as_user(JOB_OWNER)
    job = (await client.post("/jobs/", json=JOB_PAYLOAD)).json()

    as_user(BOT_OWNER)
    bot = (await client.post("/bots/register", json=BOT_PAYLOAD)).json()

    return job["id"], bot["id"]


# ─────────────────────────── Submit ────────────────────────────────────────

async def test_submit_solution(client):
    job_id, bot_id = await _setup(client)

    resp = await client.post(f"/jobs/{job_id}/submit", json={
        "bot_id": bot_id,
        "result": {"summary": "Found 3 categories", "items": [1, 2, 3]},
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["job_id"] == job_id
    assert data["bot_id"] == bot_id
    assert data["status"] == "pending"
    assert data["result"]["summary"] == "Found 3 categories"


async def test_submit_keeps_job_open(client):
    """Submitting no longer auto-assigns; job stays open until owner assigns."""
    job_id, bot_id = await _setup(client)

    await client.post(f"/jobs/{job_id}/submit", json={
        "bot_id": bot_id,
        "result": {"output": "done"},
    })

    job_resp = await client.get(f"/jobs/{job_id}")
    assert job_resp.json()["status"] == "open"


async def test_submit_nonexistent_job(client):
    as_user(BOT_OWNER)
    bot = (await client.post("/bots/register", json=BOT_PAYLOAD)).json()

    resp = await client.post(
        "/jobs/00000000-0000-0000-0000-000000000000/submit",
        json={"bot_id": bot["id"], "result": {}},
    )
    assert resp.status_code == 404


async def test_submit_nonexistent_bot(client):
    as_user(JOB_OWNER)
    job = (await client.post("/jobs/", json=JOB_PAYLOAD)).json()

    resp = await client.post(f"/jobs/{job['id']}/submit", json={
        "bot_id": "00000000-0000-0000-0000-000000000000",
        "result": {},
    })
    assert resp.status_code == 404


async def test_submit_multiple_allowed_while_open(client):
    """Multiple bots can submit proposals while job is open."""
    job_id, bot_id = await _setup(client)

    # First submission
    resp1 = await client.post(f"/jobs/{job_id}/submit", json={
        "bot_id": bot_id, "result": {"v": 1},
    })
    assert resp1.status_code == 201

    # Register a second bot and submit
    as_user(BOT_OWNER)
    bot2 = (await client.post("/bots/register", json={
        **BOT_PAYLOAD, "name": "ClassifierBot-v2",
    })).json()

    resp2 = await client.post(f"/jobs/{job_id}/submit", json={
        "bot_id": bot2["id"], "result": {"v": 2},
    })
    assert resp2.status_code == 201


async def test_result_is_flexible_json(client):
    """result field accepts any JSON structure."""
    job_id, bot_id = await _setup(client)

    complex_result = {
        "categories": {"spam": 12, "support": 45, "sales": 8},
        "confidence": 0.94,
        "model": "bert-base",
        "metadata": {"processing_time_ms": 320},
    }
    resp = await client.post(f"/jobs/{job_id}/submit", json={
        "bot_id": bot_id,
        "result": complex_result,
    })
    assert resp.status_code == 201
    assert resp.json()["result"]["confidence"] == 0.94


# ─────────────────────────── My Submissions ────────────────────────────────

async def test_my_submissions(client):
    job_id, bot_id = await _setup(client)

    await client.post(f"/jobs/{job_id}/submit", json={
        "bot_id": bot_id, "result": {"output": "done"},
    })

    as_user(BOT_OWNER)
    resp = await client.get("/jobs/submissions/mine")
    assert resp.status_code == 200
    subs = resp.json()
    assert len(subs) == 1
    assert subs[0]["bot_id"] == bot_id


async def test_my_submissions_empty(client):
    as_user(BOT_OWNER)
    resp = await client.get("/jobs/submissions/mine")
    assert resp.status_code == 200
    assert resp.json() == []


async def test_my_submissions_unauthenticated(client):
    no_auth()
    resp = await client.get("/jobs/submissions/mine")
    assert resp.status_code == 401
