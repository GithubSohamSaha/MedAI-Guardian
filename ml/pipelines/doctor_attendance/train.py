import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import pickle
import os
from datetime import datetime

def generate_attendance_data():
    """Generate synthetic doctor attendance data."""
    np.random.seed(42)
    
    dates = pd.date_range(start="2025-01-01", end="2026-07-01", freq="D")
    data = []
    
    for date in dates:
        # Day of week
        dow = date.weekday()
        
        # Weekend = higher chance of absence
        base_absent_prob = 0.1 if dow < 5 else 0.3
        
        # Month effect
        month = date.month
        if month in [6, 7, 8]:  # Summer
            base_absent_prob += 0.05
        
        # Holiday effect
        is_holiday = 1 if date.day in [1, 15, 26] and date.month in [1, 8, 12] else 0
        if is_holiday:
            base_absent_prob += 0.2
        
        # Random variation
        absent = 1 if np.random.random() < base_absent_prob else 0
        
        data.append({
            "date": date,
            "day_of_week": dow,
            "month": month,
            "is_holiday": is_holiday,
            "absent": absent
        })
    
    return pd.DataFrame(data)

def train_model():
    """Train Random Forest model for attendance prediction."""
    df = generate_attendance_data()
    
    # Create lag features (consecutive absences)
    df["prev_absent"] = df["absent"].shift(1).fillna(0)
    df["prev2_absent"] = df["absent"].shift(2).fillna(0)
    df = df.dropna()
    
    features = ["day_of_week", "month", "is_holiday", "prev_absent", "prev2_absent"]
    X = df[features]
    y = df["absent"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=8,
        random_state=42
    )
    model.fit(X_train, y_train)
    
    # Evaluate
    from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
    
    y_pred = model.predict(X_test)
    print(f"✅ Attendance Model - Accuracy: {accuracy_score(y_test, y_pred):.2f}")
    print(f"✅ Attendance Model - F1: {f1_score(y_test, y_pred):.2f}")
    
    # Save model
    os.makedirs("ml/pipelines/doctor_attendance/models", exist_ok=True)
    with open("ml/pipelines/doctor_attendance/models/model.pkl", "wb") as f:
        pickle.dump(model, f)
    
    return model

if __name__ == "__main__":
    train_model()