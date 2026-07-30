"""Word bank and words API routes"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from pathlib import Path
import logging

from app.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.word import WordBank, Word
from app.services.pronunciation_service import pronunciation_service, Accent

router = APIRouter(prefix="/api", tags=["words"])
logger = logging.getLogger(__name__)


# Pydantic schemas
class WordBankResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    total_words: int

    class Config:
        from_attributes = True


class WordResponse(BaseModel):
    id: int
    spelling: str
    phonetic: Optional[str]
    pronunciation_url: Optional[str]
    meaning: str
    example_sentence: Optional[str]

    class Config:
        from_attributes = True


class WordListResponse(BaseModel):
    words: List[WordResponse]
    total: int


# API endpoints
@router.get("/word-banks", response_model=List[WordBankResponse])
def get_word_banks(db: Session = Depends(get_db)):
    """Get all available word banks"""
    word_banks = db.query(WordBank).all()
    return word_banks


@router.get("/word-banks/{word_bank_id}/words", response_model=WordListResponse)
def get_words_by_bank(
    word_bank_id: int,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Get words from a specific word bank"""
    # Check if word bank exists
    word_bank = db.query(WordBank).filter(WordBank.id == word_bank_id).first()
    if not word_bank:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Word bank not found"
        )

    # Get words
    query = db.query(Word).filter(Word.word_bank_id == word_bank_id)
    total = query.count()
    words = query.order_by(Word.order_index).offset(skip).limit(limit).all()

    return {"words": words, "total": total}


@router.get("/words/{word_id}", response_model=WordResponse)
def get_word_detail(word_id: int, db: Session = Depends(get_db)):
    """Get detailed information of a word"""
    word = db.query(Word).filter(Word.id == word_id).first()
    if not word:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Word not found"
        )
    return word


class PronunciationResponse(BaseModel):
    """Pronunciation response schema"""
    url: Optional[str] = None
    available: bool
    accent: str


@router.get("/words/{word_id}/pronunciation")
async def get_word_pronunciation(
    word_id: int,
    accent: str = "us",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get pronunciation audio for a word.

    REQ-WORD-003: 发音播放功能

    Args:
        word_id: Word ID
        accent: Accent type (us or uk), default us

    Returns:
        - 200: Audio file stream or JSON with URL
        - 404: Word not found or pronunciation not available
        - 422: Invalid accent parameter
    """
    # Validate accent
    try:
        accent_enum = Accent(accent.lower())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid accent '{accent}'. Must be 'us' or 'uk'."
        )

    # Get word
    word = db.query(Word).filter(Word.id == word_id).first()
    if not word:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Word not found"
        )

    # Check if pronunciation service is configured
    if not pronunciation_service.is_configured():
        # Development mode: return friendly error without blocking
        logger.warning(f"Pronunciation service not configured (word_id={word_id})")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="发音服务未配置"
        )

    # Get audio URL
    audio_url = await pronunciation_service.get_audio(word.spelling, accent_enum)

    if not audio_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="发音加载失败，请稍后重试"
        )

    # Check if we have a cached file to serve directly
    cache_path = Path(__file__).parent.parent / "media" / "audio" / accent_enum.value / f"{word.spelling.lower()}.mp3"
    if cache_path.exists():
        return FileResponse(
            path=cache_path,
            media_type="audio/mpeg",
            filename=f"{word.spelling}_{accent}.mp3"
        )

    # Otherwise return the URL
    return {"url": audio_url, "available": True, "accent": accent}
