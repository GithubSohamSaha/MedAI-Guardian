import os
import json
import pickle
import logging
from abc import ABC, abstractmethod
from datetime import datetime
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)

class BaseTrainer(ABC):
    """Base class for model trainers."""
    
    def __init__(self, model_name: str, model_dir: str):
        self.model_name = model_name
        self.model_dir = model_dir
        self.model = None
        self.metrics = {}
        
        os.makedirs(model_dir, exist_ok=True)
    
    @abstractmethod
    def load_data(self) -> pd.DataFrame:
        """Load training data."""
        pass
    
    @abstractmethod
    def preprocess(self, df: pd.DataFrame) -> tuple:
        """Preprocess data and return X, y."""
        pass
    
    @abstractmethod
    def train(self, X, y):
        """Train the model."""
        pass
    
    def save_model(self):
        """Save model and metadata."""
        if self.model is None:
            raise ValueError("Model not trained yet")
        
        # Save model
        model_path = os.path.join(self.model_dir, "model.pkl")
        with open(model_path, "wb") as f:
            pickle.dump(self.model, f)
        
        # Save metadata
        metadata = {
            "model_name": self.model_name,
            "trained_at": datetime.now().isoformat(),
            "metrics": self.metrics
        }
        with open(os.path.join(self.model_dir, "metadata.json"), "w") as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"Model saved to {model_path}")
    
    def run(self):
        """Run the training pipeline."""
        logger.info(f"Training {self.model_name}...")
        
        # Load data
        df = self.load_data()
        logger.info(f"Loaded {len(df)} samples")
        
        # Preprocess
        X, y = self.preprocess(df)
        logger.info(f"Features: {X.shape[1]}, Samples: {X.shape[0]}")
        
        # Train
        self.train(X, y)
        logger.info("Training completed")
        
        # Save
        self.save_model()
        
        return self.model, self.metrics