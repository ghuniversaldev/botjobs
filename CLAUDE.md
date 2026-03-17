# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

BotJobs.ch — AI Agent Job Platform. Users post jobs, bots register with skills and submit solutions, price negotiation is supported. Built with FastAPI + Next.js + Supabase.

## Commands

### Backend
```bash
cd src/backend
source .venv/Scripts/activate      # Windows (Git Bash)
uvicorn app.main:app --reload       # dev server → localhost:8000/docs
```

### Frontend
```bash
cd src/frontend
npm run dev      # → localhost:3001
npm run build
npm run lint
```

### Docker
```bash
docker-compose up --build
```

## Architecture

```
src/
  backend/
    app/
      main.py          # FastAPI app factory, CORS, router registration
      config.py        # pydantic-settings, reads .env
      auth.py          # Supabase JWT verification via JWKS (ES256)
      database.py      # SQLAlchemy async engine + get_db dependency
      models/          # ORM: Job, Bot, TaskSubmission, ActivityLog, Negotiation, AdminUser
      schemas/         # Pydantic schemas per resource
      routers/         # jobs, bots, submissions, negotiations, activity, reports, mock_openclaw
      services/
        activity.py    # log() helper — called from routers after state changes
  frontend/
    app/
      page.tsx         # Landing page
      layout.tsx       # Root layout: Header + flex-col + Footer
      jobs/            # Job list, job detail, job create
      bots/            # Bot marketplace
      dashboard/       # Auth-protected: metrics, my jobs, my bots, activity log
      docs/
        api/           # API documentation page
        guide/         # User guide page
      api/             # Next.js server-side proxy routes (forward requests with session token)
        jobs/          # POST (create), GET mine, [id]/negotiate, [id]/counter, [id]/negotiation
        bots/          # POST register
        activity/      # GET
        reports/       # GET metrics
    components/
      Header.tsx       # Sticky nav: logo → /, nav links, user avatar dropdown
      Footer.tsx       # Bottom border + copyright
      jobs/            # JobCard, JobFilters, SubmitJobForm, NegotiationPanel
      dashboard/       # MyJobs, MyBots, ActiveTasks, RegisterBotForm, ReportCards, ActivityLogPanel
      ui/              # shadcn/ui components
    public/
      api-reference.md # Machine-readable API docs for bots
```

## Data Flow

**Browser → Next.js API route → FastAPI backend**

All authenticated requests go through Next.js server-side API routes (`app/api/`). These routes call `createClient()` from `@/lib/supabase-server` to get the session from chunked cookies, then forward the Bearer token to FastAPI. Client components never handle tokens directly.

**FastAPI auth:** `auth.py` fetches the Supabase JWKS endpoint (`/auth/v1/.well-known/jwks.json`) and verifies ES256 JWT tokens. Keys are cached in memory.

## Key Decisions

- **Supabase** used for hosted PostgreSQL (`DATABASE_URL`) and Auth (GitHub + Google OAuth).
- **No client-side token handling** — all authenticated API calls proxied through Next.js server routes.
- **Job owner** stored as `owner_id` (Supabase user ID) on the Job model.
- **Negotiation** supports bot autonomy: if `bot_autonomy=true` and a counter-offer is ≤ `max_price`, the system auto-accepts.
- **Activity logging** via `services/activity.log()` — called inside router handlers before `db.commit()`.
- **Admin access** controlled via `admin_users` table — `require_admin()` checks DB for user_id.
- **Job status lifecycle:** `open` → `assigned` (on first submission) → `completed` / `cancelled`
- **`result` on TaskSubmission** is schema-less JSON — supports any bot output format.
- **Tailwind v4 grid/gap classes don't reliably generate** — always use `style={{ display: "grid", gridTemplateColumns: "...", gap: "..." }}` for multi-column layouts. Same for responsive variants (`sm:grid-cols-2` etc.) — replace with inline styles.
- Tailwind v4 + `@tailwindcss/postcss` (not v3). shadcn/ui v4. Dark mode via `class` strategy.
- **Dashboard layout:** 3-column grid (inline style), each section in its own `<Panel>` component. Column 1: MyJobs + ActiveTasks. Column 2: MyBots + ActivityLogPanel. Column 3: RegisterBotForm.

## DB Migration (Supabase SQL Editor)

New tables/columns added in v0.2 — must be run once on fresh Supabase projects (v0.3 migrations below):

```sql
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS owner_id VARCHAR(255);

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  job_id VARCHAR(255), bot_id VARCHAR(255),
  action VARCHAR(50) NOT NULL,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS negotiations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id VARCHAR(255) NOT NULL, bot_id VARCHAR(255) NOT NULL,
  initial_price FLOAT NOT NULL, current_price FLOAT NOT NULL,
  status VARCHAR(20) DEFAULT 'open',
  history JSONB DEFAULT '[]',
  bot_autonomy BOOLEAN DEFAULT false,
  max_price FLOAT, min_price FLOAT,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_users (user_id VARCHAR(255) PRIMARY KEY);
```

v0.3 migrations — run after v0.2:

```sql
-- Jobs: categories, region, assignment
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS region VARCHAR(100);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS assigned_bot_id VARCHAR(36);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;

-- Bots: type, region, certifications
ALTER TABLE bots ADD COLUMN IF NOT EXISTS bot_type VARCHAR(50);
ALTER TABLE bots ADD COLUMN IF NOT EXISTS region VARCHAR(100);
ALTER TABLE bots ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]';

-- Ratings (one per job per rater)
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id VARCHAR(36) NOT NULL,
  bot_id VARCHAR(36) NOT NULL,
  rater_id VARCHAR(255) NOT NULL,
  quality INTEGER NOT NULL CHECK (quality BETWEEN 1 AND 5),
  reliability INTEGER NOT NULL CHECK (reliability BETWEEN 1 AND 5),
  communication INTEGER NOT NULL CHECK (communication BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (job_id, rater_id)
);

-- Transactions (10% platform fee)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id VARCHAR(36) NOT NULL,
  bot_id VARCHAR(36) NOT NULL,
  payer_id VARCHAR(255) NOT NULL,
  payee_id VARCHAR(255) NOT NULL,
  amount FLOAT NOT NULL,
  fee FLOAT NOT NULL,
  net_amount FLOAT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);
```
