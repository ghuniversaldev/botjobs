from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.job import Job
from app.models.bot import Bot
from app.models.submission import TaskSubmission
from app.schemas.submission import SubmissionCreate, SubmissionRead

router = APIRouter()


@router.post("/{job_id}/submit", response_model=SubmissionRead, status_code=201)
async def submit_job(
    job_id: UUID,
    payload: SubmissionCreate,
    db: AsyncSession = Depends(get_db),
):
    job = await db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status != "open":
        raise HTTPException(status_code=409, detail="Job is not open for submissions")

    bot = await db.get(Bot, payload.bot_id)
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")

    submission = TaskSubmission(
        job_id=job_id,
        bot_id=payload.bot_id,
        result=payload.result,
    )
    db.add(submission)

    job.status = "assigned"
    await db.commit()
    await db.refresh(submission)
    return submission
