"""Tests for bot registration and management."""
import pytest
from tests.conftest import as_user, no_auth, BOT_OWNER, JOB_OWNER

BOT_PAYLOAD = {
    "name": "InvoiceBot-v1",
    "skills": ["pdf-parsing", "ocr", "data-extraction"],
    "owner": BOT_OWNER.id,
}

CONSERVATIVE_BOT = {"name": "ConservativeBot", "skills": ["analysis"], "owner": BOT_OWNER.id}
AGGRESSIVE_BOT   = {"name": "AggressiveBot",   "skills": ["speed"],    "owner": BOT_OWNER.id}
DYNAMIC_BOT      = {"name": "DynamicBot",      "skills": ["ml", "nlp"], "owner": BOT_OWNER.id}


async def _register_bot(client, payload=None):
    as_user(BOT_OWNER)
    return await client.post("/bots/register", json=payload or BOT_PAYLOAD)


# ─────────────────────────── Register ──────────────────────────────────────

async def test_register_bot(client):
    resp = await _register_bot(client)
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == BOT_PAYLOAD["name"]
    assert data["skills"] == BOT_PAYLOAD["skills"]
    assert data["owner"] == BOT_OWNER.id
    assert data["reputation_score"] == 0.0
    assert "id" in data
    # api_key is returned once on registration
    assert "api_key" in data
    assert len(data["api_key"]) > 20


async def test_register_bot_unauthenticated(client):
    no_auth()
    resp = await client.post("/bots/register", json=BOT_PAYLOAD)
    assert resp.status_code == 401


async def test_register_bot_duplicate_name(client):
    await _register_bot(client)
    resp = await _register_bot(client)  # same name
    assert resp.status_code in (409, 500)  # unique constraint violation


async def test_register_bot_validates_name_length(client):
    as_user(BOT_OWNER)
    resp = await client.post("/bots/register", json={**BOT_PAYLOAD, "name": "X"})
    assert resp.status_code == 422  # min_length=2


async def test_register_three_strategy_bots(client):
    """Registers 3 bots with different negotiation strategies."""
    for payload in [CONSERVATIVE_BOT, AGGRESSIVE_BOT, DYNAMIC_BOT]:
        resp = await _register_bot(client, payload)
        assert resp.status_code == 201
        assert resp.json()["name"] == payload["name"]


# ─────────────────────────── List & Get ────────────────────────────────────

async def test_list_bots_empty(client):
    resp = await client.get("/bots/")
    assert resp.status_code == 200
    assert resp.json() == []


async def test_list_bots(client):
    await _register_bot(client)
    resp = await client.get("/bots/")
    assert resp.status_code == 200
    assert len(resp.json()) == 1


async def test_get_bot(client):
    create_resp = await _register_bot(client)
    bot_id = create_resp.json()["id"]

    resp = await client.get(f"/bots/{bot_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == bot_id


async def test_get_bot_not_found(client):
    resp = await client.get("/bots/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404


# ─────────────────────────── My Bots ───────────────────────────────────────

async def test_my_bots_returns_only_own(client):
    # BOT_OWNER registers a bot
    await _register_bot(client)

    # JOB_OWNER registers a bot under their own ID
    as_user(JOB_OWNER)
    await client.post("/bots/register", json={
        "name": "JobOwnerBot",
        "skills": ["analysis"],
        "owner": JOB_OWNER.id,
    })

    # BOT_OWNER should only see their own bots
    as_user(BOT_OWNER)
    resp = await client.get("/bots/me")
    assert resp.status_code == 200
    bots = resp.json()
    assert all(b["owner"] == BOT_OWNER.id for b in bots)


async def test_my_bots_unauthenticated(client):
    no_auth()
    resp = await client.get("/bots/me")
    assert resp.status_code == 401
