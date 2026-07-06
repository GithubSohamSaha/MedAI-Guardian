import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
import xgboost as xgb
import pickle
import os
import random

def generate_data():
    np.random.seed(42)
    dates = pd.date_range(start="2026-01-01", end="2026-07-01")
    data = []
    for d in dates:
        base_consumption = 5 + 3 * np.sin(d.dayofyear / 30) + random.randint(-2, 2)
        for _ in range(20):
            stock = random.randint(30, 200)
            consumption = max(1, int(base_consumption + random.randint(-3, 3)))
            reorder = random.randint(20, 60)
            data.append([stock, consumption, reorder, d.dayofweek, d.month])
    
    df = pd.DataFrame(data, columns=["current_stock", "avg_daily_consumption", "reorder_level", "day_of_week", "month"])
    df["days_remaining"] = df["current_stock"] / df["avg_daily_consumption"]
    df["days_remaining"] = df["days_remaining"].clip(upper=30)
    return df

df = generate_data()
X = df[["current_stock", "avg_daily_consumption", "reorder_level", "day_of_week", "month"]]
y = df["days_remaining"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = xgb.XGBRegressor(n_estimators=100, learning_rate=0.1, max_depth=5, random_state=42)
model.fit(X_train, y_train)

os.makedirs("ml", exist_ok=True)
with open("ml/model.pkl", "wb") as f:
    pickle.dump(model, f)

print("✅ Model trained and saved to ml/model.pkl")
print(f"📊 R² Score: {model.score(X_test, y_test):.2f}")