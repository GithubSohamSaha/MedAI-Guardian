from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List, Optional
from datetime import datetime, timezone, timedelta

from backend.api.services.database import get_db
from backend.api.models.user import User
from backend.api.models.patient import Patient, PatientVisit
from backend.api.models.phc import PHC
from backend.api.models.alert import Alert, AlertType, AlertSeverity
from backend.api.schemas import (
    PatientVisitCreate, PatientVisitResponse, PatientResponse,
    PatientCreate, PatientSurgePrediction
)
from backend.api.services.auth import get_current_user
from ml.pipelines.patient_prediction.predict import predict_footfall
from backend.api.services.alerts import create_alert

router = APIRouter()

@router.post("/visit", response_model=PatientVisitResponse)
async def record_visit(
    visit: PatientVisitCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Record a patient visit."""
    # Get or create patient
    if visit.patient_id:
        result = await db.execute(
            select(Patient).where(Patient.patient_id == visit.patient_id)
        )
        patient = result.scalar_one_or_none()
        if not patient:
            patient = Patient(
                patient_id=visit.patient_id,
                phc_id=current_user.phc_id
            )
            db.add(patient)
            await db.flush()
    else:
        patient = None
    
    # Create visit
    new_visit = PatientVisit(
        patient_id=patient.id if patient else None,
        phc_id=current_user.phc_id,
        symptoms=visit.symptoms,
        diagnosis=visit.diagnosis,
        wait_time_min=visit.wait_time_min,
        is_emergency=visit.is_emergency
    )
    db.add(new_visit)
    await db.commit()
    await db.refresh(new_visit)
    
    # Check for patient surge
    today = datetime.now(timezone.utc).date()
    yesterday = today - timedelta(days=1)
    
    count_result = await db.execute(
        select(func.count())
        .where(
            PatientVisit.phc_id == current_user.phc_id,
            func.date(PatientVisit.visit_date) == today
        )
    )
    today_count = count_result.scalar() or 0
    
    count_result = await db.execute(
        select(func.count())
        .where(
            PatientVisit.phc_id == current_user.phc_id,
            func.date(PatientVisit.visit_date) == yesterday
        )
    )
    yesterday_count = count_result.scalar() or 0
    
    if today_count > yesterday_count * 1.5 and today_count > 50:
        await create_alert(
            db=db,
            phc_id=current_user.phc_id,
            alert_type=AlertType.PATIENT_SURGE,
            severity=AlertSeverity.HIGH,
            title=f"Patient Surge Detected",
            description=f"Today: {today_count} patients vs {yesterday_count} yesterday",
            user_id=current_user.id
        )
    
    return new_visit

@router.get("/forecast", response_model=PatientSurgePrediction)
async def get_patient_forecast(
    phc_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get patient footfall forecast for tomorrow."""
    target_phc_id = phc_id or current_user.phc_id
    
    # Get historical data (last 30 days)
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    result = await db.execute(
        select(
            func.date(PatientVisit.visit_date).label("date"),
            func.count().label("count")
        )
        .where(
            PatientVisit.phc_id == target_phc_id,
            PatientVisit.visit_date >= thirty_days_ago
        )
        .group_by(func.date(PatientVisit.visit_date))
    )
    historical = result.all()
    
    # Predict
    prediction = predict_footfall(
        historical_data=[(row.date, row.count) for row in historical]
    )
    
    return PatientSurgePrediction(
        phc_id=target_phc_id,
        predicted_count=prediction,
        peak_hours="11:00-14:00",
        risk_level="HIGH" if prediction > 100 else "MEDIUM" if prediction > 50 else "LOW"
    )

@router.get("/stats")
async def get_patient_stats(
    days: int = Query(7, ge=1, le=30),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get patient statistics for the PHC."""
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    # Daily counts
    result = await db.execute(
        select(
            func.date(PatientVisit.visit_date).label("date"),
            func.count().label("count")
        )
        .where(
            PatientVisit.phc_id == current_user.phc_id,
            PatientVisit.visit_date >= start_date
        )
        .group_by(func.date(PatientVisit.visit_date))
        .order_by(func.date(PatientVisit.visit_date))
    )
    daily_counts = {str(row.date): row.count for row in result.all()}
    
    # Total
    total_result = await db.execute(
        select(func.count())
        .where(
            PatientVisit.phc_id == current_user.phc_id,
            PatientVisit.visit_date >= start_date
        )
    )
    total = total_result.scalar() or 0
    
    return {
        "daily_counts": daily_counts,
        "total": total,
        "days": days
    }
