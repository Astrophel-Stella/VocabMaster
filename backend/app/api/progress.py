"""Learning progress API routes"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from app.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.word import Word, WordBank
from app.models.progress import LearningProgress

router = APIRouter(prefix="/api/progress", tags=["progress"])


# Pydantic schemas
class ProgressResponse(BaseModel):
    word_id: int
    is_mastered: bool
    mastered_at: datetime | None = None

    class Config:
        from_attributes = True


class ProgressStats(BaseModel):
    total_words: int
    mastered_words: int
    progress_percentage: float


class ProgressOverview(BaseModel):
    """Aggregate learning progress across all word banks for the current user."""
    total_words: int
    mastered_words: int
    progress_percentage: float
    total_banks: int


# API endpoints
# NOTE: This literal route MUST be declared before the "/{word_bank_id}" routes
# below. FastAPI matches routes top-down, and "/{word_bank_id}" expects an int;
# if it came first, a request to "/api/progress/overview" would try to coerce
# "overview" into an int and fail with 422 instead of hitting this handler.
@router.get("/overview", response_model=ProgressOverview)
def get_progress_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get overall learning progress across every word bank (REQ-UI-005).

    Powers the home page Hero overview so the learner sees a single, honest
    snapshot of how much of the whole library they have mastered.
    """
    # Total words across all banks
    total_words = db.query(Word).count()

    # Total mastered words for this user across all banks
    mastered_words = db.query(LearningProgress).filter(
        LearningProgress.user_id == current_user.id,
        LearningProgress.is_mastered == True
    ).count()

    # Number of word banks available
    total_banks = db.query(WordBank).count()

    percentage = (mastered_words / total_words * 100) if total_words > 0 else 0

    return ProgressOverview(
        total_words=total_words,
        mastered_words=mastered_words,
        progress_percentage=round(percentage, 2),
        total_banks=total_banks
    )


@router.get("/{word_bank_id}", response_model=List[ProgressResponse])
def get_progress(
    word_bank_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get learning progress for a word bank"""
    # Get all words in the word bank
    words = db.query(Word).filter(Word.word_bank_id == word_bank_id).all()
    word_ids = [w.id for w in words]

    # Get user's progress
    progress_records = db.query(LearningProgress).filter(
        LearningProgress.user_id == current_user.id,
        LearningProgress.word_id.in_(word_ids)
    ).all()

    # Create response
    progress_map = {p.word_id: p for p in progress_records}
    result = []
    for word_id in word_ids:
        progress = progress_map.get(word_id)
        if progress:
            result.append(ProgressResponse(
                word_id=word_id,
                is_mastered=progress.is_mastered,
                mastered_at=progress.mastered_at
            ))
        else:
            result.append(ProgressResponse(
                word_id=word_id,
                is_mastered=False,
                mastered_at=None
            ))

    return result


@router.get("/{word_bank_id}/stats", response_model=ProgressStats)
def get_progress_stats(
    word_bank_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get learning progress statistics"""
    # Get total words in word bank
    total_words = db.query(Word).filter(Word.word_bank_id == word_bank_id).count()

    # Get mastered words
    mastered_count = db.query(LearningProgress).join(Word).filter(
        LearningProgress.user_id == current_user.id,
        Word.word_bank_id == word_bank_id,
        LearningProgress.is_mastered == True
    ).count()

    percentage = (mastered_count / total_words * 100) if total_words > 0 else 0

    return ProgressStats(
        total_words=total_words,
        mastered_words=mastered_count,
        progress_percentage=round(percentage, 2)
    )


@router.post("/{word_id}", response_model=ProgressResponse, status_code=status.HTTP_201_CREATED)
def mark_word_mastered(
    word_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a word as mastered"""
    # Check if word exists
    word = db.query(Word).filter(Word.id == word_id).first()
    if not word:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Word not found"
        )

    # Check if progress record exists
    progress = db.query(LearningProgress).filter(
        LearningProgress.user_id == current_user.id,
        LearningProgress.word_id == word_id
    ).first()

    if progress:
        # Update existing record
        progress.is_mastered = True
        progress.mastered_at = datetime.utcnow()
    else:
        # Create new record
        progress = LearningProgress(
            user_id=current_user.id,
            word_id=word_id,
            is_mastered=True,
            mastered_at=datetime.utcnow()
        )
        db.add(progress)

    db.commit()
    db.refresh(progress)

    return ProgressResponse(
        word_id=word_id,
        is_mastered=progress.is_mastered,
        mastered_at=progress.mastered_at
    )


@router.delete("/{word_id}")
def unmark_word_mastered(
    word_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Unmark a word as mastered"""
    progress = db.query(LearningProgress).filter(
        LearningProgress.user_id == current_user.id,
        LearningProgress.word_id == word_id
    ).first()

    if not progress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Progress record not found"
        )

    progress.is_mastered = False
    progress.mastered_at = None
    db.commit()

    return {"message": "Word unmarked successfully"}
