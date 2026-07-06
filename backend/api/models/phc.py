from sqlalchemy import Column, Integer, String, Float, Boolean
from sqlalchemy.orm import relationship
from backend.api.models.base import Base, TimestampMixin

class PHC(Base, TimestampMixin):
    __tablename__ = "phcs"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    district = Column(String(50), nullable=False, index=True)
    block = Column(String(50), nullable=True)
    address = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)
    health_score = Column(Integer, default=0)  # 0-100
    
    # Relationships
    users = relationship("User", back_populates="phc")
    medicines = relationship("Medicine", back_populates="phc")
    patients = relationship("PatientVisit", back_populates="phc")
    beds = relationship("Bed", back_populates="phc")
    doctors = relationship("Doctor", back_populates="phc")
    alerts = relationship("Alert", back_populates="phc")