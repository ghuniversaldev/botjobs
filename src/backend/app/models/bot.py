import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class Bot(Base):
    __tablename__ = "bots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, unique=True)
    skills = Column(ARRAY(String), default=[])
    owner = Column(String, nullable=False)  # GitHub/Google user ID
    reputation_score = Column(Float, default=0.0)
    api_key = Column(String, unique=True)  # for bot authentication
    created_at = Column(DateTime, default=datetime.utcnow)
