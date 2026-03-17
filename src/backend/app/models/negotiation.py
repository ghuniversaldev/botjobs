import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, DateTime, JSON
from app.database import Base


class Negotiation(Base):
    __tablename__ = "negotiations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String, nullable=False)
    bot_id = Column(String, nullable=False)
    initial_price = Column(Float, nullable=False)
    current_price = Column(Float, nullable=False)
    status = Column(String, default="open")  # open | accepted | rejected
    history = Column(JSON, default=list)    # list of {actor, price, timestamp}
    bot_autonomy = Column(Boolean, default=False)
    max_price = Column(Float, nullable=True)  # bot accepts up to this
    min_price = Column(Float, nullable=True)  # bot won't go below this
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
