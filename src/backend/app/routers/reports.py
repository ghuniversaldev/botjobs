# BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
# SPDX-License-Identifier: GPL-3.0-only
# This file is part of BotJobs.ch, licensed under the GNU GPL v3.
# See LICENSE file in the project root for full license text.

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.auth import CurrentUser
from app.models.job import Job
from app.models.bot import Bot
from app.models.submission import TaskSubmission
from app.models.transaction import Transaction
from app.models.admin_user import AdminUser
from app.schemas.job import JobRead
from app.schemas.bot import BotRead

router = APIRouter()


async def _require_admin(user: CurrentUser, db: AsyncSession):
    admin = await db.get(AdminUser, user.id)
    if not admin:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Admin access required")


@router.get("/metrics")
async def user_metrics(user: CurrentUser, db: AsyncSession = Depends(get_db)):
    """Metrics for the current user."""
    jobs_result = await db.execute(select(Job).where(Job.owner_id == user.id))
    jobs = jobs_result.scalars().all()

    bots_result = await db.execute(select(Bot).where(Bot.owner == user.id))
    bots = bots_result.scalars().all()
    bot_ids = [str(b.id) for b in bots]

    submissions_result = await db.execute(
        select(TaskSubmission).where(TaskSubmission.bot_id.in_([b.id for b in bots]))
    ) if bot_ids else None
    submissions = submissions_result.scalars().all() if submissions_result else []

    accepted = [s for s in submissions if s.status == "accepted"]
    success_rate = round(len(accepted) / len(submissions) * 100, 1) if submissions else 0.0

    completed_jobs = [j for j in jobs if j.status == "completed"]

    # spending: sum of transactions where user is payer
    spending_result = await db.execute(
        select(func.sum(Transaction.amount)).where(Transaction.payer_id == user.id)
    )
    total_spending = spending_result.scalar() or 0.0

    # earnings: sum of net_amount for transactions where user's bots are payees
    earnings_result = await db.execute(
        select(func.sum(Transaction.net_amount)).where(Transaction.payee_id == user.id)
    )
    total_earnings = earnings_result.scalar() or 0.0

    return {
        "jobs_total": len(jobs),
        "jobs_open": len([j for j in jobs if j.status == "open"]),
        "jobs_completed": len(completed_jobs),
        "bots_total": len(bots),
        "submissions_total": len(submissions),
        "submissions_accepted": len(accepted),
        "success_rate": success_rate,
        "total_spending": round(total_spending, 2),
        "total_earnings": round(total_earnings, 2),
    }


@router.get("/admin")
async def admin_metrics(user: CurrentUser, db: AsyncSession = Depends(get_db)):
    """Platform-wide metrics — admin only."""
    await _require_admin(user, db)

    total_jobs = (await db.execute(select(func.count()).select_from(Job))).scalar()
    total_bots = (await db.execute(select(func.count()).select_from(Bot))).scalar()
    total_submissions = (await db.execute(select(func.count()).select_from(TaskSubmission))).scalar()
    accepted_submissions = (await db.execute(
        select(func.count()).select_from(TaskSubmission).where(TaskSubmission.status == "accepted")
    )).scalar()
    completed_jobs = (await db.execute(
        select(func.count()).select_from(Job).where(Job.status == "completed")
    )).scalar()

    all_jobs = (await db.execute(select(Job).order_by(Job.created_at.desc()).limit(100))).scalars().all()
    all_bots = (await db.execute(select(Bot).order_by(Bot.created_at.desc()).limit(100))).scalars().all()

    return {
        "stats": {
            "total_jobs": total_jobs,
            "total_bots": total_bots,
            "total_submissions": total_submissions,
            "accepted_submissions": accepted_submissions,
            "completed_jobs": completed_jobs,
            "completion_rate": round(completed_jobs / total_jobs * 100, 1) if total_jobs else 0.0,
        },
        "recent_jobs": [JobRead.model_validate(j) for j in all_jobs],
        "recent_bots": [BotRead.model_validate(b) for b in all_bots],
    }
