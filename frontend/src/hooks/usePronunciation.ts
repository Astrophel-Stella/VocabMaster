/**
 * usePronunciation Hook - REQ-WORD-003 发音播放功能
 *
 * 管理单词发音的播放状态:
 * - idle: 空闲状态
 * - loading: 加载中
 * - playing: 播放中
 * - error: 错误状态
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { getPronunciation, type Accent } from '../lib/api';
import { useUserStore } from '../stores/userStore';

export type PronunciationStatus = 'idle' | 'loading' | 'playing' | 'error';

interface UsePronunciationReturn {
  status: PronunciationStatus;
  error: string | null;
  play: (wordId: number, accent?: Accent) => Promise<void>;
  stop: () => void;
  currentWordId: number | null;
  currentAccent: Accent;
}

export function usePronunciation(): UsePronunciationReturn {
  const [status, setStatus] = useState<PronunciationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [currentWordId, setCurrentWordId] = useState<number | null>(null);
  const [currentAccent, setCurrentAccent] = useState<Accent>('us');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentBlobUrlRef = useRef<string | null>(null);

  const { token } = useUserStore();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
        currentBlobUrlRef.current = null;
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (currentBlobUrlRef.current) {
      URL.revokeObjectURL(currentBlobUrlRef.current);
      currentBlobUrlRef.current = null;
    }
    setStatus('idle');
    setCurrentWordId(null);
    setError(null);
  }, []);

  const play = useCallback(async (wordId: number, accent: Accent = 'us') => {
    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (currentBlobUrlRef.current) {
      URL.revokeObjectURL(currentBlobUrlRef.current);
      currentBlobUrlRef.current = null;
    }

    // Check auth
    if (!token) {
      setError('请先登录');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setError(null);
    setCurrentWordId(wordId);
    setCurrentAccent(accent);

    try {
      const response = await getPronunciation(wordId, accent, token);

      if (!response.url) {
        throw new Error('发音不可用');
      }

      // Create audio element
      const audio = new Audio(response.url);
      audioRef.current = audio;

      // Track blob URL for cleanup
      if (response.url.startsWith('blob:')) {
        currentBlobUrlRef.current = response.url;
      }

      // Handle events
      audio.oncanplaythrough = () => {
        setStatus('playing');
        audio.play().catch((err) => {
          setError('播放失败');
          setStatus('error');
          console.error('Audio play error:', err);
        });
      };

      audio.onended = () => {
        setStatus('idle');
        setCurrentWordId(null);
      };

      audio.onerror = () => {
        setError('音频加载失败');
        setStatus('error');
      };

      // Start loading
      audio.load();

    } catch (err) {
      const message = err instanceof Error ? err.message : '发音加载失败，请稍后重试';
      setError(message);
      setStatus('error');
    }
  }, [token]);

  return {
    status,
    error,
    play,
    stop,
    currentWordId,
    currentAccent,
  };
}
