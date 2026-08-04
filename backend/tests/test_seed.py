"""Tests for word-bank seeding from committed ECDICT data (REQ-WB-004).

REQ-WB-004: 导入完善开源词库
- 从 backend/seed_data/wordbanks/ 的开源 (ECDICT/MIT) seed 数据初始化词库
- 释义必须为真实中文，禁止占位符（如 "n. abandon"）
- total_words 与实际单词数一致，按词频 order_index 升序
- seed 幂等，可离线复现
"""

import re
from pathlib import Path

import pytest
from sqlalchemy.orm import Session

from app.models.word import WordBank, Word
from app.seed import load_wordbank_files, seed_wordbanks, DATA_DIR

CJK = re.compile(r"[一-鿿]")
EXPECTED_BANKS = {"高考英语", "大学英语四级", "大学英语六级", "考研英语"}


class TestSeedDataOutsidePersistedVolume:
    """SOU-41 复现: 种子数据不得位于持久化数据卷之内。

    生产 `docker-compose.prod.yml` 把具名卷挂在 `backend-data:/app/data`，
    数据库 `sqlite:///./data/vocabmaster.db` 即 `/app/data/vocabmaster.db`。
    种子文件曾放在 `/app/data/wordbanks`——与该卷挂载点重叠。棕地卷已有内容
    时 Docker 不会把镜像里的目录拷进卷，种子文件被遮蔽，容器启动读 index.json
    直接 FileNotFoundError 秒崩（run 30870629789 实锤）。种子是只读静态资源，
    必须与可写、持久化的 DB 目录物理隔离。
    """

    def test_SOU_41_seed_dir_not_under_db_volume(self):
        import app.seed as seed_module

        # backend 根: app/seed.py -> app -> <backend>（容器内即 /app）。
        # 独立于被测的 DATA_DIR 推导，避免循环断言。
        backend_root = Path(seed_module.__file__).resolve().parents[1]
        # 持久化卷挂载点 = <backend>/data（= /app/data，见 docker-compose.prod.yml
        # 的 backend-data:/app/data 与 DATABASE_URL 的 ./data/vocabmaster.db）。
        persisted_volume = (backend_root / "data").resolve()
        seed_dir = DATA_DIR.resolve()
        # 修复前 DATA_DIR = <backend>/data/wordbanks，位于卷内 → 断言失败（红）。
        # 修复后 DATA_DIR = <backend>/seed_data/wordbanks，卷外 → 通过（绿）。
        assert seed_dir != persisted_volume, "种子目录不能就是数据卷根目录"
        assert persisted_volume not in seed_dir.parents, (
            f"种子目录 {seed_dir} 位于持久化数据卷 {persisted_volume} 之内，"
            f"棕地卷会遮蔽镜像内种子文件，容器启动读不到 index.json"
        )


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


class TestSeedReconcilesBrownfield:
    """SOU-39 regression: a DB that already holds stale/placeholder banks must be
    reconciled to the full committed library, not skipped.

    Production shipped with a persisted volume containing legacy placeholder
    banks ("高考英语" with 3 words, "生活英语" with 2). The old "skip if any bank
    exists" guard meant every deploy left that near-empty data in place. Seeding
    must now self-heal: fill the real banks, drop removed ones, keep progress.
    """

    def _make_stale_db(self, db: Session):
        """Recreate the exact production placeholder state."""
        gaokao = WordBank(name="高考英语", description="高考英语核心词汇", total_words=3)
        life = WordBank(name="生活英语", description="日常生活常用词汇", total_words=2)
        db.add_all([gaokao, life])
        db.flush()
        # 高考英语 includes "the" (a spelling that also exists in the real data)
        db.add_all([
            Word(word_bank_id=gaokao.id, spelling="the", meaning="占位", order_index=1),
            Word(word_bank_id=gaokao.id, spelling="placeholderword", meaning="占位", order_index=2),
            Word(word_bank_id=gaokao.id, spelling="anotherplaceholder", meaning="占位", order_index=3),
        ])
        db.add_all([
            Word(word_bank_id=life.id, spelling="hello", meaning="占位", order_index=1),
            Word(word_bank_id=life.id, spelling="world", meaning="占位", order_index=2),
        ])
        db.commit()
        return gaokao, life

    def test_SOU39_reconcile_fills_placeholder_banks_and_drops_stale(self, db_session: Session):
        self._make_stale_db(db_session)

        seed_wordbanks(db_session)

        banks = db_session.query(WordBank).all()
        # Stale "生活英语" removed; the four exam banks present.
        assert {b.name for b in banks} == EXPECTED_BANKS

        for wb in banks:
            actual = db_session.query(Word).filter(Word.word_bank_id == wb.id).count()
            assert wb.total_words == actual, f"{wb.name}: total_words mismatch"
            assert actual >= 2000, f"{wb.name} was not filled: {actual}"

    def test_SOU39_reconcile_is_idempotent_after_healing(self, db_session: Session):
        self._make_stale_db(db_session)
        seed_wordbanks(db_session)
        # A second reconcile creates nothing and keeps counts stable.
        created = seed_wordbanks(db_session)
        assert created == 0
        assert db_session.query(WordBank).count() == 4

    def test_SOU39_reconcile_preserves_mastery_by_spelling(self, db_session: Session):
        """A word the user mastered before the import stays mastered after it."""
        from app.models.user import User
        from app.models.progress import LearningProgress

        gaokao, _life = self._make_stale_db(db_session)
        user = User(username="learner", email="l@example.com", hashed_password="x")
        db_session.add(user)
        db_session.flush()

        the_word = (
            db_session.query(Word)
            .filter(Word.word_bank_id == gaokao.id, Word.spelling == "the")
            .first()
        )
        db_session.add(LearningProgress(
            user_id=user.id, word_id=the_word.id, is_mastered=True,
        ))
        db_session.commit()

        seed_wordbanks(db_session)

        # "the" still exists in the rebuilt 高考 bank, and the user's mastery of it
        # was remapped onto the new row (not orphaned or lost).
        new_the = (
            db_session.query(Word)
            .join(WordBank, Word.word_bank_id == WordBank.id)
            .filter(WordBank.name == "高考英语", Word.spelling == "the")
            .first()
        )
        assert new_the is not None
        prog = (
            db_session.query(LearningProgress)
            .filter(
                LearningProgress.user_id == user.id,
                LearningProgress.word_id == new_the.id,
            )
            .first()
        )
        assert prog is not None and prog.is_mastered is True
        # No dangling progress rows point at deleted words.
        live_word_ids = {wid for (wid,) in db_session.query(Word.id).all()}
        all_prog = db_session.query(LearningProgress).all()
        assert all(p.word_id in live_word_ids for p in all_prog)

