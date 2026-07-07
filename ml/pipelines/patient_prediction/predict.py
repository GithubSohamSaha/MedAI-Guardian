import pickle
import numpy as np
import os
from datetime import datetime, timedelta

_model = None
_scaler = None

def load_model():
    global _model, _scaler
    if _model is None:
        try:
            with open("ml/pipelines/patient_prediction/models/model.pkl", "rb") as f:
                _model = pickle.load(f)
            with open("ml/pipelines/patient_prediction/models/scaler.pkl", "rb") as f:
                _scaler = pickle.load(f)
        except FileNotFoundError:
            _model = None
            _scaler = None
    return _model, _scaler

def predict_footfall(historical_data: list) -> int:
    """Predict tomorrow's patient footfall."""
    model, scaler = load_model()
    
    if model is None:
        # Fallback: simple average
        if not historical_data:
            return 50
        return int(np.mean([d[1] for d in historical_data[-7:]])) if len(historical_data) >= 7 else 50
    
    # Get last 30 days data
    if len(historical_data) < 30:
        return 50
    
    # Prepare features for next day
    now = datetime.now()
    next_day = now + timedelta(days=1)
    
    features = np.array([[
        next_day.weekday(),
        next_day.month,
        1 if next_day.day in [1, 15, 26] and next_day.month in [1, 8, 12] else 0,
        25.0,  # avg temperature
        0.5,   # precipitation
        historical_data[-1][1],  # lag1
        historical_data[-7][1] if len(historical_data) >= 7 else historical_data[-1][1],  # lag7
        historical_data[-30][1] if len(historical_data) >= 30 else historical_data[-1][1]  # lag30
    ]])
    
    features = scaler.transform(features)
    prediction = model.predict(features)[0]
    
    return max(0, int(prediction))
