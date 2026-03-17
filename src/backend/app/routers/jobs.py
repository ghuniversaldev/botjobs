# BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
# SPDX-License-Identifier: GPL-3.0-only
# This file is part of BotJobs.ch, licensed under the GNU GPL v3.
# See LICENSE file in the project root for full license text.

from datetime import datetime
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.auth import CurrentUser
from app.models.job import Job
from app.models.bot import Bot
from app.models.submission import TaskSubmission
from app.models.rating import Rating
from app.models.transaction import Transaction
from app.schemas.job import JobCreate, JobRead, AssignRequest, ValidateRequest, RateRequest
from app.schemas.rating import RatingRead
from app.schemas.transaction import TransactionRead
from app.services import activity

router = APIRouter()


@router.post("/", response_model=JobRead, status_code=201)
async def create_job(
    payload: JobCreate,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    job = Job(**payload.model_dump(), owner_id=user.id)
    db.add(job)
    await activity.log(db, user_id=user.id, action="job_created",
                       job_id=None, metadata={"title": payload.title})
    await db.commit()
    await db.refresh(job)
    return job


@router.get("/me", response_model=List[JobRead])
async def my_jobs(user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Job).where(Job.owner_id == user.id).order_by(Job.created_at.desc()))
    return result.scalars().all()


@router.get("/", response_model=List[JobRead])
async def list_jobs(
    status: Optional[str] = None,
    category: Optional[str] = None,
    region: Optional[str] = None,
    min_reward: Optional[float] = None,
    max_reward: Optional[float] = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Job)
    if status:
        query = query.where(Job.status == status)
    if category:
        query = query.where(Job.category == category)
    if region:
        query = query.where(Job.region == region)
    if min_reward is not None:
        query = query.where(Job.reward >= min_reward)
    if max_reward is not None:
        query = query.where(Job.reward <= max_reward)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{job_id}", response_model=JobRead)
async def get_job(job_id: UUID, db: AsyncSession = Depends(get_db)):
    job = await db.get(Job, str(job_id))
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/{job_id}/submissions")
async def job_submissions(
    job_id: UUID,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Returns all submissions for a job — accessible to the job owner."""
    job = await db.get(Job, str(job_id))
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Only the job owner can view all submissions")

    result = await db.execute(
        select(TaskSubmission).where(TaskSubmission.job_id == str(job_id))
    )
    subs = result.scalars().all()
    return [
        {
            "id": s.id, "job_id": s.job_id, "bot_id": s.bot_id,
            "result": s.result, "status": s.status,
            "timestamp": s.timestamp.isoformat() if s.timestamp else None,
        }
        for s in subs
    ]


@router.post("/{job_id}/assign", status_code=200)
async def assign_bot(
    job_id: UUID,
    payload: AssignRequest,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Job owner assigns a specific bot to the job."""
    job = await db.get(Job, str(job_id))
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Only the job owner can assign a bot")
    if job.status not in ("open",):
        raise HTTPException(status_code=409, detail="Job must be open to assign a bot")

    bot = await db.get(Bot, str(payload.bot_id))
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")

    job.assigned_bot_id = str(payload.bot_id)
    job.assigned_at = datetime.utcnow()
    job.status = "assigned"

    await activity.log(db, user_id=user.id, action="job_assigned",
                       job_id=str(job_id), metadata={"bot_id": str(payload.bot_id)})
    await db.commit()
    return {"status": "assigned", "bot_id": str(payload.bot_id)}


@router.post("/{job_id}/validate", status_code=200)
async def validate_submission(
    job_id: UUID,
    payload: ValidateRequest,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Job owner accepts or rejects a submission. Accept creates a transaction and completes the job."""
    job = await db.get(Job, str(job_id))
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Only the job owner can validate")
    if job.status == "completed":
        raise HTTPException(status_code=409, detail="Job already completed")

    submission = await db.get(TaskSubmission, str(payload.submission_id))
    if not submission or str(submission.job_id) != str(job_id):
        raise HTTPException(status_code=404, detail="Submission not found for this job")

    if payload.action == "accept":
        submission.status = "accepted"
        job.status = "completed"

        # Find bot owner for transaction
        bot = await db.get(Bot, str(submission.bot_id))
        fee = round(job.reward * 0.10, 2)
        tx = Transaction(
            job_id=str(job_id),
            bot_id=str(submission.bot_id),
            payer_id=user.id,
            payee_id=bot.owner if bot else "",
            amount=job.reward,
            fee=fee,
            net_amount=round(job.reward - fee, 2),
            status="pending",
        )
        db.add(tx)
        await activity.log(db, user_id=user.id, action="submission_accepted",
                           job_id=str(job_id), metadata={"submission_id": str(payload.submission_id)})
    else:
        submission.status = "rejected"
        await activity.log(db, user_id=user.id, action="submission_rejected",
                           job_id=str(job_id), metadata={"submission_id": str(payload.submission_id)})

    await db.commit()
    return {"status": submission.status}


@router.post("/{job_id}/rate", response_model=RatingRead, status_code=201)
async def rate_bot(
    job_id: UUID,
    payload: RateRequest,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Job owner rates the bot after job completion (one rating per job)."""
    job = await db.get(Job, str(job_id))
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Only the job owner can rate")
    if job.status != "completed":
        raise HTTPException(status_code=409, detail="Job must be completed to rate")
    if not job.assigned_bot_id:
        raise HTTPException(status_code=409, detail="No bot assigned to this job")

    # Check for duplicate rating
    existing = await db.execute(
        select(Rating).where(Rating.job_id == str(job_id), Rating.rater_id == user.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Already rated this job")

    rating = Rating(
        job_id=str(job_id),
        bot_id=job.assigned_bot_id,
        rater_id=user.id,
        **payload.model_dump(),
    )
    db.add(rating)

    # Update bot reputation_score = average across all dimensions of all ratings
    all_ratings_result = await db.execute(
        select(Rating).where(Rating.bot_id == job.assigned_bot_id)
    )
    all_ratings = all_ratings_result.scalars().all()
    scores = [r.quality + r.reliability + r.communication for r in all_ratings]
    scores.append(payload.quality + payload.reliability + payload.communication)
    avg = sum(scores) / (len(scores) * 3)  # normalise to 1–5

    bot = await db.get(Bot, job.assigned_bot_id)
    if bot:
        bot.reputation_score = round(avg, 2)

    await activity.log(db, user_id=user.id, action="bot_rated",
                       job_id=str(job_id), metadata={"bot_id": job.assigned_bot_id})
    await db.commit()
    await db.refresh(rating)
    return rating
