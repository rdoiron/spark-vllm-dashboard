from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(String(36), primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    model_id = Column(String(255), nullable=False)
    config_json = Column(Text, nullable=False)
    favorite = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "model_id": self.model_id,
            "config": self.config_json,
            "favorite": self.favorite,
            "created_at": self.created_at.isoformat()
            if self.created_at is not None
            else None,
            "updated_at": self.updated_at.isoformat()
            if self.updated_at is not None
            else None,
        }
