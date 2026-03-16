from uuid import UUID
from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel


class ActivityLogRead(BaseModel):
    id: UUID
    user_id: str
    job_id: Optional[str] = None
    bot_id: Optional[str] = None
    action: str
    log_data: Any = None
    timestamp: datetime

    class Config:
        from_attributes = True
