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


class TestWordBankDataCompleteness:
    """Tests for REQ-WB-004: Word bank data completeness"""

    def test_REQ_WB_004_word_banks_exist(self, client: TestClient, db_session: Session):
        """REQ-WB-004: Given system initialized, when requesting word bank list, then all required word banks exist"""
        # Create all required word banks
        required_banks = [
            "高考英语", "四级词汇", "六级词汇", "考研词汇",
            "托福词汇", "雅思词汇", "GRE词汇", "商务英语", "生活口语"
        ]
        for name in required_banks:
            wb = WordBank(name=name, description=f"{name}核心词汇", total_words=10, difficulty_level=2)
            db_session.add(wb)
        db_session.commit()

        response = client.get("/api/word-banks")
        assert response.status_code == 200
        data = response.json()

        # Check all required word banks exist
        bank_names = [wb["name"] for wb in data]
        for required_name in required_banks:
            assert required_name in bank_names, f"Word bank '{required_name}' should exist"

    def test_REQ_WB_004_word_bank_has_description_and_difficulty(self, client: TestClient, db_session: Session):
        """REQ-WB-004: Given word bank, when viewing details, then description and difficulty_level are shown"""
        wb = WordBank(
            name="四级词汇",
            description="大学英语四级核心词汇，适合大学四级考试备考",
            total_words=2000,
            difficulty_level=2
        )
        db_session.add(wb)
        db_session.commit()

        response = client.get("/api/word-banks")
        assert response.status_code == 200
        data = response.json()

        cet4_bank = next((wb for wb in data if wb["name"] == "四级词汇"), None)
        assert cet4_bank is not None
        assert cet4_bank["description"] is not None
        assert "total_words" in cet4_bank
        assert "difficulty_level" in cet4_bank

    def test_REQ_WB_004_word_has_complete_info(self, client: TestClient, db_session: Session):
        """REQ-WB-004: Given word, when viewing detail, then spelling/phonetic/meaning/example are present"""
        wb = WordBank(name="Test Bank", description="Test", total_words=1, difficulty_level=2)
        db_session.add(wb)
        db_session.commit()
        db_session.refresh(wb)

        word = Word(
            word_bank_id=wb.id,
            spelling="abandon",
            phonetic="/əˈbændən/",
            meaning="v. 放弃；抛弃",
            example_sentence="He abandoned his family.",
            order_index=1,
            word_root="a- + bandon",
            difficulty_level=2,
            frequency=850,
            synonyms='["give up", "desert"]',
            antonyms='["continue", "keep"]'
        )
        db_session.add(word)
        db_session.commit()
        db_session.refresh(word)

        response = client.get(f"/api/words/{word.id}")
        assert response.status_code == 200
        data = response.json()

        # Required fields
        assert data["spelling"] == "abandon"
        assert data["phonetic"] == "/əˈbændən/"
        assert data["meaning"] == "v. 放弃；抛弃"
        assert data["example_sentence"] == "He abandoned his family."

        # Optional extended fields should be present
        assert "word_root" in data
        assert "difficulty_level" in data
        assert "frequency" in data
        assert "synonyms" in data
        assert "antonyms" in data

    def test_REQ_WB_004_word_extended_fields_optional(self, client: TestClient, db_session: Session):
        """REQ-WB-004: Given word without extended fields, when viewing detail, then response succeeds with null values"""
        wb = WordBank(name="Minimal Bank", description="Test", total_words=1, difficulty_level=1)
        db_session.add(wb)
        db_session.commit()
        db_session.refresh(wb)

        word = Word(
            word_bank_id=wb.id,
            spelling="minimal",
            phonetic="/ˈmɪnɪməl/",
            meaning="adj. 最小的",
            example_sentence="This is minimal.",
            order_index=1
            # No extended fields
        )
        db_session.add(word)
        db_session.commit()
        db_session.refresh(word)

        response = client.get(f"/api/words/{word.id}")
        assert response.status_code == 200
        data = response.json()

        # Extended fields should be present but can be null
        assert "word_root" in data
        assert "difficulty_level" in data
        assert "frequency" in data
        assert "synonyms" in data
        assert "antonyms" in data

    def test_REQ_WB_004_word_bank_difficulty_range(self, client: TestClient, db_session: Session):
        """REQ-WB-004: Given word banks with different difficulty levels, when viewing list, then difficulty is 1-5"""
        banks = [
            WordBank(name="生活口语", description="日常生活", total_words=500, difficulty_level=1),
            WordBank(name="高考英语", description="高中英语", total_words=3500, difficulty_level=2),
            WordBank(name="六级词汇", description="大学英语六级", total_words=2500, difficulty_level=3),
            WordBank(name="托福词汇", description="托福考试", total_words=3500, difficulty_level=4),
            WordBank(name="GRE词汇", description="GRE考试", total_words=10000, difficulty_level=5),
        ]
        db_session.add_all(banks)
        db_session.commit()

        response = client.get("/api/word-banks")
        assert response.status_code == 200
        data = response.json()

        for wb in data:
            if wb["difficulty_level"] is not None:
                assert 1 <= wb["difficulty_level"] <= 5, "Difficulty level should be between 1 and 5"

    def test_REQ_WB_004_synonyms_antonyms_json_format(self, client: TestClient, db_session: Session):
        """REQ-WB-004: Given word with synonyms/antonyms, when viewing detail, then they are valid JSON strings"""
        wb = WordBank(name="JSON Test", description="Test", total_words=1, difficulty_level=2)
        db_session.add(wb)
        db_session.commit()
        db_session.refresh(wb)

        word = Word(
            word_bank_id=wb.id,
            spelling="test",
            phonetic="/test/",
            meaning="n. 测试",
            example_sentence="This is a test.",
            order_index=1,
            synonyms='["exam", "trial"]',
            antonyms='[]'
        )
        db_session.add(word)
        db_session.commit()
        db_session.refresh(word)

        response = client.get(f"/api/words/{word.id}")
        assert response.status_code == 200
        data = response.json()

        # Verify JSON format is valid
        import json
        synonyms = json.loads(data["synonyms"])
        antonyms = json.loads(data["antonyms"])
        assert isinstance(synonyms, list)
        assert isinstance(antonyms, list)
