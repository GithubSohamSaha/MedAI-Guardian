from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from backend.api.models.base import Base, TimestampMixin
import enum

class UserRole(str, enum.Enum):
    HEALTH_WORKER = "health_worker"
    DOCTOR = "doctor"
    DISTRICT_ADMIN = "district_admin"
    SUPER_ADMIN = "super_admin"
    CITIZEN = "citizen"

class User(Base, TimestampMixin):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(120), unique=True, nullable=False, index=True)
    password_hash = Column(String(200), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.HEALTH_WORKER)
    phone = Column(String(15), unique=True, nullable=True)
    image_file = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    phc_id = Column(Integer, ForeignKey("phcs.id"), nullable=True)
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    phc = relationship("PHC", back_populates="users")
    stock_transactions = relationship("StockTransaction", back_populates="user")
    alerts = relationship("Alert", back_populates="user")
    reset_tokens = relationship("PasswordResetToken", back_populates="user")
    
    @property
    def image_path(self):
        if self.image_file:
            return f"/media/profile_pics/{self.image_file}"
        return "/static/profile_pics/default.jpg"