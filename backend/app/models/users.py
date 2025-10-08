from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON, ARRAY, JSON, Table, Text
from datetime import datetime, timezone
from .__init__ import Base

class User(Base):
    __tablename__ = "user"
    id = Column(Integer, unique=True, primary_key=True)
    password = Column(String(255), nullable=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(20), unique=True, nullable=True, index=True)
    first_name = Column(String(255), nullable=True)
    last_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    subscription_level = Column(Integer, default=0)
    date_joined = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))

    state = Column(String, unique=True, index=True)
    state_created_at = Column(DateTime(timezone=True)) 

    refresh = Column(Text, nullable=True)

