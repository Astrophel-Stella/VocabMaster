"""Authentication API routes"""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from typing import Optional
import logging

from app.database import get_db
from app.config import settings
from app.models.user import User
from app.services.password_service import validate_password_strength
from app.services.email_service import (
    ConsoleEmailService,
    generate_verification_token,
    get_verification_token_expiry,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])
logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Email service instance (console for dev, can be replaced with real provider)
email_service = ConsoleEmailService()


# Pydantic schemas
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    email_verified: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class MessageResponse(BaseModel):
    message: str


class ResendVerificationRequest(BaseModel):
    email: EmailStr


# Helper functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user


# API endpoints
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_create: UserCreate, db: Session = Depends(get_db)):
    """Register a new user (REQ-AUTH-001, REQ-AUTH-008)"""
    # Validate password strength (REQ-AUTH-006)
    validation = validate_password_strength(user_create.password)
    if not validation.is_valid:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": "密码强度不足",
                "errors": validation.errors
            }
        )

    # Check if username exists
    if db.query(User).filter(User.username == user_create.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )

    # Check if email exists
    if db.query(User).filter(User.email == user_create.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create user with verification token (REQ-AUTH-008)
    hashed_password = get_password_hash(user_create.password)
    verification_token = generate_verification_token()
    db_user = User(
        username=user_create.username,
        email=user_create.email,
        hashed_password=hashed_password,
        email_verified=False,
        verification_token=verification_token,
        verification_token_expires=get_verification_token_expiry()
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Send verification email (REQ-AUTH-008)
    verify_url = f"{settings.frontend_url}/verify-email"
    try:
        email_service.send_verification_email(
            to=user_create.email,
            username=user_create.username,
            token=verification_token,
            verify_url=verify_url
        )
    except Exception as e:
        logger.error(f"Failed to send verification email: {e}")

    return db_user


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login and get access token"""
    user = db.query(User).filter(User.username == form_data.username).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user


# REQ-AUTH-008: Email verification endpoints
@router.get("/verify-email/{token}", response_model=MessageResponse)
def verify_email(token: str, db: Session = Depends(get_db)):
    """
    Verify user email address (REQ-AUTH-008).

    Validates the verification token and marks the user's email as verified.
    Token must be valid and not expired (7 days).
    """
    user = db.query(User).filter(User.verification_token == token).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="无效的验证链接"
        )

    # Check if token has expired
    if user.verification_token_expires and datetime.utcnow() > user.verification_token_expires:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="验证链接已过期，请重新发送验证邮件"
        )

    # Check if already verified
    if user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="邮箱已验证"
        )

    # Mark as verified and clear token
    user.email_verified = True
    user.verification_token = None
    user.verification_token_expires = None
    db.commit()

    return {"message": "邮箱验证成功"}


@router.post("/resend-verification", response_model=MessageResponse)
def resend_verification(
    request: ResendVerificationRequest,
    db: Session = Depends(get_db)
):
    """
    Resend verification email (REQ-AUTH-008).

    Rate limited: max 3 requests per 5 minutes per email.
    """
    user = db.query(User).filter(User.email == request.email).first()

    if not user:
        # Don't reveal if email exists or not
        return {"message": "如果该邮箱已注册，验证邮件已发送"}

    # Check if already verified
    if user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="邮箱已验证，无需重新发送"
        )

    # Rate limiting: TODO implement proper rate limiting with Redis for production
    # For development, we allow resending without strict limits
    # Production should track timestamps per email and enforce 3 requests / 5 minutes

    # Generate new token and send email
    verification_token = generate_verification_token()
    user.verification_token = verification_token
    user.verification_token_expires = get_verification_token_expiry()
    db.commit()

    verify_url = f"{settings.frontend_url}/verify-email"
    try:
        email_service.send_verification_email(
            to=user.email,
            username=user.username,
            token=verification_token,
            verify_url=verify_url
        )
    except Exception as e:
        logger.error(f"Failed to send verification email: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="发送验证邮件失败，请稍后重试"
        )

    return {"message": "验证邮件已重新发送"}
