import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import xgboost as xgb
import pickle
import os
from datetime import datetime

def generate_training_data():
    """Generate synthetic stock data for training."""
    np.random.seed(42)
    
    n_samples = 5000
    data = {
        "current_stock": np.random.randint(10, 500, n_samples),
        "avg_daily_consumption": np.random.uniform(1, 20, n_samples),
        "reorder_level": np.random.randint(20, 80, n_samples),
        "day_of_week": np.random.randint(0, 7, n_samples),
        "month": np.random.randint(1, 13, n_samples),
        "is_holiday": np.random.randint(0, 2, n_samples),
        "seasonal_factor": np.random.uniform(0.5, 1.5, n_samples)
    }
    
    df = pd.DataFrame(data)
    
    # Calculate days remaining (target)
    df["days_remaining"] = (
        df["current_stock"] / 
        (df["avg_daily_consumption"] * df["seasonal_factor"])
    )
    df["days_remaining"] = df["days_remaining"].clip(0, 30)
    
    return df

def train_model():
    """Train XGBoost model for stock forecast."""
    df = generate_training_data()
    
    features = ["current_stock", "avg_daily_consumption", "reorder_level", 
                "day_of_week", "month", "is_holiday", "seasonal_factor"]
    X = df[features]
    y = df["days_remaining"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = xgb.XGBRegressor(
        n_estimators=200,
        learning_rate=0.05,
        max_depth=6,
        random_state=42,
        tree_method="hist"
    )
    model.fit(X_train, y_train)
    
    # Evaluate
    from sklearn.metrics import mean_absolute_error, r2_score
    y_pred = model.predict(X_test)
    
    print(f"✅ Stock Model - MAE: {mean_absolute_error(y_test, y_pred):.2f}")
    print(f"✅ Stock Model - R²: {r2_score(y_test, y_pred):.2f}")
    
    # Save model
    os.makedirs("ml/pipelines/stock_forecast/models", exist_ok=True)
    with open("ml/pipelines/stock_forecast/models/model.pkl", "wb") as f:
        pickle.dump(model, f)
    
    # Save scaler
    scaler = StandardScaler()
    scaler.fit(X_train)
    with open("ml/pipelines/stock_forecast/models/scaler.pkl", "wb") as f:
        pickle.dump(scaler, f)
    
    return model, scaler

if __name__ == "__main__":
    train_model()