from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List, Optional
from datetime import datetime, timezone, timedelta

from backend.api.services.database import get_db
from backend.api.models.user import User
from backend.api.models.phc import PHC
from backend.api.models.medicine import Medicine
from backend.api.models.bed import Bed
from backend.api.models.doctor import Doctor, DoctorAttendance
from backend.api.models.alert import Alert
from backend.api.schemas import (
    DashboardSummary, PHCHealthScore, DashboardTrends
)
from backend.api.services.auth import get_current_user
from backend.api.services.redis_client import RedisClient

router = APIRouter()

def calculate_health_score(phc: PHC, medicine_health: float, bed_health: float, doctor_health: float) -> int:
    """Calculate composite health score (0-100)."""
    weights = {
        "medicine": 0.4,
        "bed": 0.3,
        "doctor": 0.2,
        "patient": 0.1
    }
    score = (
        medicine_health * weights["medicine"] +
        bed_health * weights["bed"] +
        doctor_health * weights["doctor"]
    )
    return int(min(100, max(0, score * 100)))

@router.get("/summary", response_model=DashboardSummary)
async def get_dashboard_summary(
    district: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get comprehensive dashboard summary."""
    # Build PHC query
    query = select(PHC)
    if current_user.role in ["district_admin", "super_admin"]:
        if district:
            query = query.where(PHC.district == district)
    else:
        query = query.where(PHC.id == current_user.phc_id)
    
    phcs_result = await db.execute(query)
    phcs = phcs_result.scalars().all()
    
    alerts_list = []
    red_count = yellow_count = green_count = 0
    total_medicines = 0
    critical_count = 0
    
    # Get alert count
    alert_count_result = await db.execute(
        select(func.count()).where(Alert.is_resolved == False)
    )
    active_alerts = alert_count_result.scalar() or 0
    
    for phc in phcs:
        # Medicine health
        med_result = await db.execute(
            select(Medicine).where(Medicine.phc_id == phc.id)
        )
        medicines = med_result.scalars().all()
        total_medicines += len(medicines)
        
        critical = [m for m in medicines if m.current_stock < m.reorder_level]
        critical_count += len(critical)
        
        medicine_health = 1.0 - (len(critical) / max(len(medicines), 1))
        
        # Bed health
        bed_result = await db.execute(
            select(Bed).where(Bed.phc_id == phc.id)
        )
        beds = bed_result.scalars().all()
        total_beds = sum(b.total for b in beds)
        occupied_beds = sum(b.occupied for b in beds)
        bed_health = 1.0 - (occupied_beds / max(total_beds, 1)) if total_beds > 0 else 0.5
        
        # Doctor health
        today = datetime.now(timezone.utc).date()

        # Count present doctors for this PHC today
        doc_result = await db.execute(
            select(func.count())
            .select_from(DoctorAttendance)
            .join(Doctor, DoctorAttendance.doctor_id == Doctor.id)
            .where(
                Doctor.phc_id == phc.id,
                func.date(DoctorAttendance.date) == today,
                DoctorAttendance.present == True
            )
        )
        present = doc_result.scalar() or 0

        # Total doctors in this PHC
        doc_total_result = await db.execute(
            select(func.count()).where(Doctor.phc_id == phc.id)
        )
        total_docs = doc_total_result.scalar() or 1

        doctor_health = present / total_docs if total_docs > 0 else 0.5
        
        # Calculate score
        score = calculate_health_score(phc, medicine_health, bed_health, doctor_health)
        phc.health_score = score
        
        if score < 40:
            status = "RED"
            red_count += 1
        elif score < 70:
            status = "YELLOW"
            yellow_count += 1
        else:
            status = "GREEN"
            green_count += 1
        
        alerts_list.append(PHCHealthScore(
            phc_id=phc.id,
            phc_name=phc.name,
            district=phc.district,
            health_score=score,
            status=status,
            critical_medicines=[m.name for m in critical[:5]],
            critical_count=len(critical),
            total_medicines=len(medicines)
        ))
    
    return DashboardSummary(
        total_phcs=len(phcs),
        red_phcs=red_count,
        yellow_phcs=yellow_count,
        green_phcs=green_count,
        total_medicines=total_medicines,
        critical_medicines=critical_count,
        active_alerts=active_alerts,
        alerts=alerts_list
    )

@router.get("/trends", response_model=DashboardTrends)
async def get_dashboard_trends(
    days: int = Query(30, ge=7, le=90),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get historical trends for dashboard charts."""
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    # Stock trends
    stock_query = """
        SELECT 
            DATE(s.recorded_at) as date,
            AVG(m.current_stock) as avg_stock
        FROM stock_transactions s
        JOIN medicines m ON s.medicine_id = m.id
        WHERE s.recorded_at >= :start_date
        GROUP BY DATE(s.recorded_at)
        ORDER BY DATE(s.recorded_at)
    """
    # (This would be a raw query in production)
    
    return DashboardTrends(
        stock_trends=[],
        patient_trends=[],
        alert_trends=[]
    )
