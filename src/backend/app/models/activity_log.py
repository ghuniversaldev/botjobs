import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String, nullable=False)
    job_id = Column(String, nullable=True)
    bot_id = Column(String, nullable=True)
    action = Column(String, nullable=False)  # job_created | bot_registered | job_submitted | job_completed | negotiation_started
    log_data = Column("metadata", JSON, default={})
    timestamp = Column(DateTime, default=datetime.utcnow)
