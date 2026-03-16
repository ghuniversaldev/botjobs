from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.auth import CurrentUser
from app.models.job import Job
from app.schemas.job import JobCreate, JobRead
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
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Job)
    if status:
        query = query.where(Job.status == status)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{job_id}", response_model=JobRead)
async def get_job(job_id: UUID, db: AsyncSession = Depends(get_db)):
    job = await db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
