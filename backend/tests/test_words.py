"""Tests for word bank and words API (REQ-WB series)"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.word import WordBank, Word


class TestWordBanks:
    """Tests for REQ-WB-001: Get word bank list"""

    def test_REQ_WB_001_get_word_banks_success(self, client: TestClient, db_session: Session):
        """REQ-WB-001: Given logged-in user, when requesting word bank list, then return all available word banks"""
        # Create sample word banks
        wb1 = WordBank(name="高考英语", description="高考英语核心词汇", total_words=3)
        wb2 = WordBank(name="考研英语", description="考研英语核心词汇", total_words=2)
        db_session.add_all([wb1, wb2])
        db_session.commit()

        response = client.get("/api/word-banks")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2

        # Check word bank structure
        for wb in data:
            assert "id" in wb
            assert "name" in wb
            assert "description" in wb
            assert "total_words" in wb

    def test_REQ_WB_001_get_word_banks_empty(self, client: TestClient):
        """REQ-WB-001: Given empty database, when requesting word bank list, then return empty list"""
        response = client.get("/api/word-banks")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0


class TestWords:
    """Tests for REQ-WB-002: Get words from word bank"""

    def test_REQ_WB_002_get_words_success(self, client: TestClient, db_session: Session):
        """REQ-WB-002: Given word bank ID and pagination params, when requesting words, then return paginated words with spelling/phonetic/meaning/example"""
        wb = WordBank(name="Test Bank", description="Test", total_words=3)
        db_session.add(wb)
        db_session.commit()
        db_session.refresh(wb)

        words = [
            Word(word_bank_id=wb.id, spelling="abandon", phonetic="/əˈbændən/",
                 meaning="v. 放弃", example_sentence="He abandoned his family.", order_index=1),
            Word(word_bank_id=wb.id, spelling="ability", phonetic="/əˈbɪləti/",
                 meaning="n. 能力", example_sentence="She has ability.", order_index=2),
            Word(word_bank_id=wb.id, spelling="absorb", phonetic="/əbˈsɔːrb/",
                 meaning="v. 吸收", example_sentence="Plants absorb water.", order_index=3),
        ]
        db_session.add_all(words)
        db_session.commit()
        wb_id = wb.id

        # Test default pagination
        response = client.get(f"/api/word-banks/{wb_id}/words")
        assert response.status_code == 200
        data = response.json()
        assert "words" in data
        assert "total" in data
        assert data["total"] == 3
        assert len(data["words"]) == 3

        # Check word structure
        word = data["words"][0]
        assert "id" in word
        assert "spelling" in word
        assert "phonetic" in word
        assert "meaning" in word
        assert "example_sentence" in word

    def test_REQ_WB_002_get_words_pagination(self, client: TestClient, db_session: Session):
        """REQ-WB-002: Test pagination parameters for word list"""
        wb = WordBank(name="Pagination Test", description="Test", total_words=5)
        db_session.add(wb)
        db_session.commit()
        db_session.refresh(wb)

        for i in range(5):
            db_session.add(Word(word_bank_id=wb.id, spelling=f"word{i}", phonetic=f"/phonetic{i}/",
                        meaning=f"meaning{i}", example_sentence=f"example{i}", order_index=i))
        db_session.commit()
        wb_id = wb.id

        # Test skip and limit
        response = client.get(f"/api/word-banks/{wb_id}/words?skip=1&limit=2")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 5
        assert len(data["words"]) == 2

    def test_REQ_WB_002_get_words_sorted_by_order_index(self, client: TestClient, db_session: Session):
        """REQ-WB-002: Words should be sorted by order_index"""
        wb = WordBank(name="Sort Test", description="Test", total_words=3)
        db_session.add(wb)
        db_session.commit()
        db_session.refresh(wb)

        # Insert in reverse order
        for i in [3, 1, 2]:
            db_session.add(Word(word_bank_id=wb.id, spelling=f"word{i}", phonetic=f"/p{i}/",
                        meaning=f"m{i}", example_sentence=f"e{i}", order_index=i))
        db_session.commit()
        wb_id = wb.id

        response = client.get(f"/api/word-banks/{wb_id}/words")
        assert response.status_code == 200
        data = response.json()
        words = data["words"]

        # Should be sorted by order_index
        assert words[0]["spelling"] == "word1"
        assert words[1]["spelling"] == "word2"
        assert words[2]["spelling"] == "word3"


class TestWordBankNotFound:
    """Tests for REQ-WB-003: Word bank not found"""

    def test_REQ_WB_003_word_bank_not_found(self, client: TestClient):
        """REQ-WB-003: Given non-existent word bank ID, when requesting words, then return 404 error"""
        response = client.get("/api/word-banks/99999/words")
        assert response.status_code == 404
        assert "Word bank not found" in response.json()["detail"]


class TestWordDetail:
    """Tests for REQ-WORD-001 and REQ-WORD-002"""

    def test_REQ_WORD_001_get_word_detail_success(self, client: TestClient, db_session: Session):
        """REQ-WORD-001: Given word ID, when requesting detail, then return spelling/phonetic/pronunciation_url/meaning/example"""
        wb = WordBank(name="Detail Test", description="Test", total_words=1)
        db_session.add(wb)
        db_session.commit()
        db_session.refresh(wb)

        word = Word(word_bank_id=wb.id, spelling="test", phonetic="/test/",
                    meaning="n. 测试", example_sentence="This is a test.", order_index=1,
                    pronunciation_url="http://example.com/test.mp3")
        db_session.add(word)
        db_session.commit()
        db_session.refresh(word)
        word_id = word.id

        response = client.get(f"/api/words/{word_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["spelling"] == "test"
        assert data["phonetic"] == "/test/"
        assert data["meaning"] == "n. 测试"
        assert data["example_sentence"] == "This is a test."
        assert data["pronunciation_url"] == "http://example.com/test.mp3"

    def test_REQ_WORD_002_word_not_found(self, client: TestClient):
        """REQ-WORD-002: Given non-existent word ID, when requesting detail, then return 404 error"""
        response = client.get("/api/words/99999")
        assert response.status_code == 404
        assert "Word not found" in response.json()["detail"]


class TestPronunciation:
    """Tests for REQ-WORD-003: Pronunciation feature"""

    def test_REQ_WORD_003_pronunciation_not_configured(self, client: TestClient, db_session: Session, auth_headers: dict):
        """REQ-WORD-003: Given pronunciation API not configured, when requesting pronunciation, then return 404 with friendly message"""
        wb = WordBank(name="Pronunciation Test", description="Test", total_words=1)
        db_session.add(wb)
        db_session.commit()
        db_session.refresh(wb)

        word = Word(word_bank_id=wb.id, spelling="hello", phonetic="/həˈloʊ/",
                    meaning="int. 你好", example_sentence="Hello, world!", order_index=1)
        db_session.add(word)
        db_session.commit()
        db_session.refresh(word)
        word_id = word.id

        # Request pronunciation without API configured (default env)
        response = client.get(f"/api/words/{word_id}/pronunciation?accent=us", headers=auth_headers)
        assert response.status_code == 404
        assert "发音服务未配置" in response.json()["detail"]

    def test_REQ_WORD_003_pronunciation_invalid_accent(self, client: TestClient, db_session: Session, auth_headers: dict):
        """REQ-WORD-003: Given invalid accent parameter, when requesting pronunciation, then return 422"""
        wb = WordBank(name="Accent Test", description="Test", total_words=1)
        db_session.add(wb)
        db_session.commit()
        db_session.refresh(wb)

        word = Word(word_bank_id=wb.id, spelling="test", phonetic="/test/",
                    meaning="n. 测试", order_index=1)
        db_session.add(word)
        db_session.commit()
        db_session.refresh(word)
        word_id = word.id

        response = client.get(f"/api/words/{word_id}/pronunciation?accent=invalid", headers=auth_headers)
        assert response.status_code == 422

    def test_REQ_WORD_003_pronunciation_word_not_found(self, client: TestClient, auth_headers: dict):
        """REQ-WORD-003: Given non-existent word ID, when requesting pronunciation, then return 404"""
        response = client.get("/api/words/99999/pronunciation?accent=us", headers=auth_headers)
        assert response.status_code == 404
        assert "Word not found" in response.json()["detail"]

    def test_REQ_WORD_003_pronunciation_requires_auth(self, client: TestClient, db_session: Session):
        """REQ-WORD-003: Given no auth token, when requesting pronunciation, then return 401"""
        wb = WordBank(name="Auth Test", description="Test", total_words=1)
        db_session.add(wb)
        db_session.commit()
        db_session.refresh(wb)

        word = Word(word_bank_id=wb.id, spelling="test", phonetic="/test/",
                    meaning="n. 测试", order_index=1)
        db_session.add(word)
        db_session.commit()
        db_session.refresh(word)
        word_id = word.id

        response = client.get(f"/api/words/{word_id}/pronunciation?accent=us")
        assert response.status_code == 401
