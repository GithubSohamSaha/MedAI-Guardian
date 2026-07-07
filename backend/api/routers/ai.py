from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List
import re
import os
from dotenv import load_dotenv

from backend.api.services.database import get_db
from backend.api.models.user import User
from backend.api.models.phc import PHC
from backend.api.models.medicine import Medicine
from backend.api.models.bed import Bed
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


@router.post("/gemini-chat")
async def gemini_chat(
    query: GeminiQuery,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
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
    return []