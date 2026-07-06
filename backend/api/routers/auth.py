from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta
from typing import Optional

from backend.api.services.database import get_db
from backend.api.models.user import User, UserRole
from backend.api.services.auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, oauth2_scheme
)
from backend.api.schemas import (
    UserCreate, UserLogin, Token, UserResponse,
    UserPublic, UserUpdate, ChangePasswordRequest
)
from backend.api.services import send_verification_email

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=201)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user."""
    # Check existing user
    result = await db.execute(
        select(User).where(User.email == user_data.email)
    )
    if result.scalar_one_or_none():
        raise HTTPException(400, "Email already registered")
    
    result = await db.execute(
        select(User).where(User.username == user_data.username)
    )
    if result.scalar_one_or_none():
        raise HTTPException(400, "Username already taken")
    
    # Hash password
    hashed = hash_password(user_data.password)
    
    # Create user
    new_user = User(
        username=user_data.username,
        email=user_data.email.lower(),
        password_hash=hashed,
        role=UserRole.HEALTH_WORKER,
        phc_id=user_data.phc_id,
        phone=user_data.phone
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    # Send verification email (background)
    # background_tasks.add_task(send_verification_email, new_user.email)
    
    return new_user

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """Login with email and password."""
    result = await db.execute(
        select(User).where(User.email == form_data.username)
    )
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    if not user.is_active:
        raise HTTPException(401, "Account is deactivated")
    
    # Update last login
    from datetime import datetime, timezone
    user.last_login = datetime.now(timezone.utc)
    await db.commit()
    
    # After verifying password, before creating token:
    role = user.role.value if user.role else "HEALTH_WORKER"
    access_token = create_access_token({"sub": str(user.id), "role": role})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user)
    }

@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user)
):
    """Logout user (client-side token removal)."""
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user)
):
    """Get current user details."""
    return current_user

@router.patch("/me", response_model=UserResponse)
async def update_me(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update current user profile."""
    if user_update.username:
        current_user.username = user_update.username
    if user_update.phone:
        current_user.phone = user_update.phone
    if user_update.image_file:
        current_user.image_file = user_update.image_file
    
    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Change user password."""
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(400, "Current password is incorrect")
    
    current_user.password_hash = hash_password(data.new_password)
    await db.commit()
    
    return {"message": "Password changed successfully"}

@router.post("/request-reset")
async def request_password_reset(
    email: str,
    db: AsyncSession = Depends(get_db)
):
    """Request password reset email."""
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if user:
        # Generate reset token and send email
        pass
    
    return {"message": "If an account exists, you will receive reset instructions"}

@router.post("/reset-password")
async def reset_password(
    token: str,
    new_password: str,
    db: AsyncSession = Depends(get_db)
):
    """Reset password using token."""
    # Validate token and update password
    return {"message": "Password reset successfully"}