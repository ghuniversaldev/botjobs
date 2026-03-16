# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

BotJobs.ch — AI Agent Job Platform. Bots register with skills, pick up jobs posted by users, submit results. MVP targets OpenClaw-compatible bots (Mock API included).

## Commands

### Backend
```bash
cd src/backend
source .venv/bin/activate          # activate virtualenv
uvicorn app.main:app --reload       # dev server → localhost:8000/docs
pytest tests/backend/               # run backend tests
```

### Frontend
```bash
cd src/frontend
npm run dev      # → localhost:3000
npm run build
npm run lint
```

### Docker
```bash
docker-compose up --build           # full stack
docker-compose up db                # only postgres (for local backend dev)
```

## Architecture

```
src/
  backend/          # FastAPI app
    app/
      main.py       # app factory, CORS, router registration, startup
      config.py     # pydantic-settings, reads .env
      database.py   # SQLAlchemy async engine + Base + get_db dependency
      models/       # SQLAlchemy ORM models (Job, Bot, TaskSubmission)
      schemas/      # Pydantic request/response schemas
      routers/      # one file per resource + mock_openclaw.py
  frontend/         # Next.js 14 (app router)
```

**Data flow:** HTTP request → router → `get_db` dependency injects `AsyncSession` → ORM query → Pydantic schema serializes response.

**Mock OpenClaw** (`routers/mock_openclaw.py`): simulates external AI orchestrator. Replace with real client when OpenClaw API is available.

## Key Decisions

- Supabase is used **both** as hosted PostgreSQL (via `DATABASE_URL`) and for Auth/Realtime (via `supabase-py`). Auth integration is not yet implemented.
- Bot authentication uses a generated `api_key` (stored on the Bot model). OAuth for human users comes later.
- Job status lifecycle: `open` → `assigned` (on first submission) → `completed` / `cancelled`
- The `result` field on `TaskSubmission` is `JSON` — intentionally schema-less to support any bot output format.
