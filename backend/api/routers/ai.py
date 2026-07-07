from datetime import datetime, timedelta, timezone
from typing import List

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.models.alert import Alert
from backend.api.models.bed import Bed
from backend.api.models.doctor import Doctor
from backend.api.models.medicine import Medicine
from backend.api.models.patient import PatientVisit
from backend.api.models.phc import PHC
from backend.api.models.user import User
from backend.api.schemas import DiseaseTrend, GeminiQuery, OCRResponse
from backend.api.services.auth import get_current_user
from backend.api.services.database import get_db

router = APIRouter()


def build_local_answer(question: str, phcs, medicines, alerts, beds, doctors, visit_count: int, diseases) -> str:
    """Generate an operational answer from local PHC data."""
    critical_meds = [med for med in medicines if med.current_stock <= med.reorder_level]
    lowest_stock = sorted(medicines, key=lambda med: (med.current_stock or 0))[:5]
    total_beds = sum(bed.total for bed in beds)
    available_beds = sum(bed.available for bed in beds)
    occupied_beds = sum(bed.occupied for bed in beds)
    occupancy_rate = round((occupied_beds / total_beds) * 100, 1) if total_beds else 0
    unavailable_beds = [bed.bed_type for bed in beds if bed.available <= 0 and bed.total > 0]
    absent_or_low_coverage = [doctor for doctor in doctors if (doctor.attendance_rate or 0) < 0.75]
    active_alerts = sorted(alerts, key=lambda item: str(item.severity), reverse=True)
    top_disease = diseases[0] if diseases else None

    lower_question = question.lower()
    recommendations = []

    if "stock" in lower_question or "medicine" in lower_question or "inventory" in lower_question:
        if critical_meds:
            stock_lines = "\n".join(
                f"- {med.name}: {med.current_stock} in stock, reorder at {med.reorder_level}"
                for med in critical_meds[:6]
            )
            return (
                "Stock risk is the main supply-chain signal right now.\n\n"
                f"Critical medicines:\n{stock_lines}\n\n"
                "Recommended action: raise same-day redistribution for the lowest-stock medicines, "
                "then place replenishment orders for items below reorder level."
            )
        return "Medicine stock is stable. No tracked item is currently below its reorder level."

    if "bed" in lower_question or "capacity" in lower_question or "icu" in lower_question:
        saturated = ", ".join(unavailable_beds) if unavailable_beds else "none"
        return (
            "Capacity snapshot:\n"
            f"- Beds available: {available_beds}/{total_beds or 0}\n"
            f"- Occupancy: {occupancy_rate}%\n"
            f"- Saturated bed types: {saturated}\n\n"
            "Recommended action: keep referral routing ready for saturated units and review discharge readiness "
            "before the next patient peak."
        )

    if "patient" in lower_question or "surge" in lower_question or "opd" in lower_question or "footfall" in lower_question:
        disease_text = f" Top diagnosis signal: {top_disease.disease} with {top_disease.case_count} cases." if top_disease else ""
        risk = "high" if visit_count > 80 else "moderate" if visit_count > 35 else "low"
        return (
            "Patient-flow assessment:\n"
            f"- Recorded visits: {visit_count}\n"
            f"- Surge pressure: {risk}\n"
            f"- Beds available for escalation: {available_beds}{disease_text}\n\n"
            "Recommended action: staff triage during the peak OPD window, pre-check emergency supplies, "
            "and monitor repeat diagnoses for outbreak signals."
        )

    if "doctor" in lower_question or "staff" in lower_question or "workforce" in lower_question:
        if absent_or_low_coverage:
            names = ", ".join(doctor.name for doctor in absent_or_low_coverage[:5])
            return (
                "Workforce risk detected.\n\n"
                f"Doctors needing coverage review: {names}.\n\n"
                "Recommended action: arrange backup coverage for OPD hours and confirm attendance before morning registration."
            )
        return f"Workforce coverage is stable with {len(doctors)} doctors registered."

    if "alert" in lower_question or "risk" in lower_question:
        if active_alerts:
            alert_lines = "\n".join(f"- {alert.title} ({alert.severity})" for alert in active_alerts[:5])
            return (
                "Active risk queue:\n"
                f"{alert_lines}\n\n"
                "Recommended action: close critical alerts first, then refresh the dashboard to confirm recovery."
            )
        return "There are no unresolved alerts in the current queue."

    if "analytics" in lower_question or "trend" in lower_question or "visual" in lower_question:
        disease_line = f"{top_disease.disease} leads disease signals with {top_disease.case_count} cases" if top_disease else "No disease trend spike is available"
        return (
            "Analytics summary:\n"
            f"- PHC readiness score can be inferred from {len(phcs)} monitored PHC(s).\n"
            f"- {len(critical_meds)} medicines are below reorder level.\n"
            f"- Bed occupancy is {occupancy_rate}%.\n"
            f"- {disease_line}.\n\n"
            "Recommended action: use the Analytics sidebar to compare stock runway, bed occupancy, patient trend, "
            "and disease signals before deciding transfers."
        )

    if critical_meds:
        recommendations.append(
            f"Raise redistribution for {', '.join(med.name for med in critical_meds[:3])} before the next OPD peak."
        )
    if unavailable_beds:
        recommendations.append(
            f"Escalate {', '.join(unavailable_beds)} bed saturation and prepare referral routing."
        )
    if alerts:
        recommendations.append(f"Resolve the {len(alerts)} active alert(s) by severity, starting with critical items.")
    if visit_count > 35:
        recommendations.append("Keep an extra triage desk available for the current patient load.")
    if lowest_stock:
        recommendations.append(f"Review the lowest stock item first: {lowest_stock[0].name}.")
    if not recommendations:
        recommendations.append("Maintain routine monitoring; no immediate intervention is required.")

    return (
        "Priority plan for today.\n\n"
        f"Current snapshot: {len(phcs)} PHC(s), {len(medicines)} medicines, "
        f"{len(critical_meds)} below reorder level, {available_beds}/{total_beds or 0} beds available, "
        f"{len(doctors)} doctors registered, {len(alerts)} active alerts, and {visit_count} visits recorded.\n\n"
        "Recommended actions:\n- " + "\n- ".join(recommendations)
    )


async def get_local_disease_trends(db: AsyncSession, days: int) -> List[DiseaseTrend]:
    since = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=days)
    result = await db.execute(
        select(PatientVisit.diagnosis, func.count().label("case_count"))
        .where(PatientVisit.visit_date >= since)
        .group_by(PatientVisit.diagnosis)
        .order_by(func.count().desc())
        .limit(20)
    )

    trends = []
    for row in result.all():
        count = row.case_count or 0
        trends.append(
            DiseaseTrend(
                disease=row.diagnosis or "Unspecified",
                date=datetime.now(timezone.utc).date().isoformat(),
                case_count=count,
                seven_day_avg=round(float(count) / max(days, 1) * 7, 2),
                alert_level="WARNING" if count >= 5 else "NORMAL",
            )
        )
    return trends


@router.post("/gemini-chat")
async def gemini_chat(
    query: GeminiQuery,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    phc_result = await db.execute(select(PHC).limit(10))
    phcs = phc_result.scalars().all()

    med_result = await db.execute(select(Medicine).limit(50))
    medicines = med_result.scalars().all()

    alert_result = await db.execute(select(Alert).where(Alert.is_resolved == False).limit(20))
    alerts = alert_result.scalars().all()

    bed_result = await db.execute(select(Bed))
    beds = bed_result.scalars().all()

    doctor_result = await db.execute(select(Doctor))
    doctors = doctor_result.scalars().all()

    visit_result = await db.execute(select(func.count()).select_from(PatientVisit))
    visit_count = visit_result.scalar() or 0

    diseases = await get_local_disease_trends(db, 30)

    return {
        "question": query.question,
        "answer": build_local_answer(query.question, phcs, medicines, alerts, beds, doctors, visit_count, diseases),
        "sources": ["Local PHC Database", "Stock Records", "Bed Census", "Alert Queue", "Disease Trends"],
    }


@router.post("/ocr-opd", response_model=OCRResponse)
async def ocr_opd_register(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    try:
        from google.cloud import vision

        image_bytes = await file.read()
        client = vision.ImageAnnotatorClient()
        image = vision.Image(content=image_bytes)
        response = client.text_detection(image=image)
        texts = response.text_annotations
        if not texts:
            return OCRResponse(success=False, extracted_text="No text found", entries=[])

        full_text = texts[0].description
        entries = []
        for line in full_text.splitlines():
            if ":" in line:
                field, value = line.split(":", 1)
                entries.append({"field": field.strip(), "value": value.strip()})

        return OCRResponse(success=True, extracted_text=full_text, entries=entries)
    except Exception as exc:
        return OCRResponse(success=False, extracted_text=f"Error: {exc}", entries=[])


@router.get("/disease-trends", response_model=List[DiseaseTrend])
async def get_disease_trends(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_local_disease_trends(db, days)
