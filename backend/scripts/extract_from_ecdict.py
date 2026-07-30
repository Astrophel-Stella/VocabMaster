"""
从 ECDICT 开源词典数据库提取词库数据

ECDICT 项目: https://github.com/skywind3000/ECDICT
数据格式: CSV，UTF-8 编码

字段说明:
- word: 单词名称
- phonetic: 音标
- definition: 英文释义
- translation: 中文释义
- pos: 词性
- tag: 考试标签（cet4/四级, cet6/六级, ielts/雅思, toefl/托福, gre/GRE, gmat/GMAT）
- collins: 柯林斯星级
- bnc: 英国国家语料库词频
- frq: 当代语料库词频
"""

import csv
import json
import requests
import gzip
import os
from pathlib import Path
from typing import Dict, List, Optional

# ECDICT 数据 URL (使用 mini 版本，约 10MB)
ECDICT_URL = "https://github.com/skywind3000/ECDICT/releases/download/1.0.28/ecdict.mini.csv.gz"

# 词库标签映射
TAG_MAPPING = {
    "cet4": ("四级词汇", 2000),
    "cet6": ("六级词汇", 2500),
    "kaoyan": ("考研词汇", 5500),  # ECDICT 没有 kaoyan 标签，需要从其他词库补充
    "toefl": ("托福词汇", 3500),
    "ielts": ("雅思词汇", 3000),
    "gre": ("GRE词汇", 10000),
    "bec": ("商务英语", 1000),  # BEC 商务英语
    "gmat": ("商务英语", 1000),  # GMAT 也算商务类
}

# 数据目录
DATA_DIR = Path(__file__).parent.parent / "data"


