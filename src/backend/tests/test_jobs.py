"""Tests for job lifecycle: create, list, filter, my-jobs."""
import pytest
from tests.conftest import as_user, no_auth, JOB_OWNER, BOT_OWNER

JOB_PAYLOAD = {
    "title": "Parse Invoice PDFs",
    "description": "Extract all line items from the attached PDFs.",
    "required_skills": ["pdf-parsing", "ocr"],
    "reward": 50.0,
}


async def _create_job(client, payload=None):
    as_user(JOB_OWNER)
    return await client.post("/jobs/", json=payload or JOB_PAYLOAD)


# ─────────────────────────── Create ────────────────────────────────────────

async def test_create_job(client):
    resp = await _create_job(client)
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == JOB_PAYLOAD["title"]
    assert data["reward"] == JOB_PAYLOAD["reward"]
    assert data["status"] == "open"
    assert data["owner_id"] == JOB_OWNER.id
    assert "id" in data


async def test_create_job_validates_title_length(client):
    as_user(JOB_OWNER)
    resp = await client.post("/jobs/", json={**JOB_PAYLOAD, "title": "Ab"})
    assert resp.status_code == 422  # Pydantic: min_length=3


async def test_create_job_validates_reward(client):
    as_user(JOB_OWNER)
    resp = await client.post("/jobs/", json={**JOB_PAYLOAD, "reward": 0})
    assert resp.status_code == 422  # gt=0


async def test_create_job_unauthenticated(client):
    no_auth()
    resp = await client.post("/jobs/", json=JOB_PAYLOAD)
    assert resp.status_code == 401


# ─────────────────────────── List & Get ────────────────────────────────────

async def test_list_jobs_empty(client):
    resp = await client.get("/jobs/")
    assert resp.status_code == 200
    assert resp.json() == []


async def test_list_jobs(client):
    await _create_job(client)
    await _create_job(client, {**JOB_PAYLOAD, "title": "Analyse Sales Data"})
    resp = await client.get("/jobs/")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


async def test_get_job(client):
    create_resp = await _create_job(client)
    job_id = create_resp.json()["id"]

    resp = await client.get(f"/jobs/{job_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == job_id


async def test_get_job_not_found(client):
    resp = await client.get("/jobs/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404


# ─────────────────────────── Filter ────────────────────────────────────────

async def test_filter_jobs_by_status(client):
    as_user(JOB_OWNER)
    r1 = await client.post("/jobs/", json=JOB_PAYLOAD)
    job_id = r1.json()["id"]

    # Manually mark one job as completed via a second job (still open)
    as_user(JOB_OWNER)
    await client.post("/jobs/", json={**JOB_PAYLOAD, "title": "Another Job"})

    resp_open = await client.get("/jobs/?status=open")
    assert resp_open.status_code == 200
    statuses = {j["status"] for j in resp_open.json()}
    assert statuses == {"open"}


# ─────────────────────────── My Jobs ───────────────────────────────────────

async def test_my_jobs_returns_only_own(client):
    # JOB_OWNER creates a job
    as_user(JOB_OWNER)
    await client.post("/jobs/", json=JOB_PAYLOAD)

    # BOT_OWNER creates a job
    as_user(BOT_OWNER)
    await client.post("/jobs/", json={**JOB_PAYLOAD, "title": "Bot Owner's Job"})

    # JOB_OWNER should only see their own job
    as_user(JOB_OWNER)
    resp = await client.get("/jobs/me")
    assert resp.status_code == 200
    jobs = resp.json()
    assert len(jobs) == 1
    assert jobs[0]["owner_id"] == JOB_OWNER.id


async def test_my_jobs_unauthenticated(client):
    no_auth()
    resp = await client.get("/jobs/me")
    assert resp.status_code == 401
