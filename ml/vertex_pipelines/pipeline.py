import kfp
from kfp import dsl
from kfp.dsl import component, Output, Artifact, Metrics, Dataset
from typing import NamedTuple
import os

@component(
    base_image="python:3.10-slim",
    packages_to_install=["pandas", "scikit-learn", "xgboost", "google-cloud-storage"]
)
def load_data_component(
    data_path: str,
    output_dataset: Output[Dataset]
):
    import pandas as pd
    import pickle
    
    # Load data from GCS
    df = pd.read_csv(data_path)
    
    # Save as artifact
    with open(output_dataset.path, "wb") as f:
        pickle.dump(df, f)

@component(
    base_image="python:3.10-slim",
    packages_to_install=["pandas", "scikit-learn", "xgboost"]
)
def train_model_component(
    input_dataset: Input[Dataset],
    model: Output[Artifact],
    metrics: Output[Metrics]
):
    import pickle
    import pandas as pd
    from sklearn.model_selection import train_test_split
    import xgboost as xgb
    from sklearn.metrics import mean_absolute_error, r2_score
    
    # Load dataset
    with open(input_dataset.path, "rb") as f:
        df = pickle.load(f)
    
    # Prepare features
    X = df[["current_stock", "avg_daily_consumption", "reorder_level", "day_of_week", "month"]]
    y = df["days_remaining"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train
    model = xgb.XGBRegressor(n_estimators=100, learning_rate=0.1, max_depth=5)
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    # Save model
    with open(model.path, "wb") as f:
        pickle.dump(model, f)
    
    # Log metrics
    metrics.log_metric("mae", mae)
    metrics.log_metric("r2", r2)

@dsl.pipeline(
    name="medai-stock-forecast-pipeline",
    description="Train stock forecast model"
)
def stock_forecast_pipeline(
    data_path: str = "gs://medai-guardian-models/data/stock_data.csv"
):
    load_task = load_data_component(data_path=data_path)
    train_task = train_model_component(input_dataset=load_task.outputs["output_dataset"])

# Compile pipeline
if __name__ == "__main__":
    kfp.compiler.Compiler().compile(
        stock_forecast_pipeline,
        "stock_forecast_pipeline.yaml"
    )