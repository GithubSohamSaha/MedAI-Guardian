import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, func
from backend.api.models.base import Base
from backend.api.models.user import User, UserRole  # <-- Import UserRole
from backend.api.models.phc import PHC
from backend.api.models.medicine import Medicine, StockTransaction
from backend.api.models.bed import Bed
from backend.api.models.doctor import Doctor, DoctorAttendance
from backend.api.models.patient import PatientVisit
from backend.api.models.alert import Alert, AlertSeverity, AlertType
from backend.api.services.auth import hash_password
from backend.api.services.database import DATABASE_URL
from datetime import datetime, timezone, timedelta
import sys


if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def seed():
    engine = create_async_engine(DATABASE_URL)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Check if PHC exists
        phc_result = await session.execute(select(PHC).where(PHC.name == "Barmana PHC"))
        phc = phc_result.scalar_one_or_none()
        if not phc:
            phc = PHC(name="Barmana PHC", district="Bilaspur")
            session.add(phc)
            await session.flush()
            print("Created PHC")
        else:
            print("PHC already exists")
        
        # Check if demo user exists
        user_result = await session.execute(
            select(User).where(User.email == "demo@medai.com")
        )
        user = user_result.scalar_one_or_none()
        if not user:
            user = User(
                username="admin",
                email="demo@medai.com",
                password_hash=hash_password("demo123"),
                phc_id=phc.id,
                role=UserRole.SUPER_ADMIN.value   # <-- Use valid enum value
            )
            session.add(user)
            await session.commit()
            print("Demo user created")
        else:
            user.phc_id = user.phc_id or phc.id
            print("Demo user already exists")

        now = datetime.now(timezone.utc)
        existing_medicines = await session.execute(select(Medicine))
        for medicine in existing_medicines.scalars().all():
            if medicine.current_stock is None:
                medicine.current_stock = 0
            if medicine.reorder_level is None:
                medicine.reorder_level = 50
            if medicine.buffer_stock is None:
                medicine.buffer_stock = 25
            if not medicine.unit:
                medicine.unit = "units"
            if medicine.last_updated is None:
                medicine.last_updated = now

        medicines = [
            ("Paracetamol 500mg", "Analgesic", 180, 120, 40, -18),
            ("Amoxicillin 250mg", "Antibiotic", 46, 80, 30, -9),
            ("ORS Sachets", "Emergency", 320, 100, 60, -22),
            ("Insulin Regular", "Diabetes", 18, 35, 12, -3),
            ("Cetirizine 10mg", "Antihistamine", 210, 75, 30, -11),
            ("Iron Folic Acid", "Maternal Care", 92, 140, 50, -16),
        ]

        for name, category, stock, reorder, buffer, consumption in medicines:
            result = await session.execute(
                select(Medicine).where(Medicine.name == name, Medicine.phc_id == phc.id)
            )
            medicine = result.scalar_one_or_none()
            if not medicine:
                medicine = Medicine(
                    name=name,
                    category=category,
                    current_stock=stock,
                    reorder_level=reorder,
                    buffer_stock=buffer,
                    unit="units",
                    phc_id=phc.id,
                )
                session.add(medicine)
                await session.flush()

            tx_count = await session.execute(
                select(func.count()).where(StockTransaction.medicine_id == medicine.id)
            )
            if (tx_count.scalar() or 0) == 0:
                for days_ago in range(1, 8):
                    session.add(
                        StockTransaction(
                            medicine_id=medicine.id,
                            quantity_change=consumption,
                            transaction_type="consumption",
                            recorded_at=datetime.now(timezone.utc) - timedelta(days=days_ago),
                            user_id=user.id,
                            notes="Demo daily dispensing",
                        )
                    )

        beds = [("General", 28, 21), ("Oxygen", 10, 8), ("ICU", 4, 4), ("Pediatric", 8, 3)]
        for bed_type, total, occupied in beds:
            result = await session.execute(select(Bed).where(Bed.phc_id == phc.id, Bed.bed_type == bed_type))
            bed = result.scalar_one_or_none()
            if not bed:
                session.add(
                    Bed(
                        bed_type=bed_type,
                        total=total,
                        occupied=occupied,
                        available=total - occupied,
                        phc_id=phc.id,
                    )
                )

        doctors = [
            ("Dr. Asha Mehta", "General Medicine", "9000000001"),
            ("Dr. Kabir Rao", "Pediatrics", "9000000002"),
            ("Dr. Neha Singh", "Obstetrics", "9000000003"),
        ]
        for name, specialization, phone in doctors:
            result = await session.execute(select(Doctor).where(Doctor.phc_id == phc.id, Doctor.name == name))
            doctor = result.scalar_one_or_none()
            if not doctor:
                doctor = Doctor(
                    name=name,
                    specialization=specialization,
                    phone=phone,
                    attendance_rate=0.86,
                    phc_id=phc.id,
                )
                session.add(doctor)
                await session.flush()

            today = datetime.now(timezone.utc).date()
            result = await session.execute(
                select(DoctorAttendance).where(
                    DoctorAttendance.doctor_id == doctor.id,
                    func.date(DoctorAttendance.date) == today,
                )
            )
            if not result.scalar_one_or_none():
                session.add(
                    DoctorAttendance(
                        doctor_id=doctor.id,
                        present=name != "Dr. Kabir Rao",
                        check_in_time=datetime.now(timezone.utc).replace(hour=9, minute=10, second=0, microsecond=0),
                    )
                )

        visit_count = await session.execute(select(func.count()).where(PatientVisit.phc_id == phc.id))
        if (visit_count.scalar() or 0) == 0:
            diagnoses = ["Viral fever", "Antenatal checkup", "Respiratory infection", "Minor injury", "Diabetes follow-up"]
            for index in range(42):
                session.add(
                    PatientVisit(
                        phc_id=phc.id,
                        visit_date=datetime.now(timezone.utc) - timedelta(days=index % 7, hours=index % 5),
                        symptoms=["fever", "cough"] if index % 3 == 0 else ["routine"],
                        diagnosis=diagnoses[index % len(diagnoses)],
                        wait_time_min=18 + (index % 24),
                        is_emergency=1 if index % 11 == 0 else 0,
                    )
                )

        alert_count = await session.execute(
            select(func.count()).where(Alert.phc_id == phc.id, Alert.is_resolved == False)
        )
        if (alert_count.scalar() or 0) == 0:
            session.add_all(
                [
                    Alert(
                        phc_id=phc.id,
                        user_id=user.id,
                        alert_type=AlertType.STOCK_OUT,
                        severity=AlertSeverity.HIGH,
                        title="Insulin below reorder level",
                        description="Regular insulin has 18 units against a reorder level of 35.",
                    ),
                    Alert(
                        phc_id=phc.id,
                        user_id=user.id,
                        alert_type=AlertType.BED_SHORTAGE,
                        severity=AlertSeverity.CRITICAL,
                        title="ICU capacity exhausted",
                        description="All ICU beds are currently occupied.",
                    ),
                ]
            )
        
        await session.commit()
        print("Database seeding complete!")
        print("Login with email: demo@medai.com and password: demo123")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed())
