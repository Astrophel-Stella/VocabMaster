"""Configuration management using Pydantic Settings"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings"""

    # Database
    database_url: str = "sqlite:///./vocabmaster.db"

    # JWT
    secret_key: str = "change-this-secret-key-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # App
    app_name: str = "VocabMaster API"
    debug: bool = True

    # Email (ADR-0012)
    email_provider: str = "console"  # "console" for dev/test, "aliyun" for production
    frontend_url: str = "http://localhost:5173"  # Frontend URL for email links

    # Pronunciation API (optional - REQ-WORD-003)
    youdao_app_key: Optional[str] = None
    youdao_app_secret: Optional[str] = None
    baidu_app_id: Optional[str] = None
    baidu_secret_key: Optional[str] = None

    # Pronunciation public provider (keyless fallback - SOU-42)
    # Youdao dictionary voice is a free, keyless public endpoint that returns
    # an mp3 for a given word. It guarantees pronunciation works out of the box
    # in production without provisioning any commercial API key. Configurable so
    # the host is never hardcoded in code (SOU-35).
    pronunciation_public_enabled: bool = True
    pronunciation_public_base_url: str = "https://dict.youdao.com/dictvoice"

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
