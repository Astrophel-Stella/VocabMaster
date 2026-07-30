"""
词库数据导入脚本 - REQ-WB-004

支持批量导入 CSV/JSON 格式词汇数据，自动去重和质量检查。

Usage:
    python -m scripts.import_word_banks <data_file> [--format csv|json] [--bank-name NAME]
"""

import argparse
import json
import csv
import logging
import sys
from pathlib import Path
from typing import Optional
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.database import SessionLocal, init_db
from app.models.word import WordBank, Word

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# 词库元数据配置
WORD_BANK_CONFIG = {
    "四级词汇": {"description": "大学英语四级核心词汇", "target_count": 2000},
    "六级词汇": {"description": "大学英语六级核心词汇", "target_count": 2500},
    "考研词汇": {"description": "考研英语核心词汇", "target_count": 5500},
    "托福词汇": {"description": "托福考试核心词汇", "target_count": 3500},
    "雅思词汇": {"description": "雅思考试核心词汇", "target_count": 3000},
    "GRE词汇": {"description": "GRE考试核心词汇", "target_count": 10000},
    "商务英语": {"description": "商务英语常用词汇", "target_count": 1000},
    "生活口语": {"description": "日常生活口语词汇", "target_count": 500},
    "高考英语": {"description": "高考英语核心词汇", "target_count": 3500},
}


class DataImportError(Exception):
    """数据导入错误"""
    pass


def validate_word_data(word_data: dict, row_num: int) -> list[str]:
    """
    验证单词数据质量，返回错误列表

    Args:
        word_data: 单词数据字典
        row_num: 行号（用于错误提示）

    Returns:
        错误信息列表，空列表表示验证通过
    """
    errors = []

    # 必填字段检查
    if not word_data.get('spelling'):
        errors.append(f"Row {row_num}: spelling is required")
    elif not isinstance(word_data['spelling'], str) or not word_data['spelling'].strip():
        errors.append(f"Row {row_num}: spelling must be a non-empty string")

    if not word_data.get('meaning'):
        errors.append(f"Row {row_num}: meaning is required")
    elif not isinstance(word_data['meaning'], str) or not word_data['meaning'].strip():
        errors.append(f"Row {row_num}: meaning must be a non-empty string")

    # 字段长度检查
    if word_data.get('spelling') and len(word_data['spelling']) > 100:
        errors.append(f"Row {row_num}: spelling exceeds 100 characters")

    if word_data.get('meaning') and len(word_data['meaning']) > 1000:
        errors.append(f"Row {row_num}: meaning exceeds 1000 characters")

    if word_data.get('example_sentence') and len(word_data['example_sentence']) > 500:
        errors.append(f"Row {row_num}: example_sentence exceeds 500 characters")

    if word_data.get('phonetic') and len(word_data['phonetic']) > 100:
        errors.append(f"Row {row_num}: phonetic exceeds 100 characters")

    # 难度等级范围检查
    if word_data.get('difficulty_level'):
        try:
            level = int(word_data['difficulty_level'])
            if level < 1 or level > 5:
                errors.append(f"Row {row_num}: difficulty_level must be between 1 and 5")
        except (ValueError, TypeError):
            errors.append(f"Row {row_num}: difficulty_level must be an integer")

    # 词频范围检查
    if word_data.get('frequency'):
        try:
            freq = int(word_data['frequency'])
            if freq < 0:
                errors.append(f"Row {row_num}: frequency must be non-negative")
        except (ValueError, TypeError):
            errors.append(f"Row {row_num}: frequency must be an integer")

    # JSON字段格式检查
    for json_field in ['synonyms', 'antonyms']:
        value = word_data.get(json_field)
        if value:
            if isinstance(value, str):
                try:
                    json.loads(value)
                except json.JSONDecodeError:
                    errors.append(f"Row {row_num}: {json_field} is not valid JSON")
            elif not isinstance(value, (list, dict)):
                errors.append(f"Row {row_num}: {json_field} must be JSON string or list/dict")

    return errors


def parse_csv_file(file_path: Path) -> list[dict]:
    """解析CSV文件"""
    words = []
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row_num, row in enumerate(reader, start=2):  # start=2 because header is row 1
            words.append({k: v for k, v in row.items() if v})  # Skip empty values
    return words


def parse_json_file(file_path: Path) -> list[dict]:
    """解析JSON文件"""
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 支持两种JSON格式：
    # 1. {"words": [...]}
    # 2. [...]
    if isinstance(data, dict) and 'words' in data:
        return data['words']
    elif isinstance(data, list):
        return data
    else:
        raise DataImportError(f"Invalid JSON format. Expected list or {{'words': [...]}}")


