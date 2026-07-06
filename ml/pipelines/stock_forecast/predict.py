import pickle
import numpy as np
import os

_model = None
_scaler = None

def load_model():
    global _model, _scaler
    if _model is None:
        try:
            with open("ml/pipelines/stock_forecast/models/model.pkl", "rb") as f:
                _model = pickle.load(f)
            with open("ml/pipelines/stock_forecast/models/scaler.pkl", "rb") as f:
                _scaler = pickle.load(f)
        except FileNotFoundError:
            _model = None
            _scaler = None
    return _model, _scaler

def predict_stockout(current_stock: int, avg_consumption: float, reorder_level: int) -> int:
    """Predict days until stockout."""
    model, scaler = load_model()
    
    if model is None:
        # Fallback: simple calculation
        if avg_consumption <= 0:
            return 30
        return max(1, int(current_stock / avg_consumption))
    
    # Prepare features
    features = np.array([[
        current_stock,
        avg_consumption,
        reorder_level,
        0,  # day_of_week (Monday)
        6,  # month (July)
        0,  # is_holiday
        1.0  # seasonal_factor (normal)
    ]])
    
    features = scaler.transform(features)
    days = model.predict(features)[0]
    
    return max(1, int(days))