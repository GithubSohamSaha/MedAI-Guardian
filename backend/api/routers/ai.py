from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
<<<<<<< HEAD
from sqlalchemy import select, func, and_
from typing import List
import re
=======
from sqlalchemy import select, func
from typing import List
from datetime import datetime, timezone, timedelta
import httpx
>>>>>>> 8e2315b (MedAI Feature Updation Commit)
import os
from dotenv import load_dotenv

from backend.api.services.database import get_db
from backend.api.models.user import User
from backend.api.models.phc import PHC
from backend.api.models.alert import Alert
from backend.api.models.bed import Bed
from backend.api.models.doctor import Doctor
from backend.api.models.medicine import Medicine
<<<<<<< HEAD
from backend.api.models.bed import Bed
=======
>>>>>>> 8e2315b (MedAI Feature Updation Commit)
from backend.api.models.patient import PatientVisit
from backend.api.schemas import GeminiQuery, OCRResponse, DiseaseTrend
from backend.api.services.auth import get_current_user

load_dotenv()
router = APIRouter()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")


# ---------- Helper: Extract entity names ----------
def extract_phc_name(text: str, phcs: list) -> str:
    """Find a PHC name in the question."""
    text_lower = text.lower()
    for phc in phcs:
        if phc.name.lower() in text_lower:
            return phc.name
    return None

def extract_medicine_name(text: str, medicines: list) -> str:
    """Find a medicine name in the question."""
    text_lower = text.lower()
    for med in medicines:
        if med.name.lower() in text_lower:
            return med.name
    return None


# ---------- Main smart response ----------
async def get_smart_response(question: str, db: AsyncSession) -> str:
    """Query the database dynamically based on the question."""
    try:
        # ---- 1. Fetch all data for context ----
        phc_result = await db.execute(select(PHC))
        all_phcs = phc_result.scalars().all()
        
        med_result = await db.execute(select(Medicine))
        all_medicines = med_result.scalars().all()
        
        bed_result = await db.execute(select(Bed))
        all_beds = bed_result.scalars().all()
        
        patient_total = 0
        try:
            result = await db.execute(select(func.count(PatientVisit.id)))
            patient_total = result.scalar() or 0
        except:
            patient_total = 0

        q = question.lower()
        
        # ---- 2. Check for specific PHC ----
        phc_name = extract_phc_name(q, all_phcs)
        if phc_name:
            phc = next((p for p in all_phcs if p.name.lower() == phc_name.lower()), None)
            if phc:
                meds = [m for m in all_medicines if m.phc_id == phc.id]
                stock_summary = ", ".join([f"{m.name}: {m.current_stock}" for m in meds[:5]]) if meds else "No medicines"
                score = phc.health_score if phc.health_score is not None else "N/A"
                status = "GREEN" if phc.health_score and phc.health_score >= 70 else "YELLOW" if phc.health_score and phc.health_score >= 40 else "RED"
                return f"📋 **{phc.name}** (District: {phc.district})\n- Health Score: {score} ({status})\n- Medicines: {len(meds)} tracked\n- Stock sample: {stock_summary}"
        
        # ---- 3. Check for specific medicine ----
        med_name = extract_medicine_name(q, all_medicines)
        if med_name:
            med = next((m for m in all_medicines if m.name.lower() == med_name.lower()), None)
            if med:
                phc = next((p for p in all_phcs if p.id == med.phc_id), None)
                phc_name_str = phc.name if phc else "Unknown PHC"
                critical = "⚠️ CRITICAL" if med.current_stock < med.reorder_level else "✅ OK"
                return f"💊 **{med.name}**\n- Stock: {med.current_stock} units\n- Reorder level: {med.reorder_level}\n- Status: {critical}\n- PHC: {phc_name_str}"
        
        # ---- 4. "Best" PHC based on stock ----
        if ("best" in q and "phc" in q and ("stock" in q or "medicine" in q)) or ("highest stock" in q and "phc" in q):
            if not all_phcs or not all_medicines:
                return "No data available to determine the best PHC."
            phc_analysis = []
            for phc in all_phcs:
                phc_meds = [m for m in all_medicines if m.phc_id == phc.id]
                if not phc_meds:
                    continue
                total_stock = sum(m.current_stock for m in phc_meds)
                avg_stock = total_stock / len(phc_meds)
                critical = [m for m in phc_meds if m.current_stock < m.reorder_level]
                score = (total_stock * 0.5) - (len(critical) * 10)
                phc_analysis.append({
                    "name": phc.name,
                    "total_stock": total_stock,
                    "avg_stock": avg_stock,
                    "critical": len(critical),
                    "medicines": len(phc_meds),
                    "score": score
                })
            if not phc_analysis:
                return "No PHCs have medicines registered."
            phc_analysis.sort(key=lambda x: x["score"], reverse=True)
            best = phc_analysis[0]
            response = f"🏆 **Best PHC by Medicine Stock**: **{best['name']}**\n"
            response += f"- Total stock: {best['total_stock']} units\n"
            response += f"- Average per medicine: {best['avg_stock']:.1f} units\n"
            response += f"- Critical medicines: {best['critical']}\n"
            response += f"- Medicines tracked: {best['medicines']}\n\n"
            if len(phc_analysis) > 1:
                response += "📊 **Rankings:**\n"
                for i, p in enumerate(phc_analysis[:3], 1):
                    emoji = "🥇" if i == 1 else "🥈" if i == 2 else "🥉"
                    response += f"{emoji} {p['name']} – {p['total_stock']} units, {p['critical']} critical\n"
            return response
        
        # ---- 5. Efficiency / resource utilization ----
        if "efficiency" in q or "resource" in q or "utilization" in q:
            if not all_phcs or not all_medicines:
                return "Not enough data to calculate efficiency."
            lines = []
            for phc in all_phcs:
                meds = [m for m in all_medicines if m.phc_id == phc.id]
                if not meds:
                    continue
                total_stock = sum(m.current_stock for m in meds)
                critical = len([m for m in meds if m.current_stock < m.reorder_level])
                efficiency = (total_stock / len(meds)) * (1 - critical / max(len(meds), 1))
                lines.append(f"- {phc.name}: {efficiency:.1f} efficiency score")
            return "📊 **Resource Efficiency**\n" + "\n".join(lines[:5])
        
        # ---- 6. Correlation / trend ----
        if "correlation" in q or "trend" in q or "relationship" in q:
            return "📈 I can analyze trends. Try asking:\n- Which PHC has the highest patient load?\n- What is the bed occupancy rate?\n- Show me critical medicines."
        
        # ---- 7. What if / projection / forecast ----
        if "what if" in q or "projection" in q or "forecast" in q:
            return "🔮 For projections, ask:\n- What is the forecast for patient visits tomorrow?\n- Which medicines will run out first?"
        
        # ---- 8. Compare ----
        if "compare" in q:
            return "📊 To compare PHCs, ask:\n- Which PHC has the best stock?\n- Which PHC has the highest patient load?"
        
        # ---- 9. Stock summary (all medicines) ----
        if "stock" in q or "medicine" in q or "inventory" in q:
            if not all_medicines:
                return "No medicines found in the system."
            total = sum(m.current_stock for m in all_medicines)
            avg = total / len(all_medicines)
            critical = [m for m in all_medicines if m.current_stock < m.reorder_level]
            return f"📊 **Stock Overview**\n- Total medicines: {len(all_medicines)}\n- Total stock: {total} units\n- Average stock: {avg:.1f} units\n- Critical medicines: {len(critical)}"
        
        # ---- 10. Patient summary ----
        if "patient" in q or "visit" in q or "footfall" in q or "traffic" in q:
            return f"👥 **Patient Visits**\n- Total recorded: {patient_total}\n- 14‑day average: {patient_total // 14 if patient_total >= 14 else patient_total} patients/day"
        
        # ---- 11. Bed summary ----
        if "bed" in q or "occupancy" in q:
            if not all_beds:
                return "No bed data available."
            total = sum(b.total for b in all_beds)
            occupied = sum(b.occupied for b in all_beds)
            if total == 0:
                return "No beds registered."
            occ_pct = (occupied / total) * 100
            return f"🛏️ **Bed Occupancy**\n- Total beds: {total}\n- Occupied: {occupied}\n- Available: {total - occupied}\n- Occupancy rate: {occ_pct:.1f}%"
        
        # ---- 12. PHC list / health ----
        if "phc" in q or "health" in q:
            if not all_phcs:
                return "No PHCs found."
            lines = []
            for p in all_phcs:
                score = p.health_score if p.health_score is not None else 0
                status = "🟢GREEN" if score >= 70 else "🟡YELLOW" if score >= 40 else "🔴RED"
                lines.append(f"- {p.name}: {score} ({status})")
            return "🏥 **PHC Health Scores**\n" + "\n".join(lines)
        
        # ---- 13. Default: show a summary of all data ----
        return f"📌 **System Summary**\n- PHCs: {len(all_phcs)}\n- Medicines: {len(all_medicines)}\n- Beds: {len(all_beds)}\n- Patient visits: {patient_total}\n\nAsk me about specific PHCs, medicines, or bed availability."
    
    except Exception as e:
        print(f"Smart response error: {e}")
        return "Unable to answer right now. Please try again."



def build_local_answer(question: str, phcs, medicines, alerts, beds, doctors, visit_count: int) -> str:
    """Generate a deterministic operational answer when hosted AI is not configured."""
    critical_meds = [med for med in medicines if med.current_stock <= med.reorder_level]
    total_beds = sum(bed.total for bed in beds)
    available_beds = sum(bed.available for bed in beds)
    unavailable_beds = [bed.bed_type for bed in beds if bed.available <= 0 and bed.total > 0]
    absent_risk = max(0, len(doctors) - 2) if doctors else 0

    focus = "stock" if "stock" in question.lower() or "medicine" in question.lower() else "operations"
    if "bed" in question.lower() or "capacity" in question.lower():
        focus = "capacity"
    if "patient" in question.lower() or "surge" in question.lower():
        focus = "patient flow"

    recommendations = []
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
    if not recommendations:
        recommendations.append("Maintain routine monitoring; no immediate intervention is required.")

    return (
        f"Focus area: {focus}.\n\n"
        f"Current snapshot: {len(phcs)} PHC(s), {len(medicines)} medicines, "
        f"{len(critical_meds)} below reorder level, {available_beds}/{total_beds or 0} beds available, "
        f"{len(doctors)} doctors registered, and {visit_count} visits in the recent window.\n\n"
        "Recommended actions:\n- " + "\n- ".join(recommendations)
    )


async def get_local_disease_trends(db: AsyncSession, days: int) -> List[DiseaseTrend]:
    since = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=days)
    result = await db.execute(
        select(
            PatientVisit.diagnosis,
            func.count().label("case_count")
        )
        .where(PatientVisit.visit_date >= since)
        .group_by(PatientVisit.diagnosis)
        .order_by(func.count().desc())
        .limit(20)
    )

    trends = []
    for row in result.all():
        count = row.case_count or 0
        trends.append(DiseaseTrend(
            disease=row.diagnosis or "Unspecified",
            date=datetime.now(timezone.utc).date().isoformat(),
            case_count=count,
            seven_day_avg=round(float(count) / max(days, 1) * 7, 2),
            alert_level="WARNING" if count >= 5 else "NORMAL"
        ))
    return trends

@router.post("/gemini-chat")
async def gemini_chat(
    query: GeminiQuery,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
<<<<<<< HEAD
    try:
        answer = await get_smart_response(query.question, db)
        return {
            "question": query.question,
            "answer": answer,
            "sources": ["Database Query"]
        }
    except Exception as e:
        print(f"Error in gemini_chat: {e}")
        return {
            "question": query.question,
            "answer": "I encountered an error. Please try again.",
            "sources": ["Error"]
        }
=======
    """Chat with Gemini AI about PHC data."""
    # Gather real-time context
    phc_result = await db.execute(select(PHC).limit(5))
    phcs = phc_result.scalars().all()
    
    med_result = await db.execute(select(Medicine).limit(10))
    medicines = med_result.scalars().all()

    alert_result = await db.execute(
        select(Alert).where(Alert.is_resolved == False).limit(10)
    )
    alerts = alert_result.scalars().all()

    bed_result = await db.execute(select(Bed))
    beds = bed_result.scalars().all()

    doctor_result = await db.execute(select(Doctor))
    doctors = doctor_result.scalars().all()

    visit_result = await db.execute(select(func.count()).select_from(PatientVisit))
    visit_count = visit_result.scalar() or 0
    
    context = f"""
    You are MedAI Guardian, an AI health assistant for PHCs.
    
    Current System Status:
    - Total PHCs: {len(phcs)}
    - Sample PHC: {phcs[0].name if phcs else 'None'}
    - Medicines tracked: {len(medicines)}
    - Sample medicine stock: {medicines[0].name}: {medicines[0].current_stock} units if medicines else 'None'
    
    User Question: {query.question}
    
    Provide a clear, concise, and actionable answer.
    """
    
    if not GOOGLE_API_KEY:
        return {
            "question": query.question,
            "answer": build_local_answer(query.question, phcs, medicines, alerts, beds, doctors, visit_count),
            "sources": ["Local PHC Database", "Stock Records", "Bed Census", "Alert Queue"]
        }

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GOOGLE_API_KEY}"
    payload = {
        "contents": [{
            "parts": [{"text": context}]
        }]
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, timeout=30.0)
            data = response.json()
            answer = data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception:
        answer = build_local_answer(query.question, phcs, medicines, alerts, beds, doctors, visit_count)
    
    return {
        "question": query.question,
        "answer": answer,
        "sources": ["PHC Database", "Stock Records"]
    }
>>>>>>> 8e2315b (MedAI Feature Updation Commit)


# ---------- OCR ----------
@router.post("/ocr-opd", response_model=OCRResponse)
async def ocr_opd_register(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
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
        lines = full_text.split('\n')
        for line in lines:
            if ':' in line:
                parts = line.split(':')
                if len(parts) >= 2:
                    entries.append({"field": parts[0].strip(), "value": ':'.join(parts[1:]).strip()})
        return OCRResponse(success=True, extracted_text=full_text, entries=entries)
    except Exception as e:
        return OCRResponse(success=False, extracted_text=f"Error: {str(e)}", entries=[])


@router.get("/disease-trends", response_model=List[DiseaseTrend])
async def get_disease_trends(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
<<<<<<< HEAD
    return []
=======
    """Get disease outbreak trends using BigQuery ML."""
    try:
        if not PROJECT_ID:
            return await get_local_disease_trends(db, days)

        # Initialize BigQuery client
        client = bigquery.Client(project=PROJECT_ID)
        
        # Query for disease trends
        query = f"""
        WITH daily_cases AS (
            SELECT 
                DATE(visit_date) as date,
                diagnosis,
                COUNT(*) as case_count
            FROM `{PROJECT_ID}.{DATASET_ID}.patient_visits`
            WHERE visit_date >= DATE_SUB(CURRENT_DATE(), INTERVAL {days} DAY)
            GROUP BY date, diagnosis
        ),
        trend_analysis AS (
            SELECT 
                diagnosis,
                date,
                case_count,
                AVG(case_count) OVER (
                    PARTITION BY diagnosis 
                    ORDER BY date 
                    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
                ) as ma7
            FROM daily_cases
        )
        SELECT 
            diagnosis,
            date,
            case_count,
            ma7,
            CASE 
                WHEN case_count > ma7 * 1.5 THEN 'OUTBREAK'
                WHEN case_count > ma7 * 1.2 THEN 'WARNING'
                ELSE 'NORMAL'
            END as alert_level
        FROM trend_analysis
        WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
        ORDER BY date DESC
        """
        
        result = client.query(query)
        rows = result.result()
        
        trends = []
        for row in rows:
            trends.append(DiseaseTrend(
                disease=row.diagnosis,
                date=row.date.isoformat(),
                case_count=row.case_count,
                seven_day_avg=row.ma7,
                alert_level=row.alert_level
            ))
        
        return trends
    
    except Exception:
        return await get_local_disease_trends(db, days)
>>>>>>> 8e2315b (MedAI Feature Updation Commit)
