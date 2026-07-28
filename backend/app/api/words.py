"""Word bank and words API routes"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from app.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.word import WordBank, Word

router = APIRouter(prefix="/api", tags=["words"])


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
