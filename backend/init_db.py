"""Initialize database with sample data"""

from sqlalchemy.orm import Session
from app.database import SessionLocal, init_db
from app.models.user import User
from app.models.word import WordBank, Word
from passlib.context import CryptContext
import json

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_sample_data():
    """Create sample word banks and words"""
    db: Session = SessionLocal()

    try:
        # Check if data already exists
        if db.query(WordBank).first():
            print("⚠️  Database already has data, skipping sample data creation")
            return

        # Create word banks with difficulty levels
        word_banks = [
            WordBank(
                name="高考英语",
                description="高考英语核心词汇，覆盖高中英语课程大纲",
                total_words=3,
                difficulty_level=2
            ),
            WordBank(
                name="四级词汇",
                description="大学英语四级核心词汇，适合大学四级考试备考",
                total_words=3,
                difficulty_level=2
            ),
            WordBank(
                name="六级词汇",
                description="大学英语六级核心词汇，适合大学六级考试备考",
                total_words=3,
                difficulty_level=3
            ),
            WordBank(
                name="考研词汇",
                description="考研英语核心词汇，适合研究生入学考试备考",
                total_words=3,
                difficulty_level=3
            ),
            WordBank(
                name="托福词汇",
                description="托福考试核心词汇，涵盖学科词汇和常用词汇",
                total_words=3,
                difficulty_level=4
            ),
            WordBank(
                name="雅思词汇",
                description="雅思考试核心词汇，包含学术词汇和生活词汇",
                total_words=3,
                difficulty_level=4
            ),
            WordBank(
                name="GRE词汇",
                description="GRE考试核心词汇，高难度词汇和学术词汇",
                total_words=3,
                difficulty_level=5
            ),
            WordBank(
                name="商务英语",
                description="商务场景常用词汇，包含商务场景例句",
                total_words=3,
                difficulty_level=3
            ),
            WordBank(
                name="生活口语",
                description="日常生活常用口语词汇和短语",
                total_words=3,
                difficulty_level=1
            ),
        ]

        db.add_all(word_banks)
        db.commit()

        # Refresh to get IDs
        for wb in word_banks:
            db.refresh(wb)

        # Create sample words for each word bank
        all_words = []

        # 高考英语 words
        gaokao_words = [
            Word(
                word_bank_id=word_banks[0].id,
                spelling="abandon",
                phonetic="/əˈbændən/",
                meaning="v. 放弃；抛弃",
                example_sentence="He abandoned his family and went abroad.",
                order_index=1,
                word_root="a- (to) + bandon (ban/proclaim)",
                difficulty_level=2,
                frequency=850,
                synonyms=json.dumps(["give up", "desert", "forsake"]),
                antonyms=json.dumps(["continue", "maintain", "keep"])
            ),
            Word(
                word_bank_id=word_banks[0].id,
                spelling="ability",
                phonetic="/əˈbɪləti/",
                meaning="n. 能力；才能",
                example_sentence="She has the ability to solve this problem.",
                order_index=2,
                word_root="able + -ity (noun suffix)",
                difficulty_level=1,
                frequency=1200,
                synonyms=json.dumps(["capability", "capacity", "skill"]),
                antonyms=json.dumps(["inability", "incapacity"])
            ),
            Word(
                word_bank_id=word_banks[0].id,
                spelling="absorb",
                phonetic="/əbˈsɔːrb/",
                meaning="v. 吸收；吸引",
                example_sentence="Plants absorb water from the soil.",
                order_index=3,
                word_root="ab- (from) + sorb (suck in)",
                difficulty_level=2,
                frequency=900,
                synonyms=json.dumps(["soak up", "take in", "assimilate"]),
                antonyms=json.dumps(["release", "emit", "exude"])
            ),
        ]
        all_words.extend(gaokao_words)

        # 四级词汇 words
        cet4_words = [
            Word(
                word_bank_id=word_banks[1].id,
                spelling="academic",
                phonetic="/ˌækəˈdemɪk/",
                meaning="adj. 学术的；学业的",
                example_sentence="She has excellent academic performance.",
                order_index=1,
                word_root="academy + -ic (adjective suffix)",
                difficulty_level=2,
                frequency=1100,
                synonyms=json.dumps(["scholarly", "educational", "intellectual"]),
                antonyms=json.dumps(["non-academic", "practical"])
            ),
            Word(
                word_bank_id=word_banks[1].id,
                spelling="accelerate",
                phonetic="/əkˈseləreɪt/",
                meaning="v. 加速；促进",
                example_sentence="The car began to accelerate down the hill.",
                order_index=2,
                word_root="ac- (to) + celer (swift) + -ate (verb suffix)",
                difficulty_level=2,
                frequency=800,
                synonyms=json.dumps(["speed up", "quicken", "hasten"]),
                antonyms=json.dumps(["decelerate", "slow down", "delay"])
            ),
            Word(
                word_bank_id=word_banks[1].id,
                spelling="acceptable",
                phonetic="/əkˈseptəbl/",
                meaning="adj. 可接受的；合意的",
                example_sentence="The proposal was acceptable to all parties.",
                order_index=3,
                word_root="accept + -able (adjective suffix)",
                difficulty_level=2,
                frequency=950,
                synonyms=json.dumps(["agreeable", "satisfactory", "adequate"]),
                antonyms=json.dumps(["unacceptable", "objectionable"])
            ),
        ]
        all_words.extend(cet4_words)

        # 六级词汇 words
        cet6_words = [
            Word(
                word_bank_id=word_banks[2].id,
                spelling="abstract",
                phonetic="/ˈæbstrækt/",
                meaning="adj. 抽象的；n. 摘要",
                example_sentence="The concept is quite abstract and difficult to understand.",
                order_index=1,
                word_root="abs- (away) + tract (draw)",
                difficulty_level=3,
                frequency=750,
                synonyms=json.dumps(["conceptual", "theoretical", "non-concrete"]),
                antonyms=json.dumps(["concrete", "specific", "tangible"])
            ),
            Word(
                word_bank_id=word_banks[2].id,
                spelling="accommodate",
                phonetic="/əˈkɒmədeɪt/",
                meaning="v. 容纳；适应；提供住宿",
                example_sentence="The hotel can accommodate up to 500 guests.",
                order_index=2,
                word_root="ac- (to) + commod (fitting) + -ate",
                difficulty_level=3,
                frequency=650,
                synonyms=json.dumps(["house", "lodge", "adjust"]),
                antonyms=json.dumps(["displace", "discommode"])
            ),
            Word(
                word_bank_id=word_banks[2].id,
                spelling="accumulation",
                phonetic="/əˌkjuːmjʊˈleɪʃn/",
                meaning="n. 积累；堆积物",
                example_sentence="The accumulation of wealth takes time and effort.",
                order_index=3,
                word_root="accumulate + -ion (noun suffix)",
                difficulty_level=3,
                frequency=580,
                synonyms=json.dumps(["collection", "gathering", "amassment"]),
                antonyms=json.dumps(["dispersal", "dissipation"])
            ),
        ]
        all_words.extend(cet6_words)

        # 考研词汇 words
        kaoyan_words = [
            Word(
                word_bank_id=word_banks[3].id,
                spelling="acknowledge",
                phonetic="/əkˈnɒlɪdʒ/",
                meaning="v. 承认；确认；感谢",
                example_sentence="He acknowledged his mistake and apologized.",
                order_index=1,
                word_root="ac- (to) + knowledge",
                difficulty_level=3,
                frequency=700,
                synonyms=json.dumps(["admit", "recognize", "concede"]),
                antonyms=json.dumps(["deny", "dispute", "contradict"])
            ),
            Word(
                word_bank_id=word_banks[3].id,
                spelling="acquaintance",
                phonetic="/əˈkweɪntəns/",
                meaning="n. 熟人；了解",
                example_sentence="He is just an acquaintance, not a close friend.",
                order_index=2,
                word_root="acquaint + -ance (noun suffix)",
                difficulty_level=3,
                frequency=520,
                synonyms=json.dumps(["contact", "associate", "familiarity"]),
                antonyms=json.dumps(["stranger", "unfamiliarity"])
            ),
            Word(
                word_bank_id=word_banks[3].id,
                spelling="adversity",
                phonetic="/ədˈvɜːrsəti/",
                meaning="n. 逆境；不幸",
                example_sentence="He overcame many adversities to achieve success.",
                order_index=3,
                word_root="adverse + -ity (noun suffix)",
                difficulty_level=4,
                frequency=350,
                synonyms=json.dumps(["hardship", "misfortune", "trouble"]),
                antonyms=json.dumps(["prosperity", "fortune", "success"])
            ),
        ]
        all_words.extend(kaoyan_words)

        # 托福词汇 words
        toefl_words = [
            Word(
                word_bank_id=word_banks[4].id,
                spelling="aesthetic",
                phonetic="/esˈθetɪk/",
                meaning="adj. 美学的；审美的",
                example_sentence="The building has great aesthetic appeal.",
                order_index=1,
                word_root="Greek aisthetikos (perceptive)",
                difficulty_level=4,
                frequency=480,
                synonyms=json.dumps(["artistic", "beautiful", "tasteful"]),
                antonyms=json.dumps(["unaesthetic", "ugly"])
            ),
            Word(
                word_bank_id=word_banks[4].id,
                spelling="affluent",
                phonetic="/ˈæfluənt/",
                meaning="adj. 富裕的；丰富的",
                example_sentence="The affluent neighborhood has large houses.",
                order_index=2,
                word_root="af- (to) + fluere (flow)",
                difficulty_level=4,
                frequency=550,
                synonyms=json.dumps(["wealthy", "rich", "prosperous"]),
                antonyms=json.dumps(["poor", "impoverished", "needy"])
            ),
            Word(
                word_bank_id=word_banks[4].id,
                spelling="aggravate",
                phonetic="/ˈæɡrəveɪt/",
                meaning="v. 加重；恶化",
                example_sentence="His behavior only aggravated the situation.",
                order_index=3,
                word_root="ad- (to) + gravare (make heavy)",
                difficulty_level=4,
                frequency=420,
                synonyms=json.dumps(["worsen", "intensify", "exasperate"]),
                antonyms=json.dumps(["alleviate", "improve", "mitigate"])
            ),
        ]
        all_words.extend(toefl_words)

        # 雅思词汇 words
        ielts_words = [
            Word(
                word_bank_id=word_banks[5].id,
                spelling="alleviate",
                phonetic="/əˈliːvieɪt/",
                meaning="v. 减轻；缓解",
                example_sentence="The medicine helped alleviate his pain.",
                order_index=1,
                word_root="al- (to) + levis (light)",
                difficulty_level=4,
                frequency=380,
                synonyms=json.dumps(["relieve", "ease", "mitigate"]),
                antonyms=json.dumps(["aggravate", "intensify", "worsen"])
            ),
            Word(
                word_bank_id=word_banks[5].id,
                spelling="ambiguous",
                phonetic="/æmˈbɪɡjuəs/",
                meaning="adj. 模棱两可的；含糊的",
                example_sentence="The ambiguous statement confused everyone.",
                order_index=2,
                word_root="ambi- (both) + agere (drive)",
                difficulty_level=4,
                frequency=450,
                synonyms=json.dumps(["vague", "unclear", "equivocal"]),
                antonyms=json.dumps(["clear", "unambiguous", "explicit"])
            ),
            Word(
                word_bank_id=word_banks[5].id,
                spelling="amplify",
                phonetic="/ˈæmplɪfaɪ/",
                meaning="v. 放大；增强",
                example_sentence="The speaker used a microphone to amplify his voice.",
                order_index=3,
                word_root="ampli- (large) + -fy (make)",
                difficulty_level=4,
                frequency=400,
                synonyms=json.dumps(["expand", "magnify", "increase"]),
                antonyms=json.dumps(["reduce", "diminish", "minimize"])
            ),
        ]
        all_words.extend(ielts_words)

        # GRE词汇 words
        gre_words = [
            Word(
                word_bank_id=word_banks[6].id,
                spelling="anachronism",
                phonetic="/əˈnækrənɪzəm/",
                meaning="n. 时代错误；过时事物",
                example_sentence="The medieval castle in the modern city is an anachronism.",
                order_index=1,
                word_root="ana- (back) + chronos (time) + -ism",
                difficulty_level=5,
                frequency=180,
                synonyms=json.dumps(["outdatedness", "antiquity"]),
                antonyms=json.dumps(["contemporary", "modernism"])
            ),
            Word(
                word_bank_id=word_banks[6].id,
                spelling="anomaly",
                phonetic="/əˈnɒməli/",
                meaning="n. 异常；反常事物",
                example_sentence="The warm weather in December was an anomaly.",
                order_index=2,
                word_root="an- (not) + homalos (even)",
                difficulty_level=5,
                frequency=280,
                synonyms=json.dumps(["abnormality", "irregularity", "peculiarity"]),
                antonyms=json.dumps(["normality", "regularity", "conformity"])
            ),
            Word(
                word_bank_id=word_banks[6].id,
                spelling="antithesis",
                phonetic="/ænˈtɪθəsɪs/",
                meaning="n. 对立面；对立",
                example_sentence="His actions were the antithesis of his words.",
                order_index=3,
                word_root="anti- (against) + thesis (placing)",
                difficulty_level=5,
                frequency=250,
                synonyms=json.dumps(["opposite", "contrast", "contradiction"]),
                antonyms=json.dumps(["sameness", "similarity", "agreement"])
            ),
        ]
        all_words.extend(gre_words)

        # 商务英语 words
        business_words = [
            Word(
                word_bank_id=word_banks[7].id,
                spelling="acquisition",
                phonetic="/ˌækwɪˈzɪʃn/",
                meaning="n. 收购；获得",
                example_sentence="The company announced the acquisition of its competitor.",
                order_index=1,
                word_root="acquire + -ition (noun suffix)",
                difficulty_level=3,
                frequency=600,
                synonyms=json.dumps(["purchase", "buyout", "procurement"]),
                antonyms=json.dumps(["divestiture", "sale"])
            ),
            Word(
                word_bank_id=word_banks[7].id,
                spelling="benchmark",
                phonetic="/ˈbentʃmɑːrk/",
                meaning="n. 基准；v. 以...为基准",
                example_sentence="We need to benchmark our performance against competitors.",
                order_index=2,
                word_root="bench + mark",
                difficulty_level=3,
                frequency=520,
                synonyms=json.dumps(["standard", "criterion", "reference point"]),
                antonyms=json.dumps([])
            ),
            Word(
                word_bank_id=word_banks[7].id,
                spelling="consolidate",
                phonetic="/kənˈsɒlɪdeɪt/",
                meaning="v. 合并；巩固",
                example_sentence="The company decided to consolidate its operations.",
                order_index=3,
                word_root="con- (together) + solidus (solid) + -ate",
                difficulty_level=3,
                frequency=480,
                synonyms=json.dumps(["merge", "unite", "combine"]),
                antonyms=json.dumps(["separate", "divide", "fragment"])
            ),
        ]
        all_words.extend(business_words)

        # 生活口语 words
        life_words = [
            Word(
                word_bank_id=word_banks[8].id,
                spelling="awesome",
                phonetic="/ˈɔːsəm/",
                meaning="adj. 很棒的；极好的",
                example_sentence="That movie was awesome! I loved it!",
                order_index=1,
                word_root="awe + -some (adjective suffix)",
                difficulty_level=1,
                frequency=1500,
                synonyms=json.dumps(["amazing", "fantastic", "great"]),
                antonyms=json.dumps(["terrible", "awful", "horrible"])
            ),
            Word(
                word_bank_id=word_banks[8].id,
                spelling="hang out",
                phonetic="/hæŋ aʊt/",
                meaning="v. 闲逛；消磨时间",
                example_sentence="Let's hang out at the mall this weekend.",
                order_index=2,
                word_root="phrasal verb",
                difficulty_level=1,
                frequency=1200,
                synonyms=json.dumps(["spend time", "chill", "relax"]),
                antonyms=json.dumps([])
            ),
            Word(
                word_bank_id=word_banks[8].id,
                spelling="no worries",
                phonetic="/nəʊ ˈwʌriz/",
                meaning="phrase. 没关系；不用担心",
                example_sentence="No worries, I'll handle it.",
                order_index=3,
                word_root="phrase",
                difficulty_level=1,
                frequency=1800,
                synonyms=json.dumps(["no problem", "it's okay", "don't worry"]),
                antonyms=json.dumps([])
            ),
        ]
        all_words.extend(life_words)

        db.add_all(all_words)
        db.commit()

        # Create a test user
        test_user = User(
            username="test",
            email="test@example.com",
            hashed_password=pwd_context.hash("123456")
        )
        db.add(test_user)
        db.commit()

        print("✅ Sample data created successfully!")
        print(f"   - 9 word banks: 高考英语, 四级词汇, 六级词汇, 考研词汇, 托福词汇, 雅思词汇, GRE词汇, 商务英语, 生活口语")
        print(f"   - 27 sample words (3 per word bank)")
        print(f"   - 1 test user (username: test, password: 123456)")

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
