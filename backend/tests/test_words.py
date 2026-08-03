"""Tests for word bank and words API (REQ-WB series)"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.word import WordBank, Word
from app.models.user import User

from init_db import (
    TEST_USERNAME,
    load_wordbank_files,
    seed_database,
)


def _has_cjk(text: str) -> bool:
    """True if the string contains at least one CJK ideograph."""
    return any("一" <= ch <= "鿿" for ch in text)


# Expected word-bank scale per ECDICT exam tag (SOU-39 acceptance criteria).
# Tolerance absorbs minor upstream drift when the seed is regenerated.
EXPECTED_BANK_SIZES = {
    "高考英语": 3677,
    "考研英语": 4801,
    "四级英语": 3849,
    "六级英语": 5407,
}
SIZE_TOLERANCE = 60


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


class TestSeedDataFiles:
    """SOU-39: validate the committed ECDICT-derived seed data files."""

    def test_all_expected_banks_present_with_expected_scale(self):
        """SOU-39: gk/ky/cet4/cet6 banks exist with word counts matching ECDICT tags."""
        banks = {b["name"]: b for b in load_wordbank_files()}
        for name, expected in EXPECTED_BANK_SIZES.items():
            assert name in banks, f"missing word bank: {name}"
            bank = banks[name]
            count = len(bank["words"])
            # total_words in the file mirrors the real word count.
            assert bank["total_words"] == count
            assert abs(count - expected) <= SIZE_TOLERANCE, (
                f"{name}: {count} words, expected ~{expected}"
            )

    def test_seed_records_open_source_provenance(self):
        """SOU-39: every seed file records its ECDICT source + MIT license."""
        for bank in load_wordbank_files():
            assert "ECDICT" in bank["source"]
            assert bank["license"] == "MIT"
            assert bank["source_url"].startswith("https://")

    def test_meanings_are_real_chinese_not_placeholders(self):
        """SOU-39: meanings must be real Chinese translations, never placeholders like 'n. abandon'."""
        for bank in load_wordbank_files():
            for word in bank["words"]:
                meaning = word["meaning"]
                # Must contain Chinese characters (rules out English-only placeholders).
                assert _has_cjk(meaning), (
                    f"{bank['name']}/{word['spelling']}: non-Chinese meaning {meaning!r}"
                )
                # Must not be a bare "<pos>. <spelling>" placeholder.
                assert word["spelling"].lower() not in meaning.lower() or _has_cjk(meaning)

    def test_order_index_is_contiguous_and_sorted(self):
        """SOU-39: order_index is a contiguous 1..N sequence (frequency ranking)."""
        for bank in load_wordbank_files():
            indexes = [w["order_index"] for w in bank["words"]]
            assert indexes == list(range(1, len(indexes) + 1)), (
                f"{bank['name']}: order_index not contiguous 1..N"
            )

    def test_high_frequency_word_ranked_first(self):
        """SOU-39: high-frequency words come first (高频词优先)."""
        banks = {b["name"]: b for b in load_wordbank_files()}
        first_word = banks["高考英语"]["words"][0]["spelling"].lower()
        # The most frequent 高考 word should be a very common English word.
        assert first_word in {"the", "a", "be", "of", "and", "to", "in", "have", "it"}


class TestSeedDatabase:
    """SOU-39: validate seeding the database from data files."""

    def test_seed_populates_banks_and_words(self, client: TestClient, db_session: Session):
        """Given seeded DB, when querying word-banks API, then real banks are returned."""
        seed_database(db_session)

        response = client.get("/api/word-banks")
        assert response.status_code == 200
        names = {b["name"] for b in response.json()}
        assert EXPECTED_BANK_SIZES.keys() <= names

    def test_seeded_total_words_matches_actual_count(self, client: TestClient, db_session: Session):
        """SOU-39: each bank's total_words equals its actual number of words."""
        seed_database(db_session)

        for bank in client.get("/api/word-banks").json():
            words = client.get(f"/api/word-banks/{bank['id']}/words?limit=1").json()
            assert bank["total_words"] == words["total"]

    def test_seeded_words_returned_sorted_by_order_index(self, client: TestClient, db_session: Session):
        """SOU-39: words are served high-frequency first (order_index ascending)."""
        seed_database(db_session)

        bank = next(b for b in client.get("/api/word-banks").json() if b["name"] == "高考英语")
        data = client.get(f"/api/word-banks/{bank['id']}/words?limit=20").json()
        spellings = [w["spelling"] for w in data["words"]]
        # First served word is the highest-frequency 高考 word.
        assert spellings[0].lower() in {"the", "a", "be", "of", "and", "to", "in"}
        # Real phonetic + Chinese meaning present on the served words.
        assert _has_cjk(data["words"][0]["meaning"])
        assert data["words"][0]["phonetic"]

    def test_seed_is_idempotent(self, db_session: Session):
        """SOU-39: seeding twice does not duplicate banks or words."""
        seed_database(db_session)
        banks_after_first = db_session.query(WordBank).count()
        words_after_first = db_session.query(Word).count()

        second = seed_database(db_session)

        assert all(count == 0 for count in second.values())  # nothing re-inserted
        assert db_session.query(WordBank).count() == banks_after_first
        assert db_session.query(Word).count() == words_after_first

    def test_seed_creates_shared_test_user(self, db_session: Session):
        """ADR-0010: seeding creates the single-source-of-truth test account (idempotently)."""
        seed_database(db_session)
        seed_database(db_session)  # second run must not duplicate the user
        users = db_session.query(User).filter(User.username == TEST_USERNAME).all()
        assert len(users) == 1
        assert users[0].email == "test@example.com"
