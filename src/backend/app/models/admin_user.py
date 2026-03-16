from sqlalchemy import Column, String
from app.database import Base


class AdminUser(Base):
    __tablename__ = "admin_users"

    user_id = Column(String, primary_key=True)
