from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from typing import List
from datetime import datetime, timezone

from backend.api.services.database import get_db
from backend.api.models.user import User
from backend.api.models.bed import Bed
from backend.api.models.phc import PHC
from backend.api.models.alert import Alert, AlertType, AlertSeverity
from backend.api.schemas import BedUpdate, BedResponse, BedAvailability
from backend.api.services.auth import get_current_user
from backend.api.services.redis_client import RedisClient
from backend.api.services.alerts import create_alert

router = APIRouter()

@router.post("/update", response_model=BedResponse)
async def update_beds(
    bed_update: BedUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update bed availability."""
    result = await db.execute(
        select(Bed).where(
            Bed.phc_id == current_user.phc_id,
            Bed.bed_type == bed_update.bed_type
        )
    )
    bed = result.scalar_one_or_none()
    
    if not bed:
        bed = Bed(
            bed_type=bed_update.bed_type,
            total=bed_update.total,
            occupied=bed_update.occupied,
            phc_id=current_user.phc_id
        )
        db.add(bed)
    else:
        bed.total = bed_update.total
        bed.occupied = bed_update.occupied
    
    bed.available = bed.total - bed.occupied
    bed.last_updated = datetime.now(timezone.utc)
    
    await db.commit()
    await db.refresh(bed)
    
    # Update Redis cache
    cache_key = f"bed_availability:{current_user.phc_id}:{bed_update.bed_type}"
    await RedisClient.setex(cache_key, 30, str(bed.available))
    
    # Check for shortage
    if bed.available == 0 and bed.total > 0:
        await create_alert(
            db=db,
            phc_id=current_user.phc_id,
            alert_type=AlertType.BED_SHORTAGE,
            severity=AlertSeverity.CRITICAL,
            title=f"No {bed_update.bed_type} Beds Available",
            description=f"All {bed.total} beds are occupied",
            user_id=current_user.id
        )
    
    return bed

@router.get("/availability", response_model=List[BedAvailability])
async def get_bed_availability(
    phc_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get bed availability for a PHC."""
    target_phc_id = phc_id or current_user.phc_id
    
    # Try Redis cache first
    try:
        cache_key = f"bed_availability:{target_phc_id}:all"
        cached = await RedisClient.get(cache_key)
        if cached:
            return await RedisClient.get_json(cache_key)
    except Exception:
        # Redis not available, proceed to database query
        pass
    # Query database
    result = await db.execute(
        select(Bed).where(Bed.phc_id == target_phc_id)
    )
    beds = result.scalars().all()
    
    availability = [
        BedAvailability(
            phc_id=target_phc_id,
            bed_type=bed.bed_type,
            total=bed.total,
            occupied=bed.occupied,
            available=bed.available,
            last_updated=bed.last_updated
        )
        for bed in beds
    ]
    
    # Cache for 30 seconds
    try:
        await RedisClient.set_json(cache_key, availability, ex=30)
    except Exception:
        pass
    
    return availability