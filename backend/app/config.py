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

    # Pronunciation API (optional - REQ-WORD-003)
    youdao_app_key: Optional[str] = None
    youdao_app_secret: Optional[str] = None
    baidu_app_id: Optional[str] = None
    baidu_secret_key: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
