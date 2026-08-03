"""Tests for word-bank seeding from committed ECDICT data (REQ-WB-004).

REQ-WB-004: 导入完善开源词库
- 从 backend/data/wordbanks/ 的开源 (ECDICT/MIT) seed 数据初始化词库
- 释义必须为真实中文，禁止占位符（如 "n. abandon"）
- total_words 与实际单词数一致，按词频 order_index 升序
- seed 幂等，可离线复现
"""

import re

import pytest
from sqlalchemy.orm import Session

from app.models.word import WordBank, Word
from app.seed import load_wordbank_files, seed_wordbanks, DATA_DIR

CJK = re.compile(r"[一-鿿]")
EXPECTED_BANKS = {"高考英语", "大学英语四级", "大学英语六级", "考研英语"}


class TestSeedDataFiles:
    """Validate the committed seed data files themselves."""

    def test_REQ_WB_004_index_lists_all_banks(self):
        banks = load_wordbank_files()
        names = {b["name"] for b in banks}
        assert EXPECTED_BANKS.issubset(names)

    def test_REQ_WB_004_files_present_and_licensed(self):
        assert (DATA_DIR / "index.json").exists()
        for bank in load_wordbank_files():
            assert bank["license"] == "MIT"
            assert "ECDICT" in bank["source"]

    def test_REQ_WB_004_each_bank_has_substantial_real_data(self):
        for bank in load_wordbank_files():
            words = bank["words"]
            # Each exam bank must be a real vocabulary set, not a toy sample.
            assert len(words) >= 2000, f"{bank['name']} too small: {len(words)}"

    def test_REQ_WB_004_meanings_are_real_chinese_not_placeholder(self):
        """Every meaning must contain Chinese characters (no 'n. abandon' placeholders)."""
        for bank in load_wordbank_files():
            offenders = [w["spelling"] for w in bank["words"] if not CJK.search(w["meaning"])]
            assert not offenders, f"{bank['name']} placeholder meanings: {offenders[:5]}"

    def test_REQ_WB_004_no_raw_separators_left_in_meanings(self):
        """ECDICT sense separators (literal \\n / newlines) must be normalised."""
        for bank in load_wordbank_files():
            for w in bank["words"]:
                assert "\\n" not in w["meaning"]
                assert "\n" not in w["meaning"]

    def test_REQ_WB_004_order_index_is_sequential(self):
        for bank in load_wordbank_files():
            indexes = [w["order_index"] for w in bank["words"]]
            assert indexes == list(range(1, len(indexes) + 1))


class TestSeedIntoDatabase:
    """Validate seeding into a database session."""

    def test_REQ_WB_004_seed_creates_banks_with_matching_totals(self, db_session: Session):
        created = seed_wordbanks(db_session)
        assert created == 4

        banks = db_session.query(WordBank).all()
        assert {b.name for b in banks} == EXPECTED_BANKS

        for wb in banks:
            actual = db_session.query(Word).filter(Word.word_bank_id == wb.id).count()
            assert wb.total_words == actual, f"{wb.name}: total_words mismatch"
            assert actual > 0

    def test_REQ_WB_004_seed_is_idempotent(self, db_session: Session):
        first = seed_wordbanks(db_session)
        assert first == 4
        # Second run must not duplicate anything.
        second = seed_wordbanks(db_session)
        assert second == 0
        assert db_session.query(WordBank).count() == 4

    def test_REQ_WB_004_words_ordered_by_frequency(self, db_session: Session):
        """High-frequency words come first (ECDICT frequency ordering)."""
        seed_wordbanks(db_session)
        gaokao = db_session.query(WordBank).filter(WordBank.name == "高考英语").first()
        first_word = (
            db_session.query(Word)
            .filter(Word.word_bank_id == gaokao.id)
            .order_by(Word.order_index)
            .first()
        )
        # "the" is the most frequent English word and must lead the 高考 bank.
        assert first_word.spelling == "the"

    def test_REQ_WB_004_seeded_words_have_meaning(self, db_session: Session):
        seed_wordbanks(db_session)
        sample = db_session.query(Word).limit(500).all()
        for w in sample:
            assert w.meaning and CJK.search(w.meaning)


class TestSeededApi:
    """The public API must expose the seeded banks (REQ-WB-001 integration)."""

    def test_REQ_WB_004_word_banks_endpoint_returns_seeded_banks(self, client, db_session):
        seed_wordbanks(db_session)
        resp = client.get("/api/word-banks")
        assert resp.status_code == 200
        data = resp.json()
        names = {b["name"] for b in data}
        assert EXPECTED_BANKS.issubset(names)
        for b in data:
            if b["name"] in EXPECTED_BANKS:
                assert b["total_words"] >= 2000

    def test_REQ_WB_004_first_page_words_are_high_frequency(self, client, db_session):
        seed_wordbanks(db_session)
        gaokao = db_session.query(WordBank).filter(WordBank.name == "高考英语").first()
        resp = client.get(f"/api/word-banks/{gaokao.id}/words?skip=0&limit=5")
        assert resp.status_code == 200
        words = resp.json()["words"]
        assert words[0]["spelling"] == "the"
        assert all(w["meaning"] for w in words)
