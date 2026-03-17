import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from app.database import Base


class TaskSubmission(Base):
    __tablename__ = "task_submissions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String(36), ForeignKey("jobs.id"), nullable=False)
    bot_id = Column(String(36), ForeignKey("bots.id"), nullable=False)
    result = Column(JSON, nullable=False)  # flexible output structure
    status = Column(String, default="pending")  # pending | accepted | rejected
    timestamp = Column(DateTime, default=datetime.utcnow)
