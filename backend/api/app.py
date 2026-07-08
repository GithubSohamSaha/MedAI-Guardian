from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from starlette.middleware.base import BaseHTTPMiddleware
import os

from backend.api.middleware.auth import AuthMiddleware
from backend.api.middleware.logging import LoggingMiddleware
from backend.api.middleware.rate_limit import RateLimitMiddleware
from backend.api.routers import auth, medicines, patients, beds, doctors, dashboard, ai, alerts
from backend.api.services.database import engine, Base
from backend.api.services.redis_client import RedisClient
import asyncio
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Initialize Redis
    await RedisClient.initialize()
    
    yield
    
    # Shutdown
    await RedisClient.close()
    await engine.dispose()

app = FastAPI(
    title="MedAI Guardian API",
    description="AI-Powered Smart Health Monitoring for PHCs",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000","https://med-ai-guardian.vercel.app",],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],  # Important: allows Authorization header
)

# Custom Middleware
#app.add_middleware(RateLimitMiddleware)
app.add_middleware(LoggingMiddleware)
#app.add_middleware(AuthMiddleware)

# Static Files
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

# Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(medicines.router, prefix="/api/v1/medicines", tags=["Medicines"])
app.include_router(patients.router, prefix="/api/v1/patients", tags=["Patients"])
app.include_router(beds.router, prefix="/api/v1/beds", tags=["Beds"])
app.include_router(doctors.router, prefix="/api/v1/doctors", tags=["Doctors"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Dashboard"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["AI"])
app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["Alerts"])

@app.get("/health")
async def health_check():
    """Health check endpoint for Cloud Run."""
    return {"status": "healthy", "service": "medai-guardian"}

@app.get("/")
async def root():
    return {
        "message": "MedAI Guardian API",
        "docs": "/docs",
        "health": "/health"
    }