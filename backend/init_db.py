"""Initialize database with sample data"""

from sqlalchemy.orm import Session
from app.database import SessionLocal, init_db
from app.models.user import User
from app.models.word import WordBank, Word
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_sample_data():
    """Create sample word banks and words"""
    db: Session = SessionLocal()

    try:
        # Check if data already exists
        if db.query(WordBank).first():
            print("⚠️  Database already has data, skipping sample data creation")
            return

        # Create word banks
        gaokao_bank = WordBank(
            name="高考英语",
            description="高考英语核心词汇",
            total_words=3
        )
        kaoyan_bank = WordBank(
            name="考研英语",
            description="考研英语核心词汇",
            total_words=2
        )
        life_bank = WordBank(
            name="生活英语",
            description="日常生活常用词汇",
            total_words=2
        )

        db.add_all([gaokao_bank, kaoyan_bank, life_bank])
        db.commit()

        # Create words for 高考英语
        gaokao_words = [
            Word(
                word_bank_id=gaokao_bank.id,
                spelling="abandon",
                phonetic="/əˈbændən/",
                meaning="v. 放弃；抛弃",
                example_sentence="He abandoned his family and went abroad.",
                order_index=1
            ),
            Word(
                word_bank_id=gaokao_bank.id,
                spelling="ability",
                phonetic="/əˈbɪləti/",
                meaning="n. 能力；才能",
                example_sentence="She has the ability to solve this problem.",
                order_index=2
            ),
            Word(
                word_bank_id=gaokao_bank.id,
                spelling="absorb",
                phonetic="/əbˈsɔːrb/",
                meaning="v. 吸收；吸引",
                example_sentence="Plants absorb water from the soil.",
                order_index=3
            ),
        ]

        # Create words for 考研英语
        kaoyan_words = [
            Word(
                word_bank_id=kaoyan_bank.id,
                spelling="abstract",
                phonetic="/ˈæbstrækt/",
                meaning="adj. 抽象的；n. 摘要",
                example_sentence="The concept is quite abstract.",
                order_index=1
            ),
            Word(
                word_bank_id=kaoyan_bank.id,
                spelling="accelerate",
                phonetic="/əkˈseləreɪt/",
                meaning="v. 加速；促进",
                example_sentence="The car began to accelerate.",
                order_index=2
            ),
        ]

        # Create words for 生活英语
        life_words = [
            Word(
                word_bank_id=life_bank.id,
                spelling="hello",
                phonetic="/həˈloʊ/",
                meaning="int. 你好",
                example_sentence="Hello, nice to meet you!",
                order_index=1
            ),
            Word(
                word_bank_id=life_bank.id,
                spelling="thank",
                phonetic="/θæŋk/",
                meaning="v. 感谢",
                example_sentence="Thank you for your help.",
                order_index=2
            ),
        ]

        db.add_all(gaokao_words + kaoyan_words + life_words)
        db.commit()

        # Create a test user
        test_user = User(
            username="testuser",
            email="test@example.com",
            hashed_password=pwd_context.hash("testpass123")
        )
        db.add(test_user)
        db.commit()

        print("✅ Sample data created successfully!")
        print(f"   - 3 word banks: 高考英语, 考研英语, 生活英语")
        print(f"   - 7 sample words")
        print(f"   - 1 test user (username: testuser, password: testpass123)")

    except Exception as e:
        print(f"❌ Error creating sample data: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("🚀 Initializing database...")
    init_db()
    print("📦 Creating sample data...")
    create_sample_data()
    print("✨ Done!")
