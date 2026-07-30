"""Word and WordBank models"""

from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class WordBank(Base):
    """Word bank table (高考英语, 考研英语, etc.)"""

    __tablename__ = "word_banks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)  # e.g., "高考英语"
    description = Column(Text)
    total_words = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    words = relationship("Word", back_populates="word_bank")


class Word(Base):
    """Word table"""

    __tablename__ = "words"

    id = Column(Integer, primary_key=True, index=True)
    word_bank_id = Column(Integer, ForeignKey("word_banks.id"), nullable=False)
    spelling = Column(String(100), nullable=False)  # 单词拼写
    phonetic = Column(String(100))  # 音标
    pronunciation_url = Column(String(255))  # 发音音频 URL
    meaning = Column(Text, nullable=False)  # 中文释义
    example_sentence = Column(Text)  # 例句
    order_index = Column(Integer, default=0)  # 排序索引
    # REQ-WB-004: 扩展字段
    word_root = Column(String(255))  # 词根词缀
    difficulty_level = Column(Integer, default=1)  # 难度等级 1-5
    frequency = Column(Integer)  # 词频
    synonyms = Column(Text)  # 同义词（JSON格式）
    antonyms = Column(Text)  # 反义词（JSON格式）

    # Relationship
    word_bank = relationship("WordBank", back_populates="words")
    progress = relationship("LearningProgress", back_populates="word")
