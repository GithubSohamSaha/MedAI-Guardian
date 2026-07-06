from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List, Optional
from datetime import datetime, timezone, timedelta

from backend.api.services.database import get_db
from backend.api.models.user import User
from backend.api.models.doctor import Doctor, DoctorAttendance
from backend.api.models.phc import PHC
from backend.api.models.alert import Alert, AlertType, AlertSeverity
from backend.api.schemas import (
    DoctorCreate, DoctorResponse, DoctorAttendanceRecord,
    AttendanceUpdate, AttendancePrediction
)
from backend.api.services.auth import get_current_user
from ml.pipelines.doctor_attendance.predict import predict_attendance
from backend.api.services.alerts import create_alert

router = APIRouter()

@router.post("/", response_model=DoctorResponse)
async def add_doctor(
    doctor: DoctorCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add a new doctor to the PHC."""
    new_doctor = Doctor(
        name=doctor.name,
        specialization=doctor.specialization,
        phone=doctor.phone,
        email=doctor.email,
        phc_id=current_user.phc_id
    )
    db.add(new_doctor)
    await db.commit()
    await db.refresh(new_doctor)
    return new_doctor

@router.post("/mark-attendance")
async def mark_attendance(
    attendance: AttendanceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark doctor attendance."""
    result = await db.execute(
        select(Doctor).where(
            Doctor.id == attendance.doctor_id,
            Doctor.phc_id == current_user.phc_id
        )
    )
    doctor = result.scalar_one_or_none()
    if not doctor:
        raise HTTPException(404, "Doctor not found")
    
    # Check if already marked today
    today = datetime.now(timezone.utc).date()
    existing = await db.execute(
        select(DoctorAttendance).where(
            DoctorAttendance.doctor_id == attendance.doctor_id,
            func.date(DoctorAttendance.date) == today
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Attendance already marked for today")
    
    record = DoctorAttendance(
        doctor_id=attendance.doctor_id,
        present=attendance.present,
        check_in_time=attendance.check_in_time,
        check_out_time=attendance.check_out_time
    )
    db.add(record)
    await db.commit()
    
    # Check for absenteeism pattern
    if not attendance.present:
        # Check last 3 days
        three_days_ago = today - timedelta(days=3)
        absent_count = await db.execute(
            select(func.count())
            .where(
                DoctorAttendance.doctor_id == attendance.doctor_id,
                DoctorAttendance.present == False,
                func.date(DoctorAttendance.date) >= three_days_ago
            )
        )
        if absent_count.scalar() >= 2:
            await create_alert(
                db=db,
                phc_id=current_user.phc_id,
                alert_type=AlertType.DOCTOR_ABSENT,
                severity=AlertSeverity.HIGH,
                title=f"Doctor Absent Pattern Detected",
                description=f"{doctor.name} has been absent {absent_count} times in the last 3 days",
                user_id=current_user.id
            )
    
    return {"message": "Attendance marked successfully"}

@router.get("/predict-attendance", response_model=AttendancePrediction)
async def predict_doctor_attendance(
    doctor_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Predict if a doctor will be absent tomorrow."""
    # Get historical attendance
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    result = await db.execute(
        select(DoctorAttendance)
        .where(
            DoctorAttendance.doctor_id == doctor_id,
            DoctorAttendance.date >= thirty_days_ago
        )
        .order_by(DoctorAttendance.date)
    )
    records = result.scalars().all()
    
    # Predict
    prediction = predict_attendance(records)
    
    return AttendancePrediction(
        doctor_id=doctor_id,
        predicted_absent=prediction,
        confidence=0.75
    )

@router.get("/", response_model=List[DoctorResponse])
async def list_doctors(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all doctors in the PHC."""
    result = await db.execute(
        select(Doctor).where(Doctor.phc_id == current_user.phc_id)
    )
    return result.scalars().all()