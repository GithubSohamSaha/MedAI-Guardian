from __future__ import annotations 
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

# Auth Schemas
class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: str
    password: str = Field(min_length=6)
    phc_id: Optional[int] = None
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Optional[UserResponse] = None  # use UserResponse instead of dict

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    phc_id: Optional[int]
    phone: Optional[str]
    image_file: Optional[str]
    is_active: bool
    model_config = {"from_attributes": True}

class UserPublic(BaseModel):
    id: int
    username: str
    image_file: Optional[str]
    model_config = {"from_attributes": True}

class UserUpdate(BaseModel):
    username: Optional[str] = None
    phone: Optional[str] = None
    image_file: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

# Medicine Schemas
class StockUpdate(BaseModel):
    medicine_name: str
    quantity: int
    notes: Optional[str] = None
    transaction_type: Optional[str] = "manual"

class StockForecast(BaseModel):
    medicine_id: int
    medicine_name: str
    current_stock: int
    avg_daily_consumption: float
    days_remaining: int
    reorder_level: int
    is_critical: bool

class MedicineCreate(BaseModel):
    name: str
    code: Optional[str] = None
    category: Optional[str] = None
    current_stock: Optional[int] = 0
    reorder_level: Optional[int] = 50
    buffer_stock: Optional[int] = 25
    unit: Optional[str] = "strips"
    price_per_unit: Optional[float] = None

class MedicineResponse(BaseModel):
    id: int
    name: str
    code: Optional[str]
    category: Optional[str]
    current_stock: int
    reorder_level: int
    buffer_stock: int
    unit: str
    price_per_unit: Optional[float]
    phc_id: int
    last_updated: datetime
    model_config = {"from_attributes": True}

class StockTransactionResponse(BaseModel):
    id: int
    medicine_id: int
    quantity_change: int
    transaction_type: str
    recorded_at: datetime
    user_id: int
    notes: Optional[str]
    model_config = {"from_attributes": True}

class BulkStockUpdate(BaseModel):
    updates: List[StockUpdate]

# Patient Schemas
class PatientCreate(BaseModel):
    patient_id: Optional[str] = None
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None

class PatientVisitCreate(BaseModel):
    patient_id: Optional[str] = None
    symptoms: Optional[List[str]] = None
    diagnosis: Optional[str] = None
    wait_time_min: Optional[int] = None
    is_emergency: bool = False

class PatientVisitResponse(BaseModel):
    id: int
    patient_id: Optional[int]
    phc_id: int
    visit_date: datetime
    symptoms: Optional[List[str]]
    diagnosis: Optional[str]
    wait_time_min: Optional[int]
    is_emergency: bool
    model_config = {"from_attributes": True}

class PatientResponse(BaseModel):
    id: int
    patient_id: Optional[str]
    name: Optional[str]
    age: Optional[int]
    gender: Optional[str]
    phone: Optional[str]
    model_config = {"from_attributes": True}

class PatientSurgePrediction(BaseModel):
    phc_id: int
    predicted_count: int
    peak_hours: str
    risk_level: str

# Bed Schemas
class BedUpdate(BaseModel):
    bed_type: str
    total: int
    occupied: int

class BedResponse(BaseModel):
    id: int
    bed_type: str
    total: int
    occupied: int
    available: int
    phc_id: int
    last_updated: datetime
    model_config = {"from_attributes": True}

class BedAvailability(BaseModel):
    phc_id: int
    bed_type: str
    total: int
    occupied: int
    available: int
    last_updated: datetime

# Doctor Schemas
class DoctorCreate(BaseModel):
    name: str
    specialization: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

class DoctorResponse(BaseModel):
    id: int
    name: str
    specialization: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    attendance_rate: float
    phc_id: int
    model_config = {"from_attributes": True}

class AttendanceUpdate(BaseModel):
    doctor_id: int
    present: bool
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None

class DoctorAttendanceRecord(BaseModel):
    id: int
    doctor_id: int
    date: datetime
    present: bool
    check_in_time: Optional[datetime]
    check_out_time: Optional[datetime]
    predicted_absent: bool

class AttendancePrediction(BaseModel):
    doctor_id: int
    predicted_absent: bool
    confidence: float

# Dashboard Schemas
class PHCHealthScore(BaseModel):
    phc_id: int
    phc_name: str
    district: str
    health_score: int
    status: str
    critical_medicines: List[str]
    critical_count: int
    total_medicines: int

class DashboardSummary(BaseModel):
    total_phcs: int
    red_phcs: int
    yellow_phcs: int
    green_phcs: int
    total_medicines: int
    critical_medicines: int
    active_alerts: int
    alerts: List[PHCHealthScore]

class DashboardTrends(BaseModel):
    stock_trends: List[dict]
    patient_trends: List[dict]
    alert_trends: List[dict]

# Alert Schemas
class AlertResponse(BaseModel):
    id: int
    alert_type: str
    severity: str
    title: str
    description: Optional[str]
    phc_id: int
    user_id: Optional[int]
    is_resolved: bool
    created_at: datetime
    resolved_at: Optional[datetime]
    model_config = {"from_attributes": True}

class AlertUpdate(BaseModel):
    severity: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None

# AI Schemas
class GeminiQuery(BaseModel):
    question: str

class OCRResponse(BaseModel):
    success: bool
    extracted_text: str
    entries: List[dict]

class DiseaseTrend(BaseModel):
    disease: str
    date: str
    case_count: int
    seven_day_avg: float
    alert_level: str
