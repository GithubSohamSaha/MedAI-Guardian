import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from backend.api.models.base import Base
from backend.api.models.user import User, UserRole  # <-- Import UserRole
from backend.api.models.phc import PHC
from backend.api.services.auth import hash_password
from backend.api.services.database import DATABASE_URL
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
            print("✅ Created PHC")
        else:
            print("ℹ️ PHC already exists")
        
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
            print("✅ Demo user created")
        else:
            print("ℹ️ Demo user already exists")
        
        await session.commit()
        print("✅ Database seeding complete!")
        print("🔑 Login with email: demo@medai.com and password: demo123")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed())