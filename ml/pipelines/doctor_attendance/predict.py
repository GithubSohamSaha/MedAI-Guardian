import pickle
import numpy as np
import os
from datetime import datetime

_model = None

def load_model():
    global _model
    if _model is None:
        try:
            with open("ml/pipelines/doctor_attendance/models/model.pkl", "rb") as f:
                _model = pickle.load(f)
        except FileNotFoundError:
            _model = None
    return _model

def predict_attendance(attendance_records: list) -> bool:
    """Predict if doctor will be absent tomorrow."""
    model = load_model()
    
    if model is None:
        # Fallback: check if absent more than 20% of days
        if not attendance_records:
            return False
        absent_rate = sum(1 for r in attendance_records if not r.present) / len(attendance_records)
        return absent_rate > 0.2
    
    now = datetime.now()
    tomorrow = now + timedelta(days=1)
    
    # Get last 2 days attendance
    prev_absent = 0
    prev2_absent = 0
    
    if len(attendance_records) >= 1:
        prev_absent = 1 if not attendance_records[-1].present else 0
    if len(attendance_records) >= 2:
        prev2_absent = 1 if not attendance_records[-2].present else 0
    
    features = np.array([[
        tomorrow.weekday(),
        tomorrow.month,
        1 if tomorrow.day in [1, 15, 26] and tomorrow.month in [1, 8, 12] else 0,
        prev_absent,
        prev2_absent
    ]])
    
    prediction = model.predict(features)[0]
    probability = model.predict_proba(features)[0][1]
    
    return prediction == 1