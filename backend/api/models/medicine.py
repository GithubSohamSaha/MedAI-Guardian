from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.api.models.base import Base, TimestampMixin
from datetime import datetime, timezone

class Medicine(Base, TimestampMixin):
    __tablename__ = "medicines"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    code = Column(String(50), nullable=True, index=True)
    category = Column(String(50), nullable=True)
    current_stock = Column(Integer, default=0)
    reorder_level = Column(Integer, default=50)
    buffer_stock = Column(Integer, default=25)
    unit = Column(String(20), default="strips")
    price_per_unit = Column(Float, nullable=True)
    last_updated = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    phc_id = Column(Integer, ForeignKey("phcs.id"), index=True)
    is_active = Column(Integer, default=1)
    
    # Relationships
    phc = relationship("PHC", back_populates="medicines")
    transactions = relationship("StockTransaction", back_populates="medicine")

class StockTransaction(Base, TimestampMixin):
    __tablename__ = "stock_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    medicine_id = Column(Integer, ForeignKey("medicines.id"), index=True)
    quantity_change = Column(Integer, nullable=False)  # positive=add, negative=consume
    transaction_type = Column(String(20))  # daily_update, receipt, transfer, consumption
    recorded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    user_id = Column(Integer, ForeignKey("users.id"))
    notes = Column(String(255), nullable=True)
    
    # Relationships
    medicine = relationship("Medicine", back_populates="transactions")
    user = relationship("User", back_populates="stock_transactions")