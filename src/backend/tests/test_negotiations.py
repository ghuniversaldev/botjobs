"""
Tests for the negotiation mechanism:
  - Simple offer / counter / accept / reject
  - Autonomous bot (auto-accept when counter ≤ max_price)
  - Competing bots
  - Price limit validation
"""
import pytest
from tests.conftest import as_user, no_auth, JOB_OWNER, BOT_OWNER

JOB_PAYLOAD = {
    "title": "Analyse Competitor Prices",
    "description": "Scrape and compare prices across 50 e-commerce sites.",
    "required_skills": ["web-scraping", "data-analysis"],
    "reward": 100.0,
}
BOT_A = {"name": "ConservativeBot",  "skills": ["web-scraping"], "owner": BOT_OWNER.id}
BOT_B = {"name": "AggressiveBot",    "skills": ["data-analysis"], "owner": BOT_OWNER.id}
BOT_C = {"name": "DynamicBot",       "skills": ["ml"], "owner": BOT_OWNER.id}


async def _create_job(client, payload=None):
    as_user(JOB_OWNER)
    return (await client.post("/jobs/", json=payload or JOB_PAYLOAD)).json()


async def _register_bot(client, payload):
    as_user(BOT_OWNER)
    return (await client.post("/bots/register", json=payload)).json()


async def _setup(client):
    """Create job + 3 strategy bots. Returns (job_id, bot_a_id, bot_b_id, bot_c_id)."""
    job   = await _create_job(client)
    bot_a = await _register_bot(client, BOT_A)
    bot_b = await _register_bot(client, BOT_B)
    bot_c = await _register_bot(client, BOT_C)
    return job["id"], bot_a["id"], bot_b["id"], bot_c["id"]


# ─────────────────────────── Simple Negotiation ────────────────────────────

async def test_make_initial_offer(client):
    job_id, bot_id, *_ = await _setup(client)

    as_user(BOT_OWNER)
    resp = await client.post(f"/jobs/{job_id}/negotiate", json={
        "bot_id": bot_id,
        "price": 80.0,
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["initial_price"] == 80.0
    assert data["current_price"] == 80.0
    assert data["status"] == "open"
    assert len(data["history"]) == 1
    assert data["history"][0]["actor"] == "bot"


async def test_counter_offer(client):
    job_id, bot_id, *_ = await _setup(client)

    as_user(BOT_OWNER)
    await client.post(f"/jobs/{job_id}/negotiate", json={"bot_id": bot_id, "price": 80.0})

    as_user(JOB_OWNER)
    resp = await client.post(f"/jobs/{job_id}/counter", json={"price": 90.0})
    assert resp.status_code == 200
    data = resp.json()
    assert data["current_price"] == 90.0
    assert len(data["history"]) == 2
    assert data["history"][-1]["actor"] == "user"


async def test_counter_offer_by_non_owner_fails(client):
    job_id, bot_id, *_ = await _setup(client)

    as_user(BOT_OWNER)
    await client.post(f"/jobs/{job_id}/negotiate", json={"bot_id": bot_id, "price": 80.0})

    # BOT_OWNER tries to counter — should be forbidden
    resp = await client.post(f"/jobs/{job_id}/counter", json={"price": 85.0})
    assert resp.status_code == 403


async def test_accept_negotiation(client):
    job_id, bot_id, *_ = await _setup(client)

    as_user(BOT_OWNER)
    await client.post(f"/jobs/{job_id}/negotiate", json={"bot_id": bot_id, "price": 80.0})

    as_user(JOB_OWNER)
    await client.post(f"/jobs/{job_id}/counter", json={"price": 90.0})

    # Bot owner accepts the counter
    as_user(BOT_OWNER)
    resp = await client.post(f"/jobs/{job_id}/negotiation/accept")
    assert resp.status_code == 200
    assert resp.json()["status"] == "accepted"

    # Job reward should be updated to the accepted price
    job = (await client.get(f"/jobs/{job_id}")).json()
    assert job["reward"] == 90.0


async def test_reject_negotiation(client):
    job_id, bot_id, *_ = await _setup(client)

    as_user(BOT_OWNER)
    await client.post(f"/jobs/{job_id}/negotiate", json={"bot_id": bot_id, "price": 60.0})

    as_user(BOT_OWNER)
    resp = await client.post(f"/jobs/{job_id}/negotiation/reject")
    assert resp.status_code == 200
    assert resp.json()["status"] == "rejected"


async def test_duplicate_offer_same_bot_fails(client):
    job_id, bot_id, *_ = await _setup(client)

    as_user(BOT_OWNER)
    await client.post(f"/jobs/{job_id}/negotiate", json={"bot_id": bot_id, "price": 80.0})

    # Same bot tries to negotiate again
    resp = await client.post(f"/jobs/{job_id}/negotiate", json={"bot_id": bot_id, "price": 75.0})
    assert resp.status_code == 409


async def test_get_negotiations(client):
    job_id, bot_a, bot_b, _ = await _setup(client)

    # Two different bots make offers
    as_user(BOT_OWNER)
    await client.post(f"/jobs/{job_id}/negotiate", json={"bot_id": bot_a, "price": 80.0})
    await client.post(f"/jobs/{job_id}/negotiate", json={"bot_id": bot_b, "price": 70.0})

    resp = await client.get(f"/jobs/{job_id}/negotiation")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


# ─────────────────────────── Autonomous Bot ────────────────────────────────

async def test_autonomous_auto_accept_within_range(client):
    """
    ConservativeBot (5% discount strategy): offers 95.0, max_price=100.0.
    Job owner counters with 98.0 ≤ 100.0 → auto-accepted.
    """
    job_id, bot_id, *_ = await _setup(client)

    as_user(BOT_OWNER)
    resp = await client.post(f"/jobs/{job_id}/negotiate", json={
        "bot_id": bot_id,
        "price": 95.0,
        "bot_autonomy": True,
        "max_price": 100.0,
    })
    assert resp.status_code == 201
    assert resp.json()["bot_autonomy"] is True

    # Job owner counters within max_price → should auto-accept
    as_user(JOB_OWNER)
    resp = await client.post(f"/jobs/{job_id}/counter", json={"price": 98.0})
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "accepted"
    assert data["current_price"] == 98.0

    # Job reward updated
    job = (await client.get(f"/jobs/{job_id}")).json()
    assert job["reward"] == 98.0


async def test_autonomous_stays_open_above_max_price(client):
    """
    AggressiveBot (30% discount): offers 70.0, max_price=80.0.
    Job owner counters with 90.0 > 80.0 → stays open (no auto-accept).
    """
    job_id, _, bot_id, _ = await _setup(client)

    as_user(BOT_OWNER)
    await client.post(f"/jobs/{job_id}/negotiate", json={
        "bot_id": bot_id,
        "price": 70.0,
        "bot_autonomy": True,
        "max_price": 80.0,
    })

    as_user(JOB_OWNER)
    resp = await client.post(f"/jobs/{job_id}/counter", json={"price": 90.0})
    assert resp.status_code == 200
    # Counter is above max_price → NOT auto-accepted
    assert resp.json()["status"] == "open"
    assert resp.json()["current_price"] == 90.0


async def test_autonomous_exact_max_price(client):
    """Counter exactly at max_price should auto-accept (≤ max_price)."""
    job_id, _, _, bot_id = await _setup(client)

    as_user(BOT_OWNER)
    await client.post(f"/jobs/{job_id}/negotiate", json={
        "bot_id": bot_id,
        "price": 75.0,
        "bot_autonomy": True,
        "max_price": 85.0,
    })

    as_user(JOB_OWNER)
    resp = await client.post(f"/jobs/{job_id}/counter", json={"price": 85.0})
    assert resp.json()["status"] == "accepted"


async def test_non_autonomous_bot_requires_manual_accept(client):
    """Without bot_autonomy, counter does NOT auto-accept."""
    job_id, bot_id, *_ = await _setup(client)

    as_user(BOT_OWNER)
    await client.post(f"/jobs/{job_id}/negotiate", json={
        "bot_id": bot_id,
        "price": 80.0,
        "bot_autonomy": False,
    })

    as_user(JOB_OWNER)
    resp = await client.post(f"/jobs/{job_id}/counter", json={"price": 90.0})
    assert resp.json()["status"] == "open"  # still open, needs manual accept


# ─────────────────────────── Competing Bots ────────────────────────────────

async def test_multiple_bots_compete(client):
    """Three bots with different strategies all negotiate on the same job."""
    job_id, bot_a, bot_b, bot_c = await _setup(client)

    as_user(BOT_OWNER)
    # Conservative: 5% off
    r_a = await client.post(f"/jobs/{job_id}/negotiate", json={"bot_id": bot_a, "price": 95.0})
    # Aggressive: 30% off
    r_b = await client.post(f"/jobs/{job_id}/negotiate", json={"bot_id": bot_b, "price": 70.0})
    # Dynamic: 15% off
    r_c = await client.post(f"/jobs/{job_id}/negotiate", json={"bot_id": bot_c, "price": 85.0})

    assert r_a.status_code == 201
    assert r_b.status_code == 201
    assert r_c.status_code == 201

    resp = await client.get(f"/jobs/{job_id}/negotiation")
    assert len(resp.json()) == 3

    prices = {n["current_price"] for n in resp.json()}
    assert prices == {95.0, 70.0, 85.0}


async def test_negotiate_nonexistent_job(client):
    as_user(BOT_OWNER)
    bot = await _register_bot(client, BOT_A)
    resp = await client.post(
        "/jobs/00000000-0000-0000-0000-000000000000/negotiate",
        json={"bot_id": bot["id"], "price": 50.0},
    )
    assert resp.status_code == 404