def import_words(
    db: Session,
    bank_name: str,
    words_data: list[dict],
    skip_duplicates: bool = True
) -> dict:
    """
    导入单词到词库

    Args:
        db: 数据库会话
        bank_name: 词库名称
        words_data: 单词数据列表
        skip_duplicates: 是否跳过重复单词

    Returns:
        导入结果统计
    """
    stats = {
        'total': len(words_data),
        'imported': 0,
        'skipped': 0,
        'errors': [],
        'duplicates': 0
    }

    # 获取或创建词库
    word_bank = db.query(WordBank).filter(WordBank.name == bank_name).first()
    if not word_bank:
        config = WORD_BANK_CONFIG.get(bank_name, {})
        word_bank = WordBank(
            name=bank_name,
            description=config.get('description', f'{bank_name}词汇'),
            total_words=0
        )
        db.add(word_bank)
        db.flush()
        logger.info(f"Created new word bank: {bank_name}")

    # 获取词库中已存在的单词（用于去重）
    existing_spellings = set(
        w.spelling.lower() for w in db.query(Word).filter(
            Word.word_bank_id == word_bank.id
        ).all()
    )

    # 导入单词
    order_index = db.query(Word).filter(
        Word.word_bank_id == word_bank.id
    ).count() + 1

    for idx, word_data in enumerate(words_data, start=1):
        row_num = idx + 1  # 用于错误提示

        # 数据验证
        errors = validate_word_data(word_data, row_num)
        if errors:
            stats['errors'].extend(errors)
            stats['skipped'] += 1
            continue

        spelling = word_data['spelling'].strip()

        # 去重检查
        if skip_duplicates and spelling.lower() in existing_spellings:
            stats['duplicates'] += 1
            stats['skipped'] += 1
            continue

        # 准备JSON字段
        synonyms = word_data.get('synonyms')
        if synonyms and isinstance(synonyms, (list, dict)):
            synonyms = json.dumps(synonyms, ensure_ascii=False)

        antonyms = word_data.get('antonyms')
        if antonyms and isinstance(antonyms, (list, dict)):
            antonyms = json.dumps(antonyms, ensure_ascii=False)

        # 创建单词记录
        word = Word(
            word_bank_id=word_bank.id,
            spelling=spelling,
            phonetic=word_data.get('phonetic', ''),
            pronunciation_url=word_data.get('pronunciation_url', ''),
            meaning=word_data['meaning'].strip(),
            example_sentence=word_data.get('example_sentence', ''),
            order_index=order_index,
            word_root=word_data.get('word_root', ''),
            difficulty_level=int(word_data.get('difficulty_level', 1)),
            frequency=int(word_data.get('frequency', 0)) if word_data.get('frequency') else None,
            synonyms=synonyms,
            antonyms=antonyms,
        )

        db.add(word)
        existing_spellings.add(spelling.lower())
        order_index += 1
        stats['imported'] += 1

        # 批量提交（每1000条）
        if stats['imported'] % 1000 == 0:
            db.commit()
            logger.info(f"Imported {stats['imported']} words...")

    # 更新词库总词数
    word_bank.total_words = db.query(Word).filter(
        Word.word_bank_id == word_bank.id
    ).count()

    db.commit()

    return stats


def import_from_file(
    file_path: Path,
    bank_name: Optional[str] = None,
    format: Optional[str] = None
) -> dict:
    """
    从文件导入词库数据

    Args:
        file_path: 数据文件路径
        bank_name: 词库名称（如未指定，从文件名推断）
        format: 文件格式（csv/json，如未指定，从扩展名推断）

    Returns:
        导入结果统计
    """
    # 推断文件格式
    if not format:
        ext = file_path.suffix.lower()
        if ext == '.csv':
            format = 'csv'
        elif ext == '.json':
            format = 'json'
        else:
            raise DataImportError(f"Unsupported file format: {ext}")

    # 推断词库名称
    if not bank_name:
        bank_name = file_path.stem
        # 尝试匹配已知词库
        for known_name in WORD_BANK_CONFIG.keys():
            if known_name in bank_name or bank_name in known_name:
                bank_name = known_name
                break

    logger.info(f"Importing {format.upper()} file: {file_path}")
    logger.info(f"Target word bank: {bank_name}")

    # 解析文件
    if format == 'csv':
        words_data = parse_csv_file(file_path)
    elif format == 'json':
        words_data = parse_json_file(file_path)
    else:
        raise DataImportError(f"Unsupported format: {format}")

    logger.info(f"Parsed {len(words_data)} words from file")

    # 导入到数据库
    db = SessionLocal()
    try:
        stats = import_words(db, bank_name, words_data)
        return stats
    finally:
        db.close()


def main():
    """命令行入口"""
    parser = argparse.ArgumentParser(description='Import word bank data')
    parser.add_argument('file', type=str, help='Data file path (CSV or JSON)')
    parser.add_argument('--format', choices=['csv', 'json'], help='File format (auto-detect from extension)')
    parser.add_argument('--bank-name', type=str, help='Word bank name (auto-detect from filename)')
    parser.add_argument('--init-db', action='store_true', help='Initialize database before import')

    args = parser.parse_args()

    file_path = Path(args.file)
    if not file_path.exists():
        print(f"❌ File not found: {file_path}")
        sys.exit(1)

    # 初始化数据库
    if args.init_db:
        logger.info("Initializing database...")
        init_db()

    # 导入数据
    try:
        stats = import_from_file(
            file_path=file_path,
            bank_name=args.bank_name,
            format=args.format
        )

        # 打印结果
        print("\n" + "="*60)
        print("📊 Import Results")
        print("="*60)
        print(f"Total words in file: {stats['total']}")
        print(f"✅ Imported: {stats['imported']}")
        print(f"⏭️  Skipped (duplicates): {stats['duplicates']}")
        print(f"⏭️  Skipped (validation errors): {stats['skipped'] - stats['duplicates']}")

        if stats['errors']:
            print(f"\n⚠️  Validation Errors ({len(stats['errors'])}):")
            for error in stats['errors'][:10]:  # 只显示前10个错误
                print(f"  - {error}")
            if len(stats['errors']) > 10:
                print(f"  ... and {len(stats['errors']) - 10} more errors")

        print("="*60)

    except DataImportError as e:
        print(f"❌ Import failed: {e}")
        sys.exit(1)
    except Exception as e:
        logger.exception("Unexpected error during import")
        print(f"❌ Import failed: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
