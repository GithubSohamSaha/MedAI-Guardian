from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from backend.api.models.base import Base, TimestampMixin
from datetime import datetime, timezone

class Doctor(Base, TimestampMixin):
    __tablename__ = "doctors"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    specialization = Column(String(50), nullable=True)
    phone = Column(String(15), nullable=True)
    email = Column(String(120), nullable=True)
    attendance_rate = Column(Float, default=0.0)
    phc_id = Column(Integer, ForeignKey("phcs.id"), index=True)
    is_active = Column(Integer, default=1)
    
    # Relationships
    phc = relationship("PHC", back_populates="doctors")
    attendance_records = relationship("DoctorAttendance", back_populates="doctor")

class DoctorAttendance(Base, TimestampMixin):
    __tablename__ = "doctor_attendance"
    
    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), index=True)
    date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    present = Column(Boolean, default=False)
    check_in_time = Column(DateTime(timezone=True), nullable=True)
    check_out_time = Column(DateTime(timezone=True), nullable=True)
    predicted_absent = Column(Boolean, default=False)
    
    # Relationships
    doctor = relationship("Doctor", back_populates="attendance_records")