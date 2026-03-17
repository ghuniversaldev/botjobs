# BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
# SPDX-License-Identifier: GPL-3.0-only
# This file is part of BotJobs.ch, licensed under the GNU GPL v3.
# See LICENSE file in the project root for full license text.

"""Tests for v0.3 workflow: assign → validate → rate + transactions."""
import pytest
from tests.conftest import as_user, JOB_OWNER, BOT_OWNER

JOB_PAYLOAD = {
    "title": "Automate Invoice Processing",
    "description": "Extract line items from PDF invoices using OCR and return JSON.",
    "required_skills": ["ocr", "pdf"],
    "reward": 200.0,
    "category": "Datenanalyse",
    "region": "Schweiz",
}
BOT_PAYLOAD = {
    "name": "InvoiceBot-Pro",
    "skills": ["ocr", "pdf"],
    "owner": BOT_OWNER.id,
    "bot_type": "Spezialist",
    "region": "Schweiz",
    "certifications": ["GDPR-compliant"],
}


async def _setup(client):
    as_user(JOB_OWNER)
    job = (await client.post("/jobs/", json=JOB_PAYLOAD)).json()
    as_user(BOT_OWNER)
    bot = (await client.post("/bots/register", json=BOT_PAYLOAD)).json()
    return job["id"], bot["id"]


async def _setup_with_submission(client):
    job_id, bot_id = await _setup(client)
    sub = (await client.post(f"/jobs/{job_id}/submit", json={
        "bot_id": bot_id, "result": {"invoices": 3, "total": 1500.0},
    })).json()
    return job_id, bot_id, sub["id"]


# ─────────────────── Categories & Region ───────────────────────────────────

async def test_job_has_category_and_region(client):
    as_user(JOB_OWNER)
    job = (await client.post("/jobs/", json=JOB_PAYLOAD)).json()
    assert job["category"] == "Datenanalyse"
    assert job["region"] == "Schweiz"


async def test_filter_by_category(client):
    as_user(JOB_OWNER)
    await client.post("/jobs/", json=JOB_PAYLOAD)
    await client.post("/jobs/", json={**JOB_PAYLOAD, "title": "Other Job", "category": "Textgenerierung"})

    resp = await client.get("/jobs/?category=Datenanalyse")
    assert all(j["category"] == "Datenanalyse" for j in resp.json())


async def test_filter_by_region(client):
    as_user(JOB_OWNER)
    await client.post("/jobs/", json=JOB_PAYLOAD)
    resp = await client.get("/jobs/?region=Schweiz")
    assert all(j["region"] == "Schweiz" for j in resp.json())


async def test_bot_has_type_region_certifications(client):
    as_user(BOT_OWNER)
    bot = (await client.post("/bots/register", json=BOT_PAYLOAD)).json()
    assert bot["bot_type"] == "Spezialist"
    assert bot["region"] == "Schweiz"
    assert "GDPR-compliant" in bot["certifications"]


# ─────────────────── Assign ────────────────────────────────────────────────

async def test_assign_bot(client):
    job_id, bot_id, _ = await _setup_with_submission(client)

    as_user(JOB_OWNER)
    resp = await client.post(f"/jobs/{job_id}/assign", json={"bot_id": bot_id})
    assert resp.status_code == 200
    assert resp.json()["status"] == "assigned"

    job = (await client.get(f"/jobs/{job_id}")).json()
    assert job["status"] == "assigned"
    assert job["assigned_bot_id"] == bot_id


async def test_assign_non_owner_forbidden(client):
    job_id, bot_id, _ = await _setup_with_submission(client)

    as_user(BOT_OWNER)
    resp = await client.post(f"/jobs/{job_id}/assign", json={"bot_id": bot_id})
    assert resp.status_code == 403


async def test_assign_nonexistent_bot(client):
    as_user(JOB_OWNER)
    job = (await client.post("/jobs/", json=JOB_PAYLOAD)).json()

    as_user(JOB_OWNER)
    resp = await client.post(f"/jobs/{job['id']}/assign", json={
        "bot_id": "00000000-0000-0000-0000-000000000000"
    })
    assert resp.status_code == 404


# ─────────────────── Validate ──────────────────────────────────────────────

async def test_validate_accept(client):
    job_id, bot_id, sub_id = await _setup_with_submission(client)

    as_user(JOB_OWNER)
    await client.post(f"/jobs/{job_id}/assign", json={"bot_id": bot_id})
    resp = await client.post(f"/jobs/{job_id}/validate", json={
        "submission_id": sub_id, "action": "accept",
    })
    assert resp.status_code == 200
    assert resp.json()["status"] == "accepted"

    job = (await client.get(f"/jobs/{job_id}")).json()
    assert job["status"] == "completed"


async def test_validate_reject(client):
    job_id, bot_id, sub_id = await _setup_with_submission(client)

    as_user(JOB_OWNER)
    resp = await client.post(f"/jobs/{job_id}/validate", json={
        "submission_id": sub_id, "action": "reject",
    })
    assert resp.status_code == 200
    assert resp.json()["status"] == "rejected"

    job = (await client.get(f"/jobs/{job_id}")).json()
    assert job["status"] != "completed"


async def test_validate_non_owner_forbidden(client):
    job_id, bot_id, sub_id = await _setup_with_submission(client)

    as_user(BOT_OWNER)
    resp = await client.post(f"/jobs/{job_id}/validate", json={
        "submission_id": sub_id, "action": "accept",
    })
    assert resp.status_code == 403


async def test_validate_wrong_submission_fails(client):
    job_id, bot_id, _ = await _setup_with_submission(client)

    as_user(JOB_OWNER)
    resp = await client.post(f"/jobs/{job_id}/validate", json={
        "submission_id": "00000000-0000-0000-0000-000000000000",
        "action": "accept",
    })
    assert resp.status_code == 404


# ─────────────────── Rate ──────────────────────────────────────────────────

async def _complete_job(client):
    job_id, bot_id, sub_id = await _setup_with_submission(client)
    as_user(JOB_OWNER)
    await client.post(f"/jobs/{job_id}/assign", json={"bot_id": bot_id})
    await client.post(f"/jobs/{job_id}/validate", json={"submission_id": sub_id, "action": "accept"})
    return job_id, bot_id


async def test_rate_bot(client):
    job_id, bot_id = await _complete_job(client)

    as_user(JOB_OWNER)
    resp = await client.post(f"/jobs/{job_id}/rate", json={
        "quality": 5, "reliability": 4, "communication": 5, "comment": "Excellent work!",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["quality"] == 5
    assert data["bot_id"] == bot_id


async def test_rate_updates_reputation_score(client):
    job_id, bot_id = await _complete_job(client)

    as_user(JOB_OWNER)
    await client.post(f"/jobs/{job_id}/rate", json={"quality": 5, "reliability": 5, "communication": 5})

    bot = (await client.get(f"/bots/{bot_id}")).json()
    assert bot["reputation_score"] == 5.0


async def test_rate_duplicate_rejected(client):
    job_id, _ = await _complete_job(client)

    as_user(JOB_OWNER)
    await client.post(f"/jobs/{job_id}/rate", json={"quality": 3, "reliability": 3, "communication": 3})
    resp = await client.post(f"/jobs/{job_id}/rate", json={"quality": 5, "reliability": 5, "communication": 5})
    assert resp.status_code == 409


async def test_rate_not_completed_fails(client):
    as_user(JOB_OWNER)
    job = (await client.post("/jobs/", json=JOB_PAYLOAD)).json()

    as_user(JOB_OWNER)
    resp = await client.post(f"/jobs/{job['id']}/rate", json={"quality": 4, "reliability": 4, "communication": 4})
    assert resp.status_code == 409


# ─────────────────── Reports ───────────────────────────────────────────────

async def test_metrics_has_spending_and_earnings(client):
    as_user(JOB_OWNER)
    resp = await client.get("/reports/metrics")
    assert "total_spending" in resp.json()
    assert "total_earnings" in resp.json()
