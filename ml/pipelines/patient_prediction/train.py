import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import xgboost as xgb
import pickle
import os
from datetime import datetime, timedelta

def generate_patient_data():
    """Generate synthetic patient visit data."""
    np.random.seed(42)
    
    dates = pd.date_range(start="2025-01-01", end="2026-07-01", freq="D")
    data = []
    
    for date in dates:
        # Seasonal pattern
        month = date.month
        seasonal = 1 + 0.3 * np.sin((month - 1) * np.pi / 6)
        
        # Day of week pattern
        dow = date.weekday()
        dow_factor = 1.2 if dow < 5 else 0.8  # Weekdays higher
        
        # Holiday effect
        is_holiday = 1 if date.day in [1, 15, 26] and date.month in [1, 8, 12] else 0
        
        # Random variation
        noise = np.random.normal(1, 0.1)
        
        base_patients = 30 * seasonal * dow_factor * noise
        patients = max(0, int(base_patients + np.random.randint(-10, 10)))
        
        data.append({
            "date": date,
            "patients": patients,
            "day_of_week": dow,
            "month": month,
            "is_holiday": is_holiday,
            "temperature": np.random.normal(25, 5),
            "precipitation": np.random.exponential(1)
        })
    
    return pd.DataFrame(data)

def train_model():
    """Train XGBoost model for patient prediction."""
    df = generate_patient_data()
    
    # Create lag features
    df["patients_lag1"] = df["patients"].shift(1)
    df["patients_lag7"] = df["patients"].shift(7)
    df["patients_lag30"] = df["patients"].shift(30)
    df = df.dropna()
    
    features = ["day_of_week", "month", "is_holiday", "temperature", 
                "precipitation", "patients_lag1", "patients_lag7", "patients_lag30"]
    X = df[features]
    y = df["patients"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = xgb.XGBRegressor(
        n_estimators=150,
        learning_rate=0.05,
        max_depth=5,
        random_state=42,
        tree_method="hist"
    )
    model.fit(X_train, y_train)
    
    # Evaluate
    from sklearn.metrics import mean_absolute_error, r2_score
    y_pred = model.predict(X_test)
    
    print(f"✅ Patient Model - MAE: {mean_absolute_error(y_test, y_pred):.2f}")
    print(f"✅ Patient Model - R²: {r2_score(y_test, y_pred):.2f}")
    
    # Save model
    os.makedirs("ml/pipelines/patient_prediction/models", exist_ok=True)
    with open("ml/pipelines/patient_prediction/models/model.pkl", "wb") as f:
        pickle.dump(model, f)
    
    scaler = StandardScaler()
    scaler.fit(X_train)
    with open("ml/pipelines/patient_prediction/models/scaler.pkl", "wb") as f:
        pickle.dump(scaler, f)
    
    return model, scaler

if __name__ == "__main__":
    train_model()