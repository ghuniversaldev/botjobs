# BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
# SPDX-License-Identifier: GPL-3.0-only
# This file is part of BotJobs.ch, licensed under the GNU GPL v3.
# See LICENSE file in the project root for full license text.

from datetime import datetime
from uuid import UUID
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.auth import CurrentUser
from app.models.job import Job
from app.models.negotiation import Negotiation
from app.schemas.negotiation import NegotiationOffer, NegotiationCounter, NegotiationRead
from app.services import activity

router = APIRouter()


@router.post("/{job_id}/negotiate", response_model=NegotiationRead, status_code=201)
async def make_offer(
    job_id: UUID,
    payload: NegotiationOffer,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Bot owner makes an initial price offer for a job."""
    job = await db.get(Job, str(job_id))
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status != "open":
        raise HTTPException(status_code=409, detail="Job is not open for negotiation")

    # Only one active negotiation per bot per job
    existing = await db.execute(
        select(Negotiation).where(
            Negotiation.job_id == str(job_id),
            Negotiation.bot_id == payload.bot_id,
            Negotiation.status == "open",
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Active negotiation already exists")

    history = [{"actor": "bot", "price": payload.price, "timestamp": datetime.utcnow().isoformat()}]
    neg = Negotiation(
        job_id=str(job_id),
        bot_id=payload.bot_id,
        initial_price=payload.price,
        current_price=payload.price,
        history=history,
        bot_autonomy=payload.bot_autonomy,
        max_price=payload.max_price,
        min_price=payload.min_price,
    )
    db.add(neg)
    await activity.log(db, user_id=user.id, action="negotiation_started",
                       job_id=str(job_id), bot_id=payload.bot_id,
                       metadata={"price": payload.price})
    await db.commit()
    await db.refresh(neg)
    return neg


@router.post("/{job_id}/counter", response_model=NegotiationRead)
async def counter_offer(
    job_id: UUID,
    payload: NegotiationCounter,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Job owner makes a counter offer."""
    job = await db.get(Job, str(job_id))
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Only the job owner can counter")

    result = await db.execute(
        select(Negotiation).where(
            Negotiation.job_id == str(job_id),
            Negotiation.status == "open",
        ).order_by(Negotiation.created_at.desc())
    )
    neg = result.scalar_one_or_none()
    if not neg:
        raise HTTPException(status_code=404, detail="No open negotiation for this job")

    history = list(neg.history or [])
    history.append({"actor": "user", "price": payload.price, "timestamp": datetime.utcnow().isoformat()})
    neg.current_price = payload.price
    neg.history = history

    # Bot autonomy: auto-accept if price is within bot's range
    if neg.bot_autonomy and neg.max_price and payload.price <= neg.max_price:
        neg.status = "accepted"
        job.reward = payload.price

    await db.commit()
    await db.refresh(neg)
    return neg


@router.post("/{job_id}/negotiation/accept", response_model=NegotiationRead)
async def accept_negotiation(
    job_id: UUID,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Bot owner accepts the current price."""
    result = await db.execute(
        select(Negotiation).where(
            Negotiation.job_id == str(job_id),
            Negotiation.status == "open",
        ).order_by(Negotiation.created_at.desc())
    )
    neg = result.scalar_one_or_none()
    if not neg:
        raise HTTPException(status_code=404, detail="No open negotiation found")

    neg.status = "accepted"
    job = await db.get(Job, str(job_id))
    if job:
        job.reward = neg.current_price

    await activity.log(db, user_id=user.id, action="negotiation_accepted",
                       job_id=str(job_id), metadata={"final_price": neg.current_price})
    await db.commit()
    await db.refresh(neg)
    return neg


@router.post("/{job_id}/negotiation/reject", response_model=NegotiationRead)
async def reject_negotiation(
    job_id: UUID,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Reject/cancel the current negotiation."""
    result = await db.execute(
        select(Negotiation).where(
            Negotiation.job_id == str(job_id),
            Negotiation.status == "open",
        ).order_by(Negotiation.created_at.desc())
    )
    neg = result.scalar_one_or_none()
    if not neg:
        raise HTTPException(status_code=404, detail="No open negotiation found")

    neg.status = "rejected"
    await db.commit()
    await db.refresh(neg)
    return neg


@router.get("/{job_id}/negotiation", response_model=List[NegotiationRead])
async def get_negotiations(
    job_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get all negotiations for a job."""
    result = await db.execute(
        select(Negotiation)
        .where(Negotiation.job_id == str(job_id))
        .order_by(Negotiation.created_at.desc())
    )
    return result.scalars().all()
