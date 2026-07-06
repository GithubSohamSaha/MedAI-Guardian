from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from typing import List
import httpx
import os
import base64
import json
from google.cloud import vision
from google.cloud import bigquery
from dotenv import load_dotenv

from backend.api.services.database import get_db
from backend.api.models.user import User
from backend.api.models.phc import PHC
from backend.api.models.medicine import Medicine
from backend.api.schemas import GeminiQuery, OCRResponse, DiseaseTrend
from backend.api.services.auth import get_current_user

load_dotenv()
router = APIRouter()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT")
DATASET_ID = os.getenv("BIGQUERY_DATASET", "medai_warehouse")

@router.post("/gemini-chat")
async def gemini_chat(
    query: GeminiQuery,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Chat with Gemini AI about PHC data."""
    # Gather real-time context
    phc_result = await db.execute(select(PHC).limit(5))
    phcs = phc_result.scalars().all()
    
    med_result = await db.execute(select(Medicine).limit(10))
    medicines = med_result.scalars().all()
    
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
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GOOGLE_API_KEY}"
    payload = {
        "contents": [{
            "parts": [{"text": context}]
        }]
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload, timeout=30.0)
        data = response.json()
        
        try:
            answer = data["candidates"][0]["content"]["parts"][0]["text"]
        except:
            answer = "I couldn't process that request. Please try again."
    
    return {
        "question": query.question,
        "answer": answer,
        "sources": ["PHC Database", "Stock Records"]
    }

@router.post("/ocr-opd", response_model=OCRResponse)
async def ocr_opd_register(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Extract text from OPD register image using Google Vision API."""
    try:
        # Read image
        image_bytes = await file.read()
        
        # Initialize Vision client
        client = vision.ImageAnnotatorClient()
        image = vision.Image(content=image_bytes)
        
        # Perform text detection
        response = client.text_detection(image=image)
        texts = response.text_annotations
        
        if not texts:
            return OCRResponse(
                success=False,
                extracted_text="No text found in image",
                entries=[]
            )
        
        full_text = texts[0].description
        
        # Parse entries (simplified - assumes structured format)
        entries = []
        lines = full_text.split('\n')
        for line in lines:
            if ':' in line:
                parts = line.split(':')
                if len(parts) >= 2:
                    entries.append({
                        "field": parts[0].strip(),
                        "value": ':'.join(parts[1:]).strip()
                    })
        
        return OCRResponse(
            success=True,
            extracted_text=full_text,
            entries=entries
        )
    
    except Exception as e:
        return OCRResponse(
            success=False,
            extracted_text=f"Error: {str(e)}",
            entries=[]
        )

@router.get("/disease-trends", response_model=List[DiseaseTrend])
async def get_disease_trends(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get disease outbreak trends using BigQuery ML."""
    try:
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
    
    except Exception as e:
        return []