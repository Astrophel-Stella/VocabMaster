"""Initialize database with sample data - REQ-WB-004"""

from pathlib import Path
from sqlalchemy.orm import Session
from app.database import SessionLocal, init_db
from app.models.user import User
from app.models.word import WordBank, Word
from passlib.context import CryptContext
import json

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 词库验收标准
WORD_BANK_TARGETS = {
    "四级词汇": 2000,
    "六级词汇": 2500,
    "考研词汇": 5500,
    "托福词汇": 3500,
    "雅思词汇": 3000,
    "GRE词汇": 10000,
    "商务英语": 1000,
    "生活口语": 500,
    "高考英语": 3500,
}


def load_word_data(bank_name: str) -> list:
    """从JSON文件加载词库数据"""
    data_dir = Path(__file__).parent / "data"
    json_file = data_dir / f"{bank_name}.json"

    if not json_file.exists():
        print(f"  Warning: Data file not found: {json_file}")
        return []

    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    return data.get('words', [])


def create_sample_data():
    """Create sample word banks and words from generated data"""
    db: Session = SessionLocal()

    try:
        # Check if data already exists
        if db.query(WordBank).first():
            print("Database already has data, skipping sample data creation")
            return

        # Create word banks and import data
        created_banks = []

        for bank_name, target_count in WORD_BANK_TARGETS.items():
            print(f"Creating word bank: {bank_name}")

            # 创建词库
            word_bank = WordBank(
                name=bank_name,
                description=f"{bank_name}核心词汇",
                total_words=0
            )
            db.add(word_bank)
            db.flush()

            # 加载词汇数据
            words_data = load_word_data(bank_name)

            if not words_data:
                print(f"  Skipping {bank_name} - no data available")
                continue

            # 导入词汇
            imported_count = 0
            for word_data in words_data:
                word = Word(
                    word_bank_id=word_bank.id,
                    spelling=word_data.get('spelling', ''),
                    phonetic=word_data.get('phonetic', ''),
                    meaning=word_data.get('meaning', ''),
                    example_sentence=word_data.get('example_sentence', ''),
                    order_index=word_data.get('order_index', imported_count + 1),
                    word_root=word_data.get('word_root', ''),
                    difficulty_level=word_data.get('difficulty_level', 1),
                    frequency=word_data.get('frequency'),
                    synonyms=word_data.get('synonyms'),
                    antonyms=word_data.get('antonyms'),
                )
                db.add(word)
                imported_count += 1

                # 批量提交
                if imported_count % 1000 == 0:
                    db.commit()
                    print(f"  Imported {imported_count} words...")

            # 更新词库总词数
            word_bank.total_words = imported_count
            created_banks.append((bank_name, imported_count))

            print(f"  Created {bank_name} with {imported_count} words")

        db.commit()

        # Create a test user
        test_user = User(
            username="test",
            email="test@example.com",
            hashed_password=pwd_context.hash("123456")
        )
        db.add(test_user)
        db.commit()

        print("\nSample data created successfully!")
        print("Word banks created:")
        for bank_name, count in created_banks:
            target = WORD_BANK_TARGETS.get(bank_name, 0)
            status = "OK" if count >= target else f"NEED {target - count} MORE"
            print(f"  - {bank_name}: {count}/{target} words [{status}]")
        print("\nTest user created (username: test, password: 123456)")

    except Exception as e:
        print(f"Error creating sample data: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Initializing database...")
    init_db()
    print("Creating sample data...")
    create_sample_data()
    print("Done!")
