from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.api.models.base import Base, TimestampMixin
from datetime import datetime, timezone

class Bed(Base, TimestampMixin):
    __tablename__ = "beds"
    
    id = Column(Integer, primary_key=True, index=True)
    bed_type = Column(String(20))  # ICU, General, Oxygen, Pediatric
    total = Column(Integer, default=0)
    occupied = Column(Integer, default=0)
    available = Column(Integer, default=0)
    last_updated = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    phc_id = Column(Integer, ForeignKey("phcs.id"), index=True)
    
    # Relationships
    phc = relationship("PHC", back_populates="beds")