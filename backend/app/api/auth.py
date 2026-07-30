"""Authentication API routes"""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from typing import Optional
import re

from app.database import get_db
from app.config import settings
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# Password strength validation
class PasswordValidationResult(BaseModel):
    """Result of password strength validation"""
    is_valid: bool
    errors: list[str] = []
    strength: str  # "weak", "medium", "strong", "very_strong"


def validate_password_strength(password: str) -> PasswordValidationResult:
    """
    Validate password strength according to REQ-AUTH-006.

    Requirements:
    - At least 8 characters
    - At least 1 uppercase letter
    - At least 1 lowercase letter
    - At least 1 digit

    Returns validation result with errors and strength level.
    """
    errors = []

    # Check length
    if len(password) < 8:
        errors.append("密码长度至少8个字符")

    # Check uppercase
    if not re.search(r'[A-Z]', password):
        errors.append("密码需包含至少1个大写字母")

    # Check lowercase
    if not re.search(r'[a-z]', password):
        errors.append("密码需包含至少1个小写字母")

    # Check digit
    if not re.search(r'\d', password):
        errors.append("密码需包含至少1个数字")

    # Determine strength
    if errors:
        strength = "weak"
    elif len(password) >= 12 and re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        strength = "very_strong"
    elif len(password) >= 8:
        strength = "strong"
    else:
        strength = "medium"

    is_valid = len(errors) == 0

    return PasswordValidationResult(
        is_valid=is_valid,
        errors=errors,
        strength=strength
    )


# Pydantic schemas
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


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
    """Register a new user"""
    # Validate password strength (REQ-AUTH-006)
    validation = validate_password_strength(user_create.password)
    if not validation.is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
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

    # Create user
    hashed_password = get_password_hash(user_create.password)
    db_user = User(
        username=user_create.username,
        email=user_create.email,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

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
