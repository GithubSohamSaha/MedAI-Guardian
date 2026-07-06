import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
import json
import os

from data.synthetic.phc_data import PHC_DATA
from data.synthetic.medicine_data import MEDICINE_DATA

class SyntheticDataGenerator:
    """Generate synthetic data for PHC operations."""
    
    def __init__(self):
        self.phcs = PHC_DATA
        self.medicines = MEDICINE_DATA
        self.start_date = datetime(2026, 1, 1)
        self.end_date = datetime(2026, 7, 1)
        
    def generate_phc_data(self):
        """Generate PHC records."""
        phcs = []
        for phc in self.phcs:
            phcs.append({
                "id": phc["id"],
                "name": phc["name"],
                "district": phc["district"],
                "block": phc.get("block", "Unknown"),
                "latitude": phc.get("latitude", None),
                "longitude": phc.get("longitude", None)
            })
        return phcs
    
    def generate_stock_transactions(self, num_transactions=5000):
        """Generate stock transaction history."""
        transactions = []
        current_stocks = {}
        
        # Initialize stock levels
        for phc in self.phcs:
            for med in self.medicines:
                key = f"{phc['id']}_{med['id']}"
                current_stocks[key] = random.randint(100, 500)
        
        dates = pd.date_range(start=self.start_date, end=self.end_date, freq='H')
        
        for _ in range(num_transactions):
            phc = random.choice(self.phcs)
            med = random.choice(self.medicines)
            key = f"{phc['id']}_{med['id']}"
            
            # Random transaction type
            txn_type = random.choices(
                ["consumption", "addition", "transfer"],
                weights=[0.6, 0.3, 0.1]
            )[0]
            
            if txn_type == "consumption":
                qty = -random.randint(1, 20)
            elif txn_type == "addition":
                qty = random.randint(10, 100)
            else:
                qty = random.randint(-30, -5)
            
            # Update stock
            new_stock = current_stocks.get(key, 0) + qty
            current_stocks[key] = max(0, new_stock)
            
            # Record transaction
            date = random.choice(dates)
            transactions.append({
                "medicine_id": med["id"],
                "phc_id": phc["id"],
                "quantity_change": qty,
                "transaction_type": txn_type,
                "recorded_at": date.isoformat(),
                "current_stock_after": current_stocks[key],
                "user_id": random.randint(1, 10)
            })
        
        return transactions
    
    def generate_patient_visits(self, num_visits=3000):
        """Generate patient visit records."""
        visits = []
        diseases = ["Fever", "Cough", "Cold", "Diarrhea", "Skin Rash", 
                    "Malaria", "Dengue", "Typhoid", "Viral Fever", "COVID-19",
                    "Respiratory Infection", "Gastroenteritis"]
        
        dates = pd.date_range(start=self.start_date, end=self.end_date, freq='H')
        
        # Seasonal pattern: more visits in summer
        for _ in range(num_visits):
            phc = random.choice(self.phcs)
            date = random.choice(dates)
            
            # Seasonal adjustment
            month = date.month
            seasonal_factor = 1 + 0.5 * np.sin(month / 6 * np.pi)
            
            base_count = random.poisson(10 * seasonal_factor)
            
            for _ in range(base_count):
                visits.append({
                    "phc_id": phc["id"],
                    "visit_date": date.isoformat(),
                    "patient_id": f"P{random.randint(1000, 9999)}",
                    "symptoms": random.sample(diseases, random.randint(1, 3)),
                    "diagnosis": random.choice(diseases),
                    "wait_time_min": random.randint(5, 120),
                    "is_emergency": random.random() < 0.05
                })
        
        return visits
    
    def generate_bed_data(self):
        """Generate bed availability data."""
        beds = []
        bed_types = ["ICU", "General", "Oxygen", "Pediatric", "Isolation"]
        
        for phc in self.phcs:
            for bed_type in bed_types:
                total = random.randint(2, 10) if bed_type != "General" else random.randint(5, 20)
                occupied = random.randint(0, total)
                beds.append({
                    "phc_id": phc["id"],
                    "bed_type": bed_type,
                    "total": total,
                    "occupied": occupied,
                    "available": total - occupied,
                    "last_updated": datetime.now().isoformat()
                })
        
        return beds
    
    def generate_doctor_data(self):
        """Generate doctor data with attendance patterns."""
        doctors = []
        specializations = ["General Medicine", "Pediatrics", "Gynecology", "Surgery", "Orthopedics"]
        
        for phc in self.phcs:
            num_doctors = random.randint(2, 5)
            for i in range(num_doctors):
                doctor = {
                    "id": len(doctors) + 1,
                    "name": f"Dr. {random.choice(['Sharma', 'Patel', 'Kumar', 'Singh', 'Gupta'])}",
                    "specialization": random.choice(specializations),
                    "phone": f"+91{random.randint(7000000000, 9999999999)}",
                    "email": f"doc{len(doctors)+1}@{random.choice(['gmail.com', 'hospital.com'])}",
                    "phc_id": phc["id"],
                    "attendance_rate": random.uniform(0.6, 0.95)
                }
                
                # Generate attendance records
                attendance = []
                dates = pd.date_range(start=self.start_date, end=self.end_date, freq='D')
                for date in dates:
                    # Random absence pattern
                    if random.random() < 0.1:  # 10% chance absent
                        present = False
                    elif date.weekday() >= 5:  # Weekend
                        present = random.random() < 0.7
                    else:
                        present = random.random() < 0.9
                    
                    attendance.append({
                        "doctor_id": doctor["id"],
                        "date": date.isoformat(),
                        "present": present,
                        "check_in_time": (date + timedelta(hours=random.randint(8, 10))).isoformat() if present else None,
                        "check_out_time": (date + timedelta(hours=random.randint(16, 18))).isoformat() if present else None
                    })
                
                doctor["attendance"] = attendance
                doctors.append(doctor)
        
        return doctors
    
    def generate_disease_outbreak_data(self):
        """Generate disease outbreak simulation."""
        outbreaks = []
        diseases = ["Malaria", "Dengue", "Viral Fever", "Cholera", "COVID-19"]
        
        # Simulate outbreaks in specific periods
        for disease in diseases:
            for phc in self.phcs:
                # Random outbreak
                if random.random() < 0.3:
                    start_date = self.start_date + timedelta(days=random.randint(30, 120))
                    end_date = start_date + timedelta(days=random.randint(7, 21))
                    
                    days = pd.date_range(start=start_date, end=end_date, freq='D')
                    peak = random.randint(20, 50)
                    
                    for i, date in enumerate(days):
                        cases = int(peak * np.exp(-((i - len(days)/2) ** 2) / (2 * (len(days)/4) ** 2)))
                        if cases > 0:
                            outbreaks.append({
                                "phc_id": phc["id"],
                                "disease": disease,
                                "date": date.isoformat(),
                                "cases": cases,
                                "alert_level": "WARNING" if cases > 10 else "NORMAL"
                            })
        
        return outbreaks
    
    def save_all_data(self, output_dir="data/synthetic/sample_output"):
        """Save all generated data to JSON files."""
        os.makedirs(output_dir, exist_ok=True)
        
        data = {
            "phcs": self.generate_phc_data(),
            "stock_transactions": self.generate_stock_transactions(5000),
            "patient_visits": self.generate_patient_visits(3000),
            "beds": self.generate_bed_data(),
            "doctors": self.generate_doctor_data(),
            "disease_outbreaks": self.generate_disease_outbreak_data()
        }
        
        for name, records in data.items():
            filepath = os.path.join(output_dir, f"{name}.json")
            with open(filepath, 'w') as f:
                json.dump(records, f, indent=2)
            print(f"✅ Saved {len(records)} {name} records to {filepath}")
        
        return data

if __name__ == "__main__":
    generator = SyntheticDataGenerator()
    generator.save_all_data()