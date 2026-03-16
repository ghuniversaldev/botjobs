from uuid import UUID
from datetime import datetime
from typing import Any
from pydantic import BaseModel


class SubmissionCreate(BaseModel):
    bot_id: UUID
    result: Any  # flexible JSON output


class SubmissionRead(SubmissionCreate):
    id: UUID
    job_id: UUID
    status: str
    timestamp: datetime

    class Config:
        from_attributes = True