def download_ecdict_data() -> Path:
    """下载 ECDICT 数据文件"""
    print("Downloading ECDICT data...")

    # 创建临时目录
    temp_dir = Path(__file__).parent.parent / "temp"
    temp_dir.mkdir(exist_ok=True)

    gz_file = temp_dir / "ecdict.mini.csv.gz"
    csv_file = temp_dir / "ecdict.mini.csv"

    # 下载 gzip 文件
    if not gz_file.exists():
        response = requests.get(ECDICT_URL, stream=True)
        with open(gz_file, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        print(f"Downloaded {gz_file}")

    # 解压
    if not csv_file.exists():
        with gzip.open(gz_file, 'rb') as f_in:
            with open(csv_file, 'wb') as f_out:
                f_out.write(f_in.read())
        print(f"Extracted {csv_file}")

    return csv_file


def load_ecdict_data(csv_file: Path) -> List[Dict]:
    """加载 ECDICT 数据"""
    print(f"Loading data from {csv_file}...")

    words = []
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            word_data = {
                'word': row.get('word', '').strip(),
                'phonetic': row.get('phonetic', '').strip(),
                'definition': row.get('definition', '').strip(),
                'translation': row.get('translation', '').strip(),
                'pos': row.get('pos', '').strip(),
                'tag': row.get('tag', '').strip(),
                'collins': row.get('collins', '').strip(),
                'bnc': row.get('bnc', '').strip(),
                'frq': row.get('frq', '').strip(),
            }
            if word_data['word'] and word_data['translation']:
                words.append(word_data)

    print(f"Loaded {len(words)} words")
    return words


def filter_words_by_tag(words: List[Dict], tag: str) -> List[Dict]:
    """根据标签筛选词汇"""
    filtered = []
    for w in words:
        word_tags = w.get('tag', '').lower()
        if tag.lower() in word_tags:
            filtered.append(w)
    return filtered


def filter_words_by_collins(words: List[Dict], min_collins: int = 1) -> List[Dict]:
    """根据柯林斯星级筛选词汇"""
    filtered = []
    for w in words:
        collins = w.get('collins', '0')
        try:
            if int(collins) >= min_collins:
                filtered.append(w)
        except ValueError:
            pass
    return filtered


def create_word_data(ecdict_word: Dict, order_index: int, difficulty_level: int = 2) -> Dict:
    """从 ECDICT 数据创建词库数据格式"""
    # 解析词性
    pos = ecdict_word.get('pos', '')

    # 清理释义（去除多余的空白和换行）
    translation = ecdict_word.get('translation', '').strip()
    # 如果释义中包含换行，取第一个
    if '\n' in translation:
        translation = translation.split('\n')[0].strip()

    # 构建释义格式：词性 + 中文释义
    meaning = f"{pos} {translation}" if pos else translation

    # 音标
    phonetic = ecdict_word.get('phonetic', '')
    if phonetic and not phonetic.startswith('/'):
        phonetic = f"/{phonetic}/"

    return {
        'spelling': ecdict_word.get('word', ''),
        'phonetic': phonetic,
        'meaning': meaning,
        'example_sentence': '',  # ECDICT 基础版不包含例句
        'difficulty_level': difficulty_level,
        'order_index': order_index,
    }


def generate_word_bank(words: List[Dict], bank_name: str, target_count: int,
                        tag_filter: Optional[str] = None,
                        min_collins: int = 1,
                        difficulty_range: tuple = (2, 4)) -> List[Dict]:
    """生成词库数据"""
    print(f"\nGenerating {bank_name} (target: {target_count})...")

    # 筛选词汇
    if tag_filter:
        filtered = filter_words_by_tag(words, tag_filter)
        print(f"  Words with tag '{tag_filter}': {len(filtered)}")
    else:
        filtered = words

    # 按柯林斯星级筛选
    filtered = filter_words_by_collins(filtered, min_collins)
    print(f"  Words after Collins filter (>= {min_collins}): {len(filtered)}")

    # 按词频排序（bnc 或 frq）
    filtered.sort(key=lambda w: int(w.get('frq', '999999') or '999999'))

    # 取前 target_count 个
    selected = filtered[:target_count]

    # 创建词库数据
    bank_data = []
    min_diff, max_diff = difficulty_range
    for i, w in enumerate(selected, start=1):
        # 根据词频计算难度等级
        difficulty = min_diff + (max_diff - min_diff) * i // len(selected)

        word_data = create_word_data(w, i, difficulty)
        bank_data.append(word_data)

    print(f"  Generated {len(bank_data)} words for {bank_name}")

    return bank_data


def save_word_bank(bank_name: str, words: List[Dict]):
    """保存词库数据到 JSON 文件"""
    output_file = DATA_DIR / f"{bank_name}.json"
    DATA_DIR.mkdir(exist_ok=True)

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({'words': words}, f, ensure_ascii=False, indent=2)

    print(f"  Saved to {output_file}")


def main():
    """主函数"""
    print("=" * 60)
    print("ECDICT 词库数据提取工具")
    print("=" * 60)

    # 下载数据
    csv_file = download_ecdict_data()

    # 加载数据
    words = load_ecdict_data(csv_file)

    # 生成各词库数据
    word_banks = {
        "四级词汇": {"tag": "cet4", "target": 2000, "min_collins": 1, "difficulty": (1, 3)},
        "六级词汇": {"tag": "cet6", "target": 2500, "min_collins": 1, "difficulty": (2, 4)},
        "考研词汇": {"tag": None, "target": 5500, "min_collins": 2, "difficulty": (2, 5)},  # 从高词频词汇中选
        "托福词汇": {"tag": "toefl", "target": 3500, "min_collins": 1, "difficulty": (2, 5)},
        "雅思词汇": {"tag": "ielts", "target": 3000, "min_collins": 1, "difficulty": (2, 5)},
        "GRE词汇": {"tag": "gre", "target": 10000, "min_collins": 1, "difficulty": (3, 5)},
        "商务英语": {"tag": "bec", "target": 1000, "min_collins": 2, "difficulty": (2, 4)},
        "生活口语": {"tag": None, "target": 500, "min_collins": 3, "difficulty": (1, 2)},  # 高频常用词
        "高考英语": {"tag": None, "target": 3500, "min_collins": 1, "difficulty": (1, 4)},  # 基础词汇
    }

    for bank_name, config in word_banks.items():
        bank_words = generate_word_bank(
            words,
            bank_name,
            config['target'],
            tag_filter=config.get('tag'),
            min_collins=config.get('min_collins', 1),
            difficulty_range=config.get('difficulty', (2, 4))
        )

        if bank_words:
            save_word_bank(bank_name, bank_words)
        else:
            print(f"  Warning: No words generated for {bank_name}")

    print("\n" + "=" * 60)
    print("Done!")
    print("=" * 60)


if __name__ == "__main__":
    main()
