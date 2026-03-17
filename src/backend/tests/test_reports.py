"""Tests for reporting endpoints: user metrics and admin stats."""
import pytest
from tests.conftest import as_user, no_auth, JOB_OWNER, BOT_OWNER, ADMIN_USER

JOB_PAYLOAD = {
    "title": "Process Sales Reports",
    "description": "Aggregate monthly sales data from CSV files.",
    "required_skills": ["python", "pandas"],
    "reward": 40.0,
}
BOT_PAYLOAD = {
    "name": "SalesBot",
    "skills": ["python", "pandas"],
    "owner": BOT_OWNER.id,
}


async def _seed_admin(db_session):
    """Insert ADMIN_USER into admin_users table."""
    from app.models.admin_user import AdminUser
    admin = AdminUser(user_id=ADMIN_USER.id)
    db_session.add(admin)
    await db_session.commit()


# ─────────────────────────── User Metrics ──────────────────────────────────

async def test_metrics_empty(client):
    as_user(JOB_OWNER)
    resp = await client.get("/reports/metrics")
    assert resp.status_code == 200
    data = resp.json()
    assert data["jobs_total"] == 0
    assert data["bots_total"] == 0
    assert data["submissions_total"] == 0
    assert data["success_rate"] == 0.0


async def test_metrics_with_jobs(client):
    as_user(JOB_OWNER)
    await client.post("/jobs/", json=JOB_PAYLOAD)
    await client.post("/jobs/", json={**JOB_PAYLOAD, "title": "Second Job"})

    resp = await client.get("/reports/metrics")
    assert resp.status_code == 200
    data = resp.json()
    assert data["jobs_total"] == 2
    assert data["jobs_open"] == 2
    assert data["jobs_completed"] == 0


async def test_metrics_with_bots(client):
    as_user(BOT_OWNER)
    await client.post("/bots/register", json=BOT_PAYLOAD)
    await client.post("/bots/register", json={**BOT_PAYLOAD, "name": "SalesBot-v2"})

    resp = await client.get("/reports/metrics")
    assert resp.status_code == 200
    assert resp.json()["bots_total"] == 2


async def test_metrics_with_submissions(client):
    # Create job (JOB_OWNER)
    as_user(JOB_OWNER)
    job = (await client.post("/jobs/", json=JOB_PAYLOAD)).json()

    # Register bot (BOT_OWNER)
    as_user(BOT_OWNER)
    bot = (await client.post("/bots/register", json=BOT_PAYLOAD)).json()

    # Submit solution
    await client.post(f"/jobs/{job['id']}/submit", json={
        "bot_id": bot["id"],
        "result": {"summary": "Done"},
    })

    # BOT_OWNER metrics
    as_user(BOT_OWNER)
    resp = await client.get("/reports/metrics")
    data = resp.json()
    assert data["bots_total"] == 1
    assert data["submissions_total"] == 1
    assert data["submissions_accepted"] == 0  # still pending
    assert data["success_rate"] == 0.0


async def test_metrics_isolation(client):
    """Each user's metrics are isolated from each other."""
    # JOB_OWNER creates 3 jobs
    as_user(JOB_OWNER)
    for i in range(3):
        await client.post("/jobs/", json={**JOB_PAYLOAD, "title": f"Job {i}"})

    # BOT_OWNER creates 2 bots
    as_user(BOT_OWNER)
    for i in range(2):
        await client.post("/bots/register", json={**BOT_PAYLOAD, "name": f"Bot{i}"})

    # JOB_OWNER sees 3 jobs, 0 bots
    as_user(JOB_OWNER)
    data = (await client.get("/reports/metrics")).json()
    assert data["jobs_total"] == 3
    assert data["bots_total"] == 0

    # BOT_OWNER sees 0 jobs, 2 bots
    as_user(BOT_OWNER)
    data = (await client.get("/reports/metrics")).json()
    assert data["jobs_total"] == 0
    assert data["bots_total"] == 2


async def test_metrics_unauthenticated(client):
    no_auth()
    resp = await client.get("/reports/metrics")
    assert resp.status_code == 401


# ─────────────────────────── Admin Report ──────────────────────────────────

async def test_admin_report_unauthorized(client):
    """Regular user cannot access admin endpoint."""
    as_user(JOB_OWNER)
    resp = await client.get("/reports/admin")
    assert resp.status_code == 403


async def test_admin_report_access(client, db_session):
    """Admin user can access platform-wide stats."""
    await _seed_admin(db_session)

    # Create some data
    as_user(JOB_OWNER)
    await client.post("/jobs/", json=JOB_PAYLOAD)

    as_user(BOT_OWNER)
    await client.post("/bots/register", json=BOT_PAYLOAD)

    as_user(ADMIN_USER)
    resp = await client.get("/reports/admin")
    assert resp.status_code == 200
    data = resp.json()

    stats = data["stats"]
    assert stats["total_jobs"] >= 1
    assert stats["total_bots"] >= 1
    assert "completion_rate" in stats
    assert "recent_jobs" in data
    assert "recent_bots" in data


async def test_admin_report_counts_all_users_data(client, db_session):
    """Admin stats aggregate across all users."""
    await _seed_admin(db_session)

    as_user(JOB_OWNER)
    await client.post("/jobs/", json=JOB_PAYLOAD)
    await client.post("/jobs/", json={**JOB_PAYLOAD, "title": "Second Job"})

    as_user(BOT_OWNER)
    await client.post("/bots/register", json=BOT_PAYLOAD)

    as_user(ADMIN_USER)
    resp = await client.get("/reports/admin")
    stats = resp.json()["stats"]
    assert stats["total_jobs"] == 2
    assert stats["total_bots"] == 1
    assert stats["total_submissions"] == 0
