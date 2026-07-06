from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
from backend.api.models.base import Base, TimestampMixin
from datetime import datetime, timezone
import enum

class AlertType(str, enum.Enum):
    STOCK_OUT = "stock_out"
    PATIENT_SURGE = "patient_surge"
    BED_SHORTAGE = "bed_shortage"
    DOCTOR_ABSENT = "doctor_absent"
    DISEASE_OUTBREAK = "disease_outbreak"

class AlertSeverity(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class Alert(Base, TimestampMixin):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    alert_type = Column(Enum(AlertType), nullable=False)
    severity = Column(Enum(AlertSeverity), default=AlertSeverity.MEDIUM)
    title = Column(String(200), nullable=False)
    description = Column(String(500), nullable=True)
    phc_id = Column(Integer, ForeignKey("phcs.id"), index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    phc = relationship("PHC", back_populates="alerts")
    user = relationship("User", back_populates="alerts")