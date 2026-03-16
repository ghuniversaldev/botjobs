import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    required_skills = Column(ARRAY(String), default=[])
    reward = Column(Float, nullable=False)
    status = Column(String, default="open")  # open | assigned | completed | cancelled
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
