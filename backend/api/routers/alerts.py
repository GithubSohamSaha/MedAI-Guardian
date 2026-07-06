from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List, Optional
from datetime import datetime, timezone

from backend.api.services.database import get_db
from backend.api.models.user import User
from backend.api.models.alert import Alert, AlertType, AlertSeverity
from backend.api.schemas import AlertResponse, AlertUpdate
from backend.api.services.auth import get_current_user
from backend.api.services.alerts import resolve_alert
from backend.api.services.fcm import send_push_notification

router = APIRouter()

@router.get("/", response_model=List[AlertResponse])
async def get_alerts(
    resolved: Optional[bool] = False,
    severity: Optional[AlertSeverity] = None,
    limit: int = Query(50, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get alerts for the user's PHC or district."""
    query = select(Alert)
    
    if current_user.role in ["district_admin", "super_admin"]:
        # District admin sees all alerts in district
        pass
    else:
        query = query.where(Alert.phc_id == current_user.phc_id)
    
    if resolved is not None:
        query = query.where(Alert.is_resolved == resolved)
    
    if severity:
        query = query.where(Alert.severity == severity)
    
    query = query.order_by(Alert.created_at.desc()).limit(limit)
    
    result = await db.execute(query)
    alerts = result.scalars().all()
    return alerts

@router.get("/active", response_model=List[AlertResponse])
async def get_active_alerts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get only active (unresolved) alerts."""
    return await get_alerts(resolved=False, current_user=current_user, db=db)

@router.patch("/{alert_id}/resolve")
async def resolve_alert_endpoint(
    alert_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark an alert as resolved."""
    result = await db.execute(
        select(Alert).where(Alert.id == alert_id)
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(404, "Alert not found")
    
    alert.is_resolved = True
    alert.resolved_at = datetime.now(timezone.utc)
    await db.commit()
    
    return {"message": "Alert resolved successfully"}

@router.patch("/{alert_id}", response_model=AlertResponse)
async def update_alert(
    alert_id: int,
    update: AlertUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update alert details."""
    result = await db.execute(
        select(Alert).where(Alert.id == alert_id)
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(404, "Alert not found")
    
    if update.severity:
        alert.severity = update.severity
    if update.title:
        alert.title = update.title
    if update.description:
        alert.description = update.description
    
    await db.commit()
    await db.refresh(alert)
    return alert

@router.delete("/{alert_id}")
async def delete_alert(
    alert_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete an alert."""
    result = await db.execute(
        select(Alert).where(Alert.id == alert_id)
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(404, "Alert not found")
    
    await db.delete(alert)
    await db.commit()
    
    return {"message": "Alert deleted successfully"}