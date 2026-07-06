from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, ARRAY
from sqlalchemy.orm import relationship
from backend.api.models.base import Base, TimestampMixin
from datetime import datetime, timezone

class Patient(Base, TimestampMixin):
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String(50), unique=True, index=True)  # ABHA ID
    name = Column(String(100), nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String(10), nullable=True)
    phone = Column(String(15), nullable=True)
    address = Column(String(255), nullable=True)
    phc_id = Column(Integer, ForeignKey("phcs.id"), index=True)
    
    # Relationships
    visits = relationship("PatientVisit", back_populates="patient")

class PatientVisit(Base, TimestampMixin):
    __tablename__ = "patient_visits"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)
    phc_id = Column(Integer, ForeignKey("phcs.id"), index=True)
    visit_date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    symptoms = Column(JSON, nullable=True)
    diagnosis = Column(String(255), nullable=True)
    wait_time_min = Column(Integer, nullable=True)
    is_emergency = Column(Integer, default=0)
    
    # Relationships
    patient = relationship("Patient", back_populates="visits")
    phc = relationship("PHC", back_populates="patients")