"""Pronunciation service module - REQ-WORD-003"""

from enum import Enum
from typing import Optional
from pathlib import Path
import hashlib
import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

# Cache directory for audio files
CACHE_DIR = Path(__file__).parent.parent.parent / "media" / "audio"


class Accent(str, Enum):
    """Accent type for pronunciation"""
    US = "us"
    UK = "uk"


class PronunciationService:
    """
    Pronunciation service - handles fetching and caching word pronunciations.

    Priority: Local cache -> Youdao API -> Baidu API -> Failure

    REQ-WORD-003: 发音播放功能
    """

    def __init__(self):
        self.cache_dir = CACHE_DIR
        self._ensure_cache_dirs()

        # API configuration (optional - for production)
        self.youdao_app_key = getattr(settings, 'youdao_app_key', None)
        self.youdao_app_secret = getattr(settings, 'youdao_app_secret', None)
        self.baidu_app_id = getattr(settings, 'baidu_app_id', None)
        self.baidu_secret_key = getattr(settings, 'baidu_secret_key', None)

    def _ensure_cache_dirs(self):
        """Ensure cache directories exist"""
        for accent in [Accent.US, Accent.UK]:
            (self.cache_dir / accent.value).mkdir(parents=True, exist_ok=True)

    def _get_cache_path(self, word: str, accent: Accent) -> Path:
        """Get the cache file path for a word"""
        # Normalize word for filename
        safe_word = word.lower().strip()
        return self.cache_dir / accent.value / f"{safe_word}.mp3"

    def _is_cached(self, word: str, accent: Accent) -> bool:
        """Check if audio is already cached"""
        cache_path = self._get_cache_path(word, accent)
        return cache_path.exists() and cache_path.stat().st_size > 0

    def _get_cached_url(self, word: str, accent: Accent) -> Optional[str]:
        """Get cached audio URL if exists"""
        if self._is_cached(word, accent):
            cache_path = self._get_cache_path(word, accent)
            # Return relative URL path for frontend
            return f"/media/audio/{accent.value}/{word.lower()}.mp3"
        return None

    async def _fetch_from_youdao(self, word: str, accent: Accent) -> Optional[bytes]:
        """
        Fetch pronunciation from Youdao API.

        Note: Requires YOUDAO_APP_KEY and YOUDAO_APP_SECRET in .env
        Returns audio bytes if successful, None otherwise.
        """
        if not self.youdao_app_key or not self.youdao_app_secret:
            logger.debug("Youdao API not configured")
            return None

        try:
            # Youdao TTS API
            # See: https://ai.youdao.com/DOCSIRMA/html/trans/tts/api/ttsapi/index.html
            url = "https://openapi.youdao.com/ttsapi"

            # Generate sign
            import time
            curtime = str(int(time.time()))
            input_str = word
            if len(word) > 20:
                # For long words, use truncated input
                input_str = word[:10] + str(len(word)) + word[-10:]

            sign_str = self.youdao_app_key + input_str + curtime + self.youdao_app_secret
            sign = hashlib.sha256(sign_str.encode()).hexdigest()

            params = {
                "q": word,
                "langType": "en",
                "appKey": self.youdao_app_key,
                "salt": curtime,
                "curtime": curtime,
                "sign": sign,
                "signType": "v3",
                "voice": "1" if accent == Accent.US else "2",  # 1=美音, 2=英音
            }

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, params=params)

                if response.status_code == 200:
                    content_type = response.headers.get("content-type", "")
                    if "audio" in content_type:
                        return response.content
                    else:
                        logger.warning(f"Youdao returned non-audio: {content_type}")
                else:
                    logger.warning(f"Youdao API error: {response.status_code}")

        except Exception as e:
            logger.error(f"Youdao API fetch error: {e}")

        return None

    async def _fetch_from_baidu(self, word: str, accent: Accent) -> Optional[bytes]:
        """
        Fetch pronunciation from Baidu Translation API (fallback).

        Note: Requires BAIDU_APP_ID and BAIDU_SECRET_KEY in .env
        Returns audio bytes if successful, None otherwise.
        """
        if not self.baidu_app_id or not self.baidu_secret_key:
            logger.debug("Baidu API not configured")
            return None

        try:
            # Baidu TTS API
            # See: https://fanyi-api.baidu.com/doc/21
            url = "https://fanyi-api.baidu.com/api/trans/vip/tts"

            import random
            salt = str(random.randint(32768, 65536))

            sign_str = self.baidu_app_id + word + salt + self.baidu_secret_key
            sign = hashlib.md5(sign_str.encode()).hexdigest()

            params = {
                "q": word,
                "from": "en",
                "to": "en",
                "appid": self.baidu_app_id,
                "salt": salt,
                "sign": sign,
                "voice": "1" if accent == Accent.US else "2",  # 1=美音, 2=英音
            }

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, params=params)

                if response.status_code == 200:
                    content_type = response.headers.get("content-type", "")
                    if "audio" in content_type:
                        return response.content
                    else:
                        logger.warning(f"Baidu returned non-audio: {content_type}")
                else:
                    logger.warning(f"Baidu API error: {response.status_code}")

        except Exception as e:
            logger.error(f"Baidu API fetch error: {e}")

        return None

    async def _cache_audio(self, word: str, accent: Accent, audio_data: bytes) -> str:
        """Save audio to cache and return URL"""
        cache_path = self._get_cache_path(word, accent)
        cache_path.write_bytes(audio_data)
        logger.info(f"Cached audio for '{word}' ({accent.value})")
        return f"/media/audio/{accent.value}/{word.lower()}.mp3"

    async def get_audio(self, word: str, accent: Accent = Accent.US) -> Optional[str]:
        """
        Get pronunciation audio URL for a word.

        Priority:
        1. Local cache
        2. Youdao API
        3. Baidu API (fallback)
        4. None (not configured or failed)

        Args:
            word: The word to get pronunciation for
            accent: US or UK accent

        Returns:
            Audio URL string if available, None otherwise

        REQ-WORD-003: 发音播放功能
        """
        word = word.lower().strip()

        # 1. Check cache first
        cached_url = self._get_cached_url(word, accent)
        if cached_url:
            return cached_url

        # 2. Try Youdao API
        audio_data = await self._fetch_from_youdao(word, accent)
        if audio_data:
            return await self._cache_audio(word, accent, audio_data)

        # 3. Try Baidu API as fallback
        audio_data = await self._fetch_from_baidu(word, accent)
        if audio_data:
            return await self._cache_audio(word, accent, audio_data)

        # 4. Not available
        logger.warning(f"No pronunciation available for '{word}' ({accent.value})")
        return None

    def is_configured(self) -> bool:
        """Check if any pronunciation API is configured"""
        return bool(
            self.youdao_app_key and self.youdao_app_secret
        ) or bool(
            self.baidu_app_id and self.baidu_secret_key
        )


# Global service instance
pronunciation_service = PronunciationService()
