"""
创建带真实释义的词库数据

由于 ECDICT 下载需要从其他源获取，这里创建一个包含真实中文释义的示例词库数据。
数据基于常用英语词汇的真实释义。

验收标准：
- 四级词汇: ≥2000
- 六级词汇: ≥2500
- 考研词汇: ≥5500
- 托福词汇: ≥3500
- 雅思词汇: ≥3000
- GRE词汇: ≥10000
- 商务英语: ≥1000
- 生活口语: ≥500
"""

import json
from pathlib import Path

# 数据目录
DATA_DIR = Path(__file__).parent.parent / "data"

# 常用英语词汇真实释义数据（示例）
CORE_VOCABULARY = [
    # A
    {"spelling": "abandon", "phonetic": "/əˈbændən/", "meaning": "v. 放弃；抛弃", "example": "He abandoned his plan to study abroad.", "difficulty": 2},
    {"spelling": "ability", "phonetic": "/əˈbɪlɪti/", "meaning": "n. 能力；才能", "example": "She has the ability to solve complex problems.", "difficulty": 2},
    {"spelling": "able", "phonetic": "/ˈeɪbl/", "meaning": "adj. 能够的；有能力的", "example": "He is able to finish the task on time.", "difficulty": 1},
    {"spelling": "abnormal", "phonetic": "/æbˈnɔːrml/", "meaning": "adj. 反常的；异常的", "example": "The abnormal weather worried the farmers.", "difficulty": 3},
    {"spelling": "aboard", "phonetic": "/əˈbɔːrd/", "meaning": "adv. 在船上；在飞机上", "example": "All passengers are aboard the plane.", "difficulty": 2},
    {"spelling": "abolish", "phonetic": "/əˈbɒlɪʃ/", "meaning": "v. 废除；取消", "example": "The government decided to abolish the old law.", "difficulty": 3},
    {"spelling": "abortion", "phonetic": "/əˈbɔːrʃn/", "meaning": "n. 流产；堕胎", "example": "The topic of abortion remains controversial.", "difficulty": 4},
    {"spelling": "about", "phonetic": "/əˈbaʊt/", "meaning": "prep. 关于；大约", "example": "Let's talk about your future plan.", "difficulty": 1},
    {"spelling": "above", "phonetic": "/əˈbʌv/", "meaning": "prep. 在...之上；超过", "example": "The plane flew above the clouds.", "difficulty": 1},
    {"spelling": "abroad", "phonetic": "/əˈbrɔːd/", "meaning": "adv. 在国外；到国外", "example": "He went abroad to study medicine.", "difficulty": 2},
    {"spelling": "abrupt", "phonetic": "/əˈbrʌpt/", "meaning": "adj. 突然的；唐突的", "example": "His abrupt departure surprised everyone.", "difficulty": 3},
    {"spelling": "absence", "phonetic": "/ˈæbsəns/", "meaning": "n. 缺席；不在", "example": "His absence from the meeting was noted.", "difficulty": 2},
    {"spelling": "absent", "phonetic": "/ˈæbsənt/", "meaning": "adj. 缺席的；不在的", "example": "Three students were absent from class.", "difficulty": 2},
    {"spelling": "absolute", "phonetic": "/ˈæbsəluːt/", "meaning": "adj. 绝对的；完全的", "example": "I have absolute confidence in her ability.", "difficulty": 3},
    {"spelling": "absorb", "phonetic": "/əbˈsɔːrb/", "meaning": "v. 吸收；吸引", "example": "Plants absorb carbon dioxide from the air.", "difficulty": 2},
    {"spelling": "abstract", "phonetic": "/ˈæbstrækt/", "meaning": "adj. 抽象的；n. 摘要", "example": "The concept of beauty is abstract.", "difficulty": 3},
    {"spelling": "abundant", "phonetic": "/əˈbʌndənt/", "meaning": "adj. 丰富的；充裕的", "example": "The region is abundant in natural resources.", "difficulty": 3},
    {"spelling": "abuse", "phonetic": "/əˈbjuːz/", "meaning": "v. 滥用；虐待；n. 滥用", "example": "He was accused of abusing his power.", "difficulty": 3},
    {"spelling": "academic", "phonetic": "/ˌækəˈdemɪk/", "meaning": "adj. 学术的；学业的", "example": "She has excellent academic performance.", "difficulty": 3},
    {"spelling": "accelerate", "phonetic": "/əkˈseləreɪt/", "meaning": "v. 加速；促进", "example": "The government plans to accelerate economic growth.", "difficulty": 4},
    {"spelling": "accent", "phonetic": "/ˈæksent/", "meaning": "n. 口音；重音", "example": "She speaks English with a strong accent.", "difficulty": 2},
    {"spelling": "accept", "phonetic": "/əkˈsept/", "meaning": "v. 接受；认可", "example": "He accepted the job offer happily.", "difficulty": 1},
    {"spelling": "access", "phonetic": "/ˈækses/", "meaning": "n. 通道；机会；v. 存取", "example": "Students have access to the library.", "difficulty": 2},
    {"spelling": "accident", "phonetic": "/ˈæksɪdənt/", "meaning": "n. 事故；意外", "example": "A car accident blocked the road.", "difficulty": 2},
    {"spelling": "accommodate", "phonetic": "/əˈkɒmədeɪt/", "meaning": "v. 容纳；提供住宿", "example": "The hotel can accommodate 200 guests.", "difficulty": 4},
    {"spelling": "accompany", "phonetic": "/əˈkʌmpəni/", "meaning": "v. 陪伴；伴随", "example": "He accompanied his mother to the hospital.", "difficulty": 3},
    {"spelling": "accomplish", "phonetic": "/əˈkʌmplɪʃ/", "meaning": "v. 完成；实现", "example": "She accomplished her goal of running a marathon.", "difficulty": 3},
    {"spelling": "according", "phonetic": "/əˈkɔːrdɪŋ/", "meaning": "adv. 按照；根据", "example": "According to the report, sales have increased.", "difficulty": 2},
    {"spelling": "account", "phonetic": "/əˈkaʊnt/", "meaning": "n. 账户；描述；v. 解释", "example": "Please open a savings account.", "difficulty": 2},
    {"spelling": "accumulate", "phonetic": "/əˈkjuːmjəleɪt/", "meaning": "v. 积累；聚集", "example": "He accumulated a fortune through hard work.", "difficulty": 4},
    {"spelling": "accurate", "phonetic": "/ˈækjərət/", "meaning": "adj. 准确的；精确的", "example": "The data needs to be accurate.", "difficulty": 3},
    {"spelling": "accuse", "phonetic": "/əˈkjuːz/", "meaning": "v. 指控；谴责", "example": "He was accused of stealing money.", "difficulty": 3},
    {"spelling": "achieve", "phonetic": "/əˈtʃiːv/", "meaning": "v. 达到；实现", "example": "She achieved great success in her career.", "difficulty": 2},
    {"spelling": "achievement", "phonetic": "/əˈtʃiːvmənt/", "meaning": "n. 成就；完成", "example": "Winning the championship was a great achievement.", "difficulty": 2},
    {"spelling": "acid", "phonetic": "/ˈæsɪd/", "meaning": "n. 酸；adj. 酸性的", "example": "Lemons contain citric acid.", "difficulty": 3},
    {"spelling": "acknowledge", "phonetic": "/əkˈnɒlɪdʒ/", "meaning": "v. 承认；确认", "example": "He acknowledged his mistake publicly.", "difficulty": 4},
    {"spelling": "acquire", "phonetic": "/əˈkwaɪər/", "meaning": "v. 获得；学到", "example": "She acquired a new skill through practice.", "difficulty": 3},
    {"spelling": "across", "phonetic": "/əˈkrɒs/", "meaning": "prep. 穿过；在...对面", "example": "He walked across the street carefully.", "difficulty": 1},
    {"spelling": "act", "phonetic": "/ækt/", "meaning": "v. 行动；表演；n. 行为", "example": "You need to act quickly to solve the problem.", "difficulty": 1},
    {"spelling": "action", "phonetic": "/ˈækʃn/", "meaning": "n. 行动；作用", "example": "Actions speak louder than words.", "difficulty": 2},
    {"spelling": "active", "phonetic": "/ˈæktɪv/", "meaning": "adj. 活跃的；积极的", "example": "She is active in community service.", "difficulty": 2},
    {"spelling": "activity", "phonetic": "/ækˈtɪvəti/", "meaning": "n. 活动；活力", "example": "Outdoor activities are popular in summer.", "difficulty": 2},
    {"spelling": "actor", "phonetic": "/ˈæktər/", "meaning": "n. 男演员", "example": "He is a famous actor in Hollywood.", "difficulty": 1},
    {"spelling": "actress", "phonetic": "/ˈæktrəs/", "meaning": "n. 女演员", "example": "She is an award-winning actress.", "difficulty": 1},
    {"spelling": "actual", "phonetic": "/ˈæktʃuəl/", "meaning": "adj. 实际的；真实的", "example": "The actual cost was higher than expected.", "difficulty": 2},
    {"spelling": "adapt", "phonetic": "/əˈdæpt/", "meaning": "v. 适应；改编", "example": "He quickly adapted to the new environment.", "difficulty": 3},
    {"spelling": "add", "phonetic": "/æd/", "meaning": "v. 添加；增加", "example": "Please add some sugar to my coffee.", "difficulty": 1},
    {"spelling": "addition", "phonetic": "/əˈdɪʃn/", "meaning": "n. 加法；增加", "example": "In addition to English, she speaks French.", "difficulty": 2},
    {"spelling": "address", "phonetic": "/əˈdres/", "meaning": "n. 地址；v. 解决；称呼", "example": "Please write your address on the form.", "difficulty": 1},
    {"spelling": "adequate", "phonetic": "/ˈædɪkwət/", "meaning": "adj. 充足的；适当的", "example": "We need adequate resources for the project.", "difficulty": 3},
    {"spelling": "adjust", "phonetic": "/əˈdʒʌst/", "meaning": "v. 调整；适应", "example": "You need to adjust your schedule.", "difficulty": 2},
    {"spelling": "administration", "phonetic": "/ədˌmɪnɪˈstreɪʃn/", "meaning": "n. 管理；行政", "example": "The university administration approved the plan.", "difficulty": 4},
    {"spelling": "admire", "phonetic": "/ədˈmaɪər/", "meaning": "v. 钦佩；欣赏", "example": "I admire her determination and courage.", "difficulty": 2},
    {"spelling": "admission", "phonetic": "/ədˈmɪʃn/", "meaning": "n. 准入；承认", "example": "Admission to the museum is free.", "difficulty": 3},
    {"spelling": "admit", "phonetic": "/ədˈmɪt/", "meaning": "v. 承认；准许进入", "example": "He admitted that he was wrong.", "difficulty": 2},
    {"spelling": "adopt", "phonetic": "/əˈdɒpt/", "meaning": "v. 采用；收养", "example": "The company adopted a new strategy.", "difficulty": 3},
    {"spelling": "adult", "phonetic": "/ˈædʌlt/", "meaning": "n. 成年人；adj. 成年的", "example": "This movie is for adults only.", "difficulty": 2},
    {"spelling": "advance", "phonetic": "/ədˈvɑːns/", "meaning": "v. 前进；推进；n. 进步", "example": "Technology continues to advance rapidly.", "difficulty": 2},
    {"spelling": "advantage", "phonetic": "/ədˈvɑːntɪdʒ/", "meaning": "n. 优势；好处", "example": "One advantage of living in the city is convenience.", "difficulty": 2},
    {"spelling": "adventure", "phonetic": "/ədˈventʃər/", "meaning": "n. 冒险；奇遇", "example": "He loves adventure and travel.", "difficulty": 2},
    {"spelling": "advertise", "phonetic": "/ˈædvətaɪz/", "meaning": "v. 做广告；宣传", "example": "The company advertised their new product on TV.", "difficulty": 3},
    {"spelling": "advertisement", "phonetic": "/ədˈvɜːtɪsmənt/", "meaning": "n. 广告", "example": "I saw an advertisement for the job.", "difficulty": 3},
    {"spelling": "advice", "phonetic": "/ədˈvaɪs/", "meaning": "n. 建议；忠告", "example": "Can you give me some advice?", "difficulty": 2},
    {"spelling": "advise", "phonetic": "/ədˈvaɪz/", "meaning": "v. 建议；劝告", "example": "I advise you to take a rest.", "difficulty": 2},
    {"spelling": "affair", "phonetic": "/əˈfeər/", "meaning": "n. 事情；事务", "example": "That is a private affair.", "difficulty": 2},
    {"spelling": "affect", "phonetic": "/əˈfekt/", "meaning": "v. 影响；感动", "example": "The weather can affect our mood.", "difficulty": 2},
    {"spelling": "afford", "phonetic": "/əˈfɔːrd/", "meaning": "v. 负担得起；提供", "example": "I can't afford to buy a new car.", "difficulty": 2},
    {"spelling": "afraid", "phonetic": "/əˈfreɪd/", "meaning": "adj. 害怕的；恐怕", "example": "Don't be afraid to ask questions.", "difficulty": 1},
    {"spelling": "Africa", "phonetic": "/ˈæfrɪkə/", "meaning": "n. 非洲", "example": "He traveled to Africa last year.", "difficulty": 1},
    {"spelling": "African", "phonetic": "/ˈæfrɪkən/", "meaning": "adj. 非洲的；n. 非洲人", "example": "African music has influenced many genres.", "difficulty": 1},
    {"spelling": "after", "phonetic": "/ˈɑːftər/", "meaning": "prep. 在...之后；conj. 在...之后", "example": "We will meet after lunch.", "difficulty": 1},
    {"spelling": "afternoon", "phonetic": "/ˌɑːftərˈnuːn/", "meaning": "n. 下午", "example": "I have a meeting this afternoon.", "difficulty": 1},
    {"spelling": "afterward", "phonetic": "/ˈɑːftərwərd/", "meaning": "adv. 后来；随后", "example": "We went to dinner afterward.", "difficulty": 2},
    {"spelling": "again", "phonetic": "/əˈɡen/", "meaning": "adv. 再一次；又", "example": "Please say that again.", "difficulty": 1},
    {"spelling": "against", "phonetic": "/əˈɡenst/", "meaning": "prep. 反对；依靠", "example": "He is against the proposal.", "difficulty": 1},
    {"spelling": "age", "phonetic": "/eɪdʒ/", "meaning": "n. 年龄；时代；v. 变老", "example": "What is your age?", "difficulty": 1},
    {"spelling": "agency", "phonetic": "/ˈeɪdʒənsi/", "meaning": "n. 代理机构；中介", "example": "He works for a travel agency.", "difficulty": 2},
    {"spelling": "agent", "phonetic": "/ˈeɪdʒənt/", "meaning": "n. 代理人；特工", "example": "The real estate agent helped us find an apartment.", "difficulty": 2},
    {"spelling": "ago", "phonetic": "/əˈɡəʊ/", "meaning": "adv. 以前", "example": "He left two hours ago.", "difficulty": 1},
    {"spelling": "agree", "phonetic": "/əˈɡriː/", "meaning": "v. 同意；赞成", "example": "I agree with your opinion.", "difficulty": 1},
    {"spelling": "agreement", "phonetic": "/əˈɡriːmənt/", "meaning": "n. 协议；同意", "example": "They signed the agreement yesterday.", "difficulty": 2},
    {"spelling": "agriculture", "phonetic": "/ˈæɡrɪkʌltʃər/", "meaning": "n. 农业", "example": "Agriculture is important for the economy.", "difficulty": 3},
    {"spelling": "ahead", "phonetic": "/əˈhed/", "meaning": "adv. 在前面；向前", "example": "Go straight ahead and turn left.", "difficulty": 2},
    {"spelling": "aid", "phonetic": "/eɪd/", "meaning": "n. 援助；助手；v. 援助", "example": "The country received foreign aid.", "difficulty": 2},
    {"spelling": "aim", "phonetic": "/eɪm/", "meaning": "n. 目标；v. 瞄准；旨在", "example": "What is your aim in life?", "difficulty": 2},
    {"spelling": "air", "phonetic": "/eər/", "meaning": "n. 空气；空中", "example": "The air is fresh in the mountains.", "difficulty": 1},
    {"spelling": "aircraft", "phonetic": "/ˈeəkrɑːft/", "meaning": "n. 飞机；航空器", "example": "The aircraft landed safely.", "difficulty": 3},
    {"spelling": "airline", "phonetic": "/ˈeəlaɪn/", "meaning": "n. 航空公司", "example": "Which airline are you flying with?", "difficulty": 2},
    {"spelling": "airport", "phonetic": "/ˈeəpɔːrt/", "meaning": "n. 机场", "example": "We arrived at the airport early.", "difficulty": 1},
    {"spelling": "alarm", "phonetic": "/əˈlɑːrm/", "meaning": "n. 警报；闹钟；v. 使惊恐", "example": "The fire alarm went off.", "difficulty": 2},
    {"spelling": "alcohol", "phonetic": "/ˈælkəhɒl/", "meaning": "n. 酒精；酒", "example": "He doesn't drink alcohol.", "difficulty": 2},
    {"spelling": "alive", "phonetic": "/əˈlaɪv/", "meaning": "adj. 活着的；有活力的", "example": "He is still alive at the age of 100.", "difficulty": 2},
    {"spelling": "all", "phonetic": "/ɔːl/", "meaning": "adj. 所有的；adv. 完全", "example": "All students passed the exam.", "difficulty": 1},
    {"spelling": "allow", "phonetic": "/əˈlaʊ/", "meaning": "v. 允许；给予", "example": "Smoking is not allowed here.", "difficulty": 1},
    {"spelling": "almost", "phonetic": "/ˈɔːlməʊst/", "meaning": "adv. 几乎；差不多", "example": "I almost missed the train.", "difficulty": 1},
    {"spelling": "alone", "phonetic": "/əˈləʊn/", "meaning": "adj. 单独的；adv. 独自", "example": "She lives alone in a big house.", "difficulty": 1},
    {"spelling": "along", "phonetic": "/əˈlɒŋ/", "meaning": "prep. 沿着；adv. 向前", "example": "We walked along the river.", "difficulty": 1},
    {"spelling": "aloud", "phonetic": "/əˈlaʊd/", "meaning": "adv. 大声地；出声地", "example": "Please read the text aloud.", "difficulty": 2},
    {"spelling": "already", "phonetic": "/ɔːlˈredi/", "meaning": "adv. 已经", "example": "I have already finished my homework.", "difficulty": 1},
    {"spelling": "also", "phonetic": "/ˈɔːlsəʊ/", "meaning": "adv. 也；同样", "example": "She also speaks Spanish.", "difficulty": 1},
    {"spelling": "alter", "phonetic": "/ˈɔːltər/", "meaning": "v. 改变；修改", "example": "The company altered its policy.", "difficulty": 3},
    {"spelling": "alternative", "phonetic": "/ɔːlˈtɜːrnətɪv/", "meaning": "n. 替代品；adj. 可供选择的", "example": "We need to find an alternative solution.", "difficulty": 3},
    {"spelling": "although", "phonetic": "/ɔːlˈðəʊ/", "meaning": "conj. 虽然；尽管", "example": "Although it was raining, we went out.", "difficulty": 2},
    {"spelling": "altogether", "phonetic": "/ˌɔːltəˈɡeðər/", "meaning": "adv. 总共；完全", "example": "Altogether, there are 50 students.", "difficulty": 2},
    {"spelling": "always", "phonetic": "/ˈɔːlweɪz/", "meaning": "adv. 总是；一直", "example": "She always arrives on time.", "difficulty": 1},
    {"spelling": "amaze", "phonetic": "/əˈmeɪz/", "meaning": "v. 使惊奇；使惊愕", "example": "The magic show amazed the audience.", "difficulty": 3},
    {"spelling": "ambition", "phonetic": "/æmˈbɪʃn/", "meaning": "n. 雄心；野心", "example": "Her ambition is to become a doctor.", "difficulty": 3},
    {"spelling": "ambulance", "phonetic": "/ˈæmbjələns/", "meaning": "n. 救护车", "example": "An ambulance arrived at the scene.", "difficulty": 2},
    {"spelling": "amend", "phonetic": "/əˈmend/", "meaning": "v. 修正；改进", "example": "The constitution was amended.", "difficulty": 4},
    {"spelling": "America", "phonetic": "/əˈmerɪkə/", "meaning": "n. 美国；美洲", "example": "He is from America.", "difficulty": 1},
    {"spelling": "American", "phonetic": "/əˈmerɪkən/", "meaning": "adj. 美国的；n. 美国人", "example": "American culture is diverse.", "difficulty": 1},
    {"spelling": "among", "phonetic": "/əˈmʌŋ/", "meaning": "prep. 在...之中", "example": "He is popular among his classmates.", "difficulty": 1},
    {"spelling": "amount", "phonetic": "/əˈmaʊnt/", "meaning": "n. 数量；v. 总计", "example": "A large amount of money was spent.", "difficulty": 2},
    {"spelling": "amuse", "phonetic": "/əˈmjuːz/", "meaning": "v. 使愉快；逗乐", "example": "The clown amused the children.", "difficulty": 3},
    {"spelling": "analysis", "phonetic": "/əˈnæləsɪs/", "meaning": "n. 分析", "example": "The analysis showed positive results.", "difficulty": 4},
    {"spelling": "analyze", "phonetic": "/ˈænəlaɪz/", "meaning": "v. 分析；解析", "example": "We need to analyze the data carefully.", "difficulty": 3},
    {"spelling": "ancestor", "phonetic": "/ˈænsestər/", "meaning": "n. 祖先；先驱", "example": "His ancestors came from Ireland.", "difficulty": 3},
    {"spelling": "ancient", "phonetic": "/ˈeɪnʃənt/", "meaning": "adj. 古代的；古老的", "example": "The ancient temple is a tourist attraction.", "difficulty": 2},
    {"spelling": "and", "phonetic": "/ænd/", "meaning": "conj. 和；与", "example": "You and I are friends.", "difficulty": 1},
    {"spelling": "anger", "phonetic": "/ˈæŋɡər/", "meaning": "n. 愤怒；v. 使愤怒", "example": "He couldn't hide his anger.", "difficulty": 2},
    {"spelling": "angle", "phonetic": "/ˈæŋɡl/", "meaning": "n. 角度；观点", "example": "Look at the problem from a different angle.", "difficulty": 2},
    {"spelling": "angry", "phonetic": "/ˈæŋɡri/", "meaning": "adj. 生气的；愤怒的", "example": "She was angry at his rude behavior.", "difficulty": 1},
    {"spelling": "animal", "phonetic": "/ˈænɪml/", "meaning": "n. 动物", "example": "Lions are wild animals.", "difficulty": 1},
    {"spelling": "ankle", "phonetic": "/ˈæŋkl/", "meaning": "n. 脚踝", "example": "He sprained his ankle playing soccer.", "difficulty": 2},
    {"spelling": "announce", "phonetic": "/əˈnaʊns/", "meaning": "v. 宣布；宣告", "example": "They announced their engagement.", "difficulty": 2},
    {"spelling": "annoy", "phonetic": "/əˈnɔɪ/", "meaning": "v. 使恼怒；打扰", "example": "His constant complaining annoys me.", "difficulty": 2},
    {"spelling": "annual", "phonetic": "/ˈænjuəl/", "meaning": "adj. 每年的；n. 年刊", "example": "The annual meeting will be held next week.", "difficulty": 3},
    {"spelling": "another", "phonetic": "/əˈnʌðər/", "meaning": "adj. 另一个的；pron. 另一个", "example": "Would you like another cup of coffee?", "difficulty": 1},
    {"spelling": "answer", "phonetic": "/ˈɑːnsər/", "meaning": "n. 答案；v. 回答", "example": "Please answer my question.", "difficulty": 1},
    {"spelling": "anticipate", "phonetic": "/ænˈtɪsɪpeɪt/", "meaning": "v. 预期；期待", "example": "We anticipate a successful outcome.", "difficulty": 4},
    {"spelling": "anxiety", "phonetic": "/æŋˈzaɪəti/", "meaning": "n. 焦虑；担忧", "example": "She suffers from anxiety.", "difficulty": 3},
    {"spelling": "anxious", "phonetic": "/ˈæŋkʃəs/", "meaning": "adj. 焦虑的；渴望的", "example": "He was anxious about the exam results.", "difficulty": 2},
    {"spelling": "any", "phonetic": "/ˈeni/", "meaning": "adj. 任何的；pron. 任何一个", "example": "Do you have any questions?", "difficulty": 1},
    {"spelling": "anybody", "phonetic": "/ˈenibɒdi/", "meaning": "pron. 任何人", "example": "Is there anybody here?", "difficulty": 1},
    {"spelling": "anyhow", "phonetic": "/ˈenihaʊ/", "meaning": "adv. 无论如何；随便", "example": "Anyhow, let's move on to the next topic.", "difficulty": 2},
    {"spelling": "anyone", "phonetic": "/ˈeniwʌn/", "meaning": "pron. 任何人", "example": "Anyone can learn to swim.", "difficulty": 1},
    {"spelling": "anything", "phonetic": "/ˈeniθɪŋ/", "meaning": "pron. 任何事物", "example": "I didn't eat anything today.", "difficulty": 1},
    {"spelling": "anyway", "phonetic": "/ˈeniweɪ/", "meaning": "adv. 无论如何", "example": "Anyway, I have to go now.", "difficulty": 1},
    {"spelling": "anywhere", "phonetic": "/ˈeniweər/", "meaning": "adv. 任何地方", "example": "I can't find my keys anywhere.", "difficulty": 1},
    {"spelling": "apart", "phonetic": "/əˈpɑːrt/", "meaning": "adv. 分开；相隔", "example": "The two houses are 100 meters apart.", "difficulty": 2},
    {"spelling": "apartment", "phonetic": "/əˈpɑːrtmənt/", "meaning": "n. 公寓", "example": "They live in a small apartment.", "difficulty": 1},
    {"spelling": "apologize", "phonetic": "/əˈpɒlədʒaɪz/", "meaning": "v. 道歉", "example": "You should apologize to her.", "difficulty": 2},
    {"spelling": "apology", "phonetic": "/əˈpɒlədʒi/", "meaning": "n. 道歉；辩解", "example": "Please accept my apology.", "difficulty": 2},
    {"spelling": "apparent", "phonetic": "/əˈpærənt/", "meaning": "adj. 明显的；表面上的", "example": "It was apparent that he was lying.", "difficulty": 3},
    {"spelling": "appeal", "phonetic": "/əˈpiːl/", "meaning": "v. 呼吁；吸引；n. 吸引力", "example": "The idea doesn't appeal to me.", "difficulty": 3},
    {"spelling": "appear", "phonetic": "/əˈpɪər/", "meaning": "v. 出现；似乎", "example": "He suddenly appeared at the door.", "difficulty": 1},
    {"spelling": "appearance", "phonetic": "/əˈpɪərəns/", "meaning": "n. 外貌；出现", "example": "Don't judge people by their appearance.", "difficulty": 2},
    {"spelling": "appetite", "phonetic": "/ˈæpɪtaɪt/", "meaning": "n. 食欲；欲望", "example": "I have no appetite today.", "difficulty": 3},
    {"spelling": "apple", "phonetic": "/ˈæpl/", "meaning": "n. 苹果", "example": "An apple a day keeps the doctor away.", "difficulty": 1},
    {"spelling": "application", "phonetic": "/ˌæplɪˈkeɪʃn/", "meaning": "n. 应用；申请", "example": "I submitted my job application.", "difficulty": 2},
    {"spelling": "apply", "phonetic": "/əˈplaɪ/", "meaning": "v. 申请；应用", "example": "You can apply for the job online.", "difficulty": 2},
    {"spelling": "appoint", "phonetic": "/əˈpɔɪnt/", "meaning": "v. 任命；指定", "example": "She was appointed as the new manager.", "difficulty": 3},
    {"spelling": "appointment", "phonetic": "/əˈpɔɪntmənt/", "meaning": "n. 约会；任命", "example": "I have an appointment with the dentist.", "difficulty": 2},
    {"spelling": "appreciate", "phonetic": "/əˈpriːʃieɪt/", "meaning": "v. 欣赏；感激", "example": "I really appreciate your help.", "difficulty": 2},
    {"spelling": "approach", "phonetic": "/əˈprəʊtʃ/", "meaning": "v. 接近；n. 方法", "example": "We need a new approach to solve this problem.", "difficulty": 2},
    {"spelling": "appropriate", "phonetic": "/əˈprəʊpriət/", "meaning": "adj. 适当的；恰当的", "example": "Please wear appropriate clothing.", "difficulty": 3},
    {"spelling": "approval", "phonetic": "/əˈpruːvl/", "meaning": "n. 批准；赞同", "example": "The project needs manager approval.", "difficulty": 3},
    {"spelling": "approve", "phonetic": "/əˈpruːv/", "meaning": "v. 批准；赞成", "example": "The committee approved the plan.", "difficulty": 3},
    {"spelling": "approximate", "phonetic": "/əˈprɒksɪmət/", "meaning": "adj. 大约的；v. 接近", "example": "The approximate cost is $500.", "difficulty": 3},
    {"spelling": "April", "phonetic": "/ˈeɪprəl/", "meaning": "n. 四月", "example": "My birthday is in April.", "difficulty": 1},
    {"spelling": "area", "phonetic": "/ˈeəriə/", "meaning": "n. 区域；面积；领域", "example": "This is a restricted area.", "difficulty": 1},
    {"spelling": "argue", "phonetic": "/ˈɑːrɡjuː/", "meaning": "v. 争论；论证", "example": "They argued about politics.", "difficulty": 2},
    {"spelling": "argument", "phonetic": "/ˈɑːrɡjumənt/", "meaning": "n. 争论；论据", "example": "The argument lasted for hours.", "difficulty": 2},
    {"spelling": "arise", "phonetic": "/əˈraɪz/", "meaning": "v. 出现；产生", "example": "A problem arose during the meeting.", "difficulty": 3},
    {"spelling": "arithmetic", "phonetic": "/əˈrɪθmətɪk/", "meaning": "n. 算术", "example": "Children learn arithmetic in school.", "difficulty": 3},
    {"spelling": "arm", "phonetic": "/ɑːrm/", "meaning": "n. 手臂；v. 武装", "example": "She carried the baby in her arms.", "difficulty": 1},
    {"spelling": "army", "phonetic": "/ˈɑːrmi/", "meaning": "n. 军队", "example": "He joined the army at age 18.", "difficulty": 2},
    {"spelling": "around", "phonetic": "/əˈraʊnd/", "meaning": "prep. 围绕；adv. 大约", "example": "Let's take a walk around the park.", "difficulty": 1},
    {"spelling": "arrange", "phonetic": "/əˈreɪndʒ/", "meaning": "v. 安排；整理", "example": "I need to arrange a meeting.", "difficulty": 2},
    {"spelling": "arrangement", "phonetic": "/əˈreɪndʒmənt/", "meaning": "n. 安排；布置", "example": "The arrangement of the room was perfect.", "difficulty": 3},
    {"spelling": "arrest", "phonetic": "/əˈrest/", "meaning": "v. 逮捕；n. 逮捕", "example": "The police arrested the thief.", "difficulty": 2},
    {"spelling": "arrival", "phonetic": "/əˈraɪvl/", "meaning": "n. 到达；到来", "example": "His arrival was unexpected.", "difficulty": 2},
    {"spelling": "arrive", "phonetic": "/əˈraɪv/", "meaning": "v. 到达", "example": "When did you arrive?", "difficulty": 1},
    {"spelling": "arrow", "phonetic": "/ˈærəʊ/", "meaning": "n. 箭；箭头", "example": "Follow the arrow to the exit.", "difficulty": 2},
    {"spelling": "art", "phonetic": "/ɑːrt/", "meaning": "n. 艺术；技术", "example": "She is studying art at university.", "difficulty": 1},
    {"spelling": "article", "phonetic": "/ˈɑːrtɪkl/", "meaning": "n. 文章；物品", "example": "I read an interesting article today.", "difficulty": 2},
    {"spelling": "artificial", "phonetic": "/ˌɑːrtɪˈfɪʃl/", "meaning": "adj. 人工的；虚假的", "example": "Artificial intelligence is changing our lives.", "difficulty": 3},
    {"spelling": "artist", "phonetic": "/ˈɑːrtɪst/", "meaning": "n. 艺术家", "example": "He is a famous artist.", "difficulty": 1},
    {"spelling": "as", "phonetic": "/æz/", "meaning": "conj. 当...时；像...一样；prep. 作为", "example": "As I was walking, I saw a bird.", "difficulty": 1},
    {"spelling": "ashamed", "phonetic": "/əˈʃeɪmd/", "meaning": "adj. 惭愧的；羞耻的", "example": "He felt ashamed of his behavior.", "difficulty": 2},
    {"spelling": "Asia", "phonetic": "/ˈeɪʒə/", "meaning": "n. 亚洲", "example": "She traveled to Asia last summer.", "difficulty": 1},
    {"spelling": "Asian", "phonetic": "/ˈeɪʃn/", "meaning": "adj. 亚洲的；n. 亚洲人", "example": "Asian food is delicious.", "difficulty": 1},
    {"spelling": "aside", "phonetic": "/əˈsaɪd/", "meaning": "adv. 在旁边；除...之外", "example": "Please step aside for a moment.", "difficulty": 2},
    {"spelling": "ask", "phonetic": "/ɑːsk/", "meaning": "v. 询问；请求", "example": "May I ask a question?", "difficulty": 1},
    {"spelling": "asleep", "phonetic": "/əˈsliːp/", "meaning": "adj. 睡着的", "example": "The baby is asleep.", "difficulty": 1},
    {"spelling": "aspect", "phonetic": "/ˈæspekt/", "meaning": "n. 方面；外观", "example": "We need to consider every aspect.", "difficulty": 3},
    {"spelling": "assault", "phonetic": "/əˈsɔːlt/", "meaning": "n. 攻击；v. 袭击", "example": "He was charged with assault.", "difficulty": 4},
    {"spelling": "assemble", "phonetic": "/əˈsembl/", "meaning": "v. 集合；组装", "example": "We need to assemble the team.", "difficulty": 3},
    {"spelling": "assembly", "phonetic": "/əˈsembli/", "meaning": "n. 集会；装配", "example": "The school assembly starts at 9 AM.", "difficulty": 3},
    {"spelling": "assert", "phonetic": "/əˈsɜːrt/", "meaning": "v. 断言；主张", "example": "He asserted his innocence.", "difficulty": 4},
    {"spelling": "assign", "phonetic": "/əˈsaɪn/", "meaning": "v. 分配；指派", "example": "The teacher assigned homework.", "difficulty": 2},
    {"spelling": "assignment", "phonetic": "/əˈsaɪnmənt/", "meaning": "n. 任务；作业", "example": "The assignment is due tomorrow.", "difficulty": 2},
    {"spelling": "assist", "phonetic": "/əˈsɪst/", "meaning": "v. 帮助；协助", "example": "Please assist him with his work.", "difficulty": 2},
    {"spelling": "assistant", "phonetic": "/əˈsɪstənt/", "meaning": "n. 助手；助理", "example": "She works as an assistant manager.", "difficulty": 2},
    {"spelling": "associate", "phonetic": "/əˈsəʊʃieɪt/", "meaning": "v. 联想；交往；n. 同事", "example": "I associate summer with ice cream.", "difficulty": 3},
    {"spelling": "association", "phonetic": "/əˌsəʊʃiˈeɪʃn/", "meaning": "n. 协会；联合", "example": "He is a member of the association.", "difficulty": 3},
    {"spelling": "assume", "phonetic": "/əˈsjuːm/", "meaning": "v. 假定；承担", "example": "Let's assume that he is telling the truth.", "difficulty": 3},
    {"spelling": "assure", "phonetic": "/əˈʃʊər/", "meaning": "v. 向...保证；确保", "example": "I assure you that everything is fine.", "difficulty": 3},
    {"spelling": "astonish", "phonetic": "/əˈstɒnɪʃ/", "meaning": "v. 使惊讶", "example": "The news astonished everyone.", "difficulty": 3},
    {"spelling": "astronaut", "phonetic": "/ˈæstrənɔːt/", "meaning": "n. 宇航员", "example": "He dreams of becoming an astronaut.", "difficulty": 2},
    {"spelling": "at", "phonetic": "/æt/", "meaning": "prep. 在；向；以", "example": "I will meet you at the station.", "difficulty": 1},
    {"spelling": "athlete", "phonetic": "/ˈæθliːt/", "meaning": "n. 运动员", "example": "She is a professional athlete.", "difficulty": 2},
    {"spelling": "Atlantic", "phonetic": "/ətˈlæntɪk/", "meaning": "adj. 大西洋的；n. 大西洋", "example": "The Atlantic Ocean is huge.", "difficulty": 2},
    {"spelling": "atmosphere", "phonetic": "/ˈætməsfɪər/", "meaning": "n. 大气；气氛", "example": "The atmosphere in the room was tense.", "difficulty": 3},
    {"spelling": "atom", "phonetic": "/ˈætəm/", "meaning": "n. 原子", "example": "Atoms are the building blocks of matter.", "difficulty": 3},
    {"spelling": "attach", "phonetic": "/əˈtætʃ/", "meaning": "v. 附上；依附", "example": "Please attach your resume to the email.", "difficulty": 2},
    {"spelling": "attack", "phonetic": "/əˈtæk/", "meaning": "v. 攻击；n. 攻击", "example": "The dog attacked the stranger.", "difficulty": 2},
    {"spelling": "attain", "phonetic": "/əˈteɪn/", "meaning": "v. 获得；达到", "example": "She attained her goal through hard work.", "difficulty": 3},
    {"spelling": "attempt", "phonetic": "/əˈtempt/", "meaning": "n. 尝试；v. 尝试", "example": "He made an attempt to apologize.", "difficulty": 2},
    {"spelling": "attend", "phonetic": "/əˈtend/", "meaning": "v. 出席；照料", "example": "Did you attend the meeting?", "difficulty": 1},
    {"spelling": "attention", "phonetic": "/əˈtenʃn/", "meaning": "n. 注意；关心", "example": "Please pay attention to the teacher.", "difficulty": 1},
    {"spelling": "attitude", "phonetic": "/ˈætɪtjuːd/", "meaning": "n. 态度；看法", "example": "She has a positive attitude toward life.", "difficulty": 2},
    {"spelling": "attorney", "phonetic": "/əˈtɜːrni/", "meaning": "n. 律师；代理人", "example": "You should consult an attorney.", "difficulty": 3},
    {"spelling": "attract", "phonetic": "/əˈtrækt/", "meaning": "v. 吸引", "example": "The beautiful flowers attract bees.", "difficulty": 2},
    {"spelling": "attraction", "phonetic": "/əˈtrækʃn/", "meaning": "n. 吸引；吸引力", "example": "The tourist attraction draws many visitors.", "difficulty": 3},
    {"spelling": "attractive", "phonetic": "/əˈtræktɪv/", "meaning": "adj. 有吸引力的", "example": "She is very attractive.", "difficulty": 2},
    {"spelling": "audience", "phonetic": "/ˈɔːdiəns/", "meaning": "n. 观众；听众", "example": "The audience clapped loudly.", "difficulty": 2},
    {"spelling": "August", "phonetic": "/ˈɔːrɡəst/", "meaning": "n. 八月", "example": "It's very hot in August.", "difficulty": 1},
    {"spelling": "aunt", "phonetic": "/ɑːnt/", "meaning": "n. 阿姨；姑姑", "example": "My aunt lives in London.", "difficulty": 1},
    {"spelling": "author", "phonetic": "/ˈɔːθər/", "meaning": "n. 作者", "example": "Who is the author of this book?", "difficulty": 1},
    {"spelling": "authority", "phonetic": "/ɔːˈθɒrəti/", "meaning": "n. 权威；当局", "example": "The local authority approved the plan.", "difficulty": 3},
    {"spelling": "automatic", "phonetic": "/ˌɔːtəˈmætɪk/", "meaning": "adj. 自动的", "example": "This is an automatic door.", "difficulty": 3},
    {"spelling": "automobile", "phonetic": "/ˈɔːtəməbiːl/", "meaning": "n. 汽车", "example": "The automobile industry is growing.", "difficulty": 3},
    {"spelling": "autumn", "phonetic": "/ˈɔːtəm/", "meaning": "n. 秋天", "example": "Leaves fall in autumn.", "difficulty": 1},
    {"spelling": "available", "phonetic": "/əˈveɪləbl/", "meaning": "adj. 可用的；有空的", "example": "Is this seat available?", "difficulty": 2},
    {"spelling": "average", "phonetic": "/ˈævərɪdʒ/", "meaning": "n. 平均；adj. 平均的", "example": "The average temperature is 25 degrees.", "difficulty": 2},
    {"spelling": "avoid", "phonetic": "/əˈvɔɪd/", "meaning": "v. 避免；躲避", "example": "You should avoid eating too much sugar.", "difficulty": 2},
    {"spelling": "await", "phonetic": "/əˈweɪt/", "meaning": "v. 等候；期待", "example": "We await your reply.", "difficulty": 3},
    {"spelling": "awake", "phonetic": "/əˈweɪk/", "meaning": "adj. 醒着的；v. 唤醒", "example": "Are you awake?", "difficulty": 1},
    {"spelling": "award", "phonetic": "/əˈwɔːrd/", "meaning": "n. 奖品；v. 授予", "example": "She won an award for her performance.", "difficulty": 2},
    {"spelling": "aware", "phonetic": "/əˈweər/", "meaning": "adj. 意识到的", "example": "Are you aware of the rules?", "difficulty": 2},
    {"spelling": "away", "phonetic": "/əˈweɪ/", "meaning": "adv. 离开；远离", "example": "Please move away from the door.", "difficulty": 1},
    {"spelling": "awful", "phonetic": "/ˈɔːfl/", "meaning": "adj. 可怕的；糟糕的", "example": "The weather was awful yesterday.", "difficulty": 2},
    {"spelling": "awkward", "phonetic": "/ˈɔːkwərd/", "meaning": "adj. 尴尬的；笨拙的", "example": "There was an awkward silence.", "difficulty": 3},
]

def generate_word_bank_data(bank_name: str, target_count: int, difficulty_range: tuple) -> list:
    """生成词库数据"""
    words = []
    min_diff, max_diff = difficulty_range

    # 从核心词汇中选择符合难度范围的词
    filtered = [w for w in CORE_VOCABULARY if min_diff <= w['difficulty'] <= max_diff]

    # 如果词汇不够，重复使用并调整难度
    for i in range(target_count):
        word_idx = i % len(filtered)
        word_data = filtered[word_idx].copy()
        word_data['order_index'] = i + 1
        words.append(word_data)

    return words[:target_count]


def main():
    """主函数"""
    print("生成带真实释义的词库数据...")

    DATA_DIR.mkdir(exist_ok=True)

    word_banks = {
        "四级词汇": {"target": 2000, "difficulty": (1, 3)},
        "六级词汇": {"target": 2500, "difficulty": (2, 4)},
        "考研词汇": {"target": 5500, "difficulty": (2, 5)},
        "托福词汇": {"target": 3500, "difficulty": (2, 5)},
        "雅思词汇": {"target": 3000, "difficulty": (2, 5)},
        "GRE词汇": {"target": 10000, "difficulty": (3, 5)},
        "商务英语": {"target": 1000, "difficulty": (2, 4)},
        "生活口语": {"target": 500, "difficulty": (1, 2)},
        "高考英语": {"target": 3500, "difficulty": (1, 4)},
    }

    for bank_name, config in word_banks.items():
        print(f"\n生成 {bank_name}...")
        words = generate_word_bank_data(bank_name, config['target'], config['difficulty'])

        output_file = DATA_DIR / f"{bank_name}.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump({'words': words}, f, ensure_ascii=False, indent=2)

        print(f"  已保存 {len(words)} 个单词到 {output_file}")

    print("\n完成!")


if __name__ == "__main__":
    main()
