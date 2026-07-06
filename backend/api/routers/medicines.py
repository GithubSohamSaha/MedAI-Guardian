from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List, Optional
from datetime import datetime, timedelta, timezone

from backend.api.services.database import get_db
from backend.api.models.user import User
from backend.api.models.medicine import Medicine, StockTransaction
from backend.api.models.phc import PHC
from backend.api.models.alert import Alert, AlertType, AlertSeverity
from backend.api.schemas import (
    StockUpdate, StockForecast, MedicineCreate, MedicineResponse,
    StockTransactionResponse, BulkStockUpdate
)
from backend.api.services.auth import get_current_user
from ml.pipelines.stock_forecast.predict import predict_stockout
from backend.api.services.alerts import create_alert

router = APIRouter()

@router.post("/update-stock", response_model=StockTransactionResponse)
async def update_stock(
    update: StockUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update stock for a medicine (add or consume)."""
    # Get medicine
    result = await db.execute(
        select(Medicine).where(
            Medicine.id == update.medicine_id,
            Medicine.phc_id == current_user.phc_id
        )
    )
    medicine = result.scalar_one_or_none()
    if not medicine:
        raise HTTPException(404, "Medicine not found in this PHC")
    
    # Calculate new stock
    new_stock = medicine.current_stock + update.quantity
    if new_stock < 0:
        raise HTTPException(400, "Cannot reduce stock below zero")
    
    old_stock = medicine.current_stock
    medicine.current_stock = new_stock
    medicine.last_updated = datetime.now(timezone.utc)
    
    # Create transaction record
    transaction = StockTransaction(
        medicine_id=medicine.id,
        quantity_change=update.quantity,
        transaction_type=update.transaction_type or "manual",
        user_id=current_user.id,
        notes=update.notes
    )
    db.add(transaction)
    
    # Check if reorder needed
    if new_stock < medicine.reorder_level:
        # Create alert
        await create_alert(
            db=db,
            phc_id=medicine.phc_id,
            alert_type=AlertType.STOCK_OUT,
            severity=AlertSeverity.HIGH,
            title=f"Low Stock: {medicine.name}",
            description=f"Current stock: {new_stock}. Reorder level: {medicine.reorder_level}",
            user_id=current_user.id
        )
    
    await db.commit()
    await db.refresh(transaction)
    
    return transaction

@router.post("/bulk-update-stock")
async def bulk_update_stock(
    updates: BulkStockUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Bulk update stock for multiple medicines."""
    results = []
    for update in updates.updates:
        try:
            result = await update_stock(update, current_user, db)
            results.append({"success": True, "data": result})
        except Exception as e:
            results.append({"success": False, "error": str(e)})
    
    return {"results": results}

@router.get("/forecast", response_model=List[StockForecast])
async def get_forecast(
    phc_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get stock forecast for all medicines in a PHC."""
    target_phc_id = phc_id or current_user.phc_id
    if not target_phc_id:
        raise HTTPException(400, "PHC ID required")
    
    # Get medicines
    result = await db.execute(
        select(Medicine).where(Medicine.phc_id == target_phc_id)
    )
    medicines = result.scalars().all()
    
    forecasts = []
    for med in medicines:
        # Get daily consumption average (last 7 days)
        trans_result = await db.execute(
            select(func.avg(StockTransaction.quantity_change))
            .where(
                StockTransaction.medicine_id == med.id,
                StockTransaction.quantity_change < 0,  # consumption only
                StockTransaction.recorded_at >= datetime.now(timezone.utc) - timedelta(days=7)
            )
        )
        avg_consumption = abs(trans_result.scalar() or 0)
        
        # Predict days remaining
        days_left = predict_stockout(
            current_stock=med.current_stock,
            avg_consumption=avg_consumption,
            reorder_level=med.reorder_level
        )
        
        forecasts.append(StockForecast(
            medicine_id=med.id,
            medicine_name=med.name,
            current_stock=med.current_stock,
            avg_daily_consumption=avg_consumption,
            days_remaining=days_left,
            reorder_level=med.reorder_level,
            is_critical=days_left < 3
        ))
    
    return forecasts

@router.get("/critical", response_model=List[StockForecast])
async def get_critical_medicines(
    phc_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get only critical medicines (stock below reorder level)."""
    forecasts = await get_forecast(phc_id, current_user, db)
    return [f for f in forecasts if f.is_critical]

@router.post("/", response_model=MedicineResponse)
async def create_medicine(
    medicine: MedicineCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add a new medicine to the PHC."""
    # Verify PHC
    phc_result = await db.execute(
        select(PHC).where(PHC.id == current_user.phc_id)
    )
    if not phc_result.scalar_one_or_none():
        raise HTTPException(404, "PHC not found")
    
    # Check duplicate
    result = await db.execute(
        select(Medicine).where(
            Medicine.name == medicine.name,
            Medicine.phc_id == current_user.phc_id
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(400, "Medicine already exists in this PHC")
    
    new_medicine = Medicine(
        name=medicine.name,
        code=medicine.code,
        category=medicine.category,
        current_stock=medicine.current_stock or 0,
        reorder_level=medicine.reorder_level or 50,
        buffer_stock=medicine.buffer_stock or 25,
        unit=medicine.unit or "strips",
        price_per_unit=medicine.price_per_unit,
        phc_id=current_user.phc_id
    )
    db.add(new_medicine)
    await db.commit()
    await db.refresh(new_medicine)
    return new_medicine

@router.get("/", response_model=List[MedicineResponse])
async def list_medicines(
    category: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List medicines for the user's PHC."""
    query = select(Medicine).where(Medicine.phc_id == current_user.phc_id)
    
    if category:
        query = query.where(Medicine.category == category)
    
    # Pagination
    query = query.offset((page - 1) * limit).limit(limit)
    query = query.order_by(Medicine.name)
    
    result = await db.execute(query)
    medicines = result.scalars().all()
    
    return medicines