"""Tests for learning progress API (REQ-PROG series)"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.word import WordBank, Word
from app.models.progress import LearningProgress
from app.api.auth import get_password_hash


class TestMarkWordMastered:
    """Tests for REQ-PROG-001: Mark word as mastered"""

    def test_REQ_PROG_001_mark_word_mastered_success(self, client: TestClient, db_session: Session):
        """REQ-PROG-001: Given logged-in user and word ID, when marking as mastered, then update progress record (is_mastered=True)"""
        # Create test user
        user = User(
            username="test",
            email="test@example.com",
            hashed_password=get_password_hash("123456")
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        # Create word bank and word
        wb = WordBank(name="Test Bank", description="Test", total_words=1)
        db_session.add(wb)
        db_session.commit()
        db_session.refresh(wb)

        word = Word(word_bank_id=wb.id, spelling="test", phonetic="/test/",
                    meaning="n. 测试", example_sentence="Test sentence.", order_index=1)
        db_session.add(word)
        db_session.commit()
        db_session.refresh(word)

        # Login to get token
        login_response = client.post(
            "/api/auth/login",
            data={"username": "test", "password": "123456"}
        )
        token = login_response.json()["access_token"]

        # Mark word as mastered
        response = client.post(
            f"/api/progress/{word.id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 201
        data = response.json()
        assert data["word_id"] == word.id
        assert data["is_mastered"] is True
        assert data["mastered_at"] is not None

    def test_REQ_PROG_001_mark_word_mastered_creates_new_record(self, client: TestClient, db_session: Session):
        """REQ-PROG-001: Marking a word as mastered should create a new progress record if none exists"""
        # Create test user
        user = User(
            username="test2",
            email="test2@example.com",
            hashed_password=get_password_hash("123456")
        )
        db_session.add(user)
        db_session.commit()

        # Create word bank and word
        wb = WordBank(name="Test Bank 2", description="Test", total_words=1)
        db_session.add(wb)
        db_session.commit()
        db_session.refresh(wb)

        word = Word(word_bank_id=wb.id, spelling="word", phonetic="/w/",
                    meaning="n. 单词", example_sentence="Test.", order_index=1)
        db_session.add(word)
        db_session.commit()
        db_session.refresh(word)

        # Login
        login_response = client.post(
            "/api/auth/login",
            data={"username": "test2", "password": "123456"}
        )
        token = login_response.json()["access_token"]

        # Verify no progress record exists
        progress_count = db_session.query(LearningProgress).filter(
            LearningProgress.user_id == user.id,
            LearningProgress.word_id == word.id
        ).count()
        assert progress_count == 0

        # Mark word as mastered
        response = client.post(
            f"/api/progress/{word.id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 201

        # Verify progress record was created
        progress = db_session.query(LearningProgress).filter(
            LearningProgress.user_id == user.id,
            LearningProgress.word_id == word.id
        ).first()
        assert progress is not None
        assert progress.is_mastered is True


class TestUnmarkWordMastered:
    """Tests for REQ-PROG-002: Unmark word as mastered"""

    def test_REQ_PROG_002_unmark_word_mastered_success(self, client: TestClient, db_session: Session):
        """REQ-PROG-002: Given marked word, when unmarking, then update progress record (is_mastered=False)"""
        # Create test user
        user = User(
            username="test3",
            email="test3@example.com",
            hashed_password=get_password_hash("123456")
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        # Create word bank and word
        wb = WordBank(name="Test Bank 3", description="Test", total_words=1)
        db_session.add(wb)
        db_session.commit()
        db_session.refresh(wb)

        word = Word(word_bank_id=wb.id, spelling="word", phonetic="/w/",
                    meaning="n. 单词", example_sentence="Test.", order_index=1)
        db_session.add(word)
        db_session.commit()
        db_session.refresh(word)

        # Create progress record
        progress = LearningProgress(
            user_id=user.id,
            word_id=word.id,
            is_mastered=True
        )
        db_session.add(progress)
        db_session.commit()

        # Login
        login_response = client.post(
            "/api/auth/login",
            data={"username": "test3", "password": "123456"}
        )
        token = login_response.json()["access_token"]

        # Unmark word
        response = client.delete(
            f"/api/progress/{word.id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200

        # Verify progress record was updated
        db_session.refresh(progress)
        assert progress.is_mastered is False
        assert progress.mastered_at is None

    def test_REQ_PROG_002_unmark_nonexistent_progress(self, client: TestClient, db_session: Session):
        """REQ-PROG-002: Unmarking a word without progress record should return 404"""
        # Create test user
        user = User(
            username="test4",
            email="test4@example.com",
            hashed_password=get_password_hash("123456")
        )
        db_session.add(user)
        db_session.commit()

        # Create word bank and word
        wb = WordBank(name="Test Bank 4", description="Test", total_words=1)
        db_session.add(wb)
        db_session.commit()
        db_session.refresh(wb)

        word = Word(word_bank_id=wb.id, spelling="word", phonetic="/w/",
                    meaning="n. 单词", example_sentence="Test.", order_index=1)
        db_session.add(word)
        db_session.commit()
        db_session.refresh(word)

        # Login
        login_response = client.post(
            "/api/auth/login",
            data={"username": "test4", "password": "123456"}
        )
        token = login_response.json()["access_token"]

        # Try to unmark word without progress record
        response = client.delete(
            f"/api/progress/{word.id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 404
        assert "Progress record not found" in response.json()["detail"]


class TestGetProgress:
    """Tests for REQ-PROG-003: Get learning progress"""

    def test_REQ_PROG_003_get_progress_success(self, client: TestClient, db_session: Session):
        """REQ-PROG-003: Given logged-in user and word bank ID, when requesting progress, then return mastery status for each word"""
        # Create test user
        user = User(
            username="test5",
            email="test5@example.com",
            hashed_password=get_password_hash("123456")
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        # Create word bank and words
        wb = WordBank(name="Test Bank 5", description="Test", total_words=3)
        db_session.add(wb)
        db_session.commit()
        db_session.refresh(wb)

        words = [
            Word(word_bank_id=wb.id, spelling=f"word{i}", phonetic=f"/w{i}/",
                 meaning=f"meaning{i}", example_sentence=f"example{i}", order_index=i)
            for i in range(3)
        ]
        db_session.add_all(words)
        db_session.commit()

        # Create progress records
        progress1 = LearningProgress(user_id=user.id, word_id=words[0].id, is_mastered=True)
        progress2 = LearningProgress(user_id=user.id, word_id=words[1].id, is_mastered=False)
        db_session.add_all([progress1, progress2])
        db_session.commit()

        # Login
        login_response = client.post(
            "/api/auth/login",
            data={"username": "test5", "password": "123456"}
        )
        token = login_response.json()["access_token"]

        # Get progress
        response = client.get(
            f"/api/progress/{wb.id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 3

        # Check progress records
        progress_map = {p["word_id"]: p for p in data}
        assert progress_map[words[0].id]["is_mastered"] is True
        assert progress_map[words[1].id]["is_mastered"] is False
        assert progress_map[words[2].id]["is_mastered"] is False  # No progress record

    def test_REQ_PROG_003_get_progress_empty_word_bank(self, client: TestClient, db_session: Session):
        """REQ-PROG-003: Getting progress for empty word bank should return empty list"""
        # Create test user
        user = User(
            username="test6",
            email="test6@example.com",
            hashed_password=get_password_hash("123456")
        )
        db_session.add(user)
        db_session.commit()

        # Create empty word bank
        wb = WordBank(name="Empty Bank", description="Empty", total_words=0)
        db_session.add(wb)
        db_session.commit()
        db_session.refresh(wb)

        # Login
        login_response = client.post(
            "/api/auth/login",
            data={"username": "test6", "password": "123456"}
        )
        token = login_response.json()["access_token"]

        # Get progress
        response = client.get(
            f"/api/progress/{wb.id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0


class TestProgressStats:
    """Tests for REQ-PROG-004: Get learning progress statistics"""

    def test_REQ_PROG_004_get_progress_stats_success(self, client: TestClient, db_session: Session):
        """REQ-PROG-004: Given logged-in user and word bank ID, when requesting stats, then return total/mastered/percentage"""
        # Create test user
        user = User(
            username="test7",
            email="test7@example.com",
            hashed_password=get_password_hash("123456")
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        # Create word bank and words
        wb = WordBank(name="Test Bank 7", description="Test", total_words=10)
        db_session.add(wb)
        db_session.commit()
        db_session.refresh(wb)

        words = [
            Word(word_bank_id=wb.id, spelling=f"word{i}", phonetic=f"/w{i}/",
                 meaning=f"meaning{i}", example_sentence=f"example{i}", order_index=i)
            for i in range(10)
        ]
        db_session.add_all(words)
        db_session.commit()

        # Mark 3 words as mastered
        for i in range(3):
            progress = LearningProgress(user_id=user.id, word_id=words[i].id, is_mastered=True)
            db_session.add(progress)
        db_session.commit()

        # Login
        login_response = client.post(
            "/api/auth/login",
            data={"username": "test7", "password": "123456"}
        )
        token = login_response.json()["access_token"]

        # Get stats
        response = client.get(
            f"/api/progress/{wb.id}/stats",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_words"] == 10
        assert data["mastered_words"] == 3
        assert data["progress_percentage"] == 30.0

    def test_REQ_PROG_004_get_progress_stats_zero_words(self, client: TestClient, db_session: Session):
        """REQ-PROG-004: Getting stats for empty word bank should return zeros"""
        # Create test user
        user = User(
            username="test8",
            email="test8@example.com",
            hashed_password=get_password_hash("123456")
        )
        db_session.add(user)
        db_session.commit()

        # Create empty word bank
        wb = WordBank(name="Empty Bank 2", description="Empty", total_words=0)
        db_session.add(wb)
        db_session.commit()
        db_session.refresh(wb)

        # Login
        login_response = client.post(
            "/api/auth/login",
            data={"username": "test8", "password": "123456"}
        )
        token = login_response.json()["access_token"]

        # Get stats
        response = client.get(
            f"/api/progress/{wb.id}/stats",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_words"] == 0
        assert data["mastered_words"] == 0
        assert data["progress_percentage"] == 0.0
