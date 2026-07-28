/**
 * useProgress Hook - 学习进度业务逻辑
 */

import { useState } from 'react';
import { useWordStore } from '../stores/wordStore';
import { useUserStore } from '../stores/userStore';
import * as api from '../lib/api';

export function useProgress() {
  const { progress, progressStats, setProgress, setProgressStats, updateWordProgress } = useWordStore();
  const { token } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProgress = async (wordBankId: number) => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const [progressData, statsData] = await Promise.all([
        api.getProgress(wordBankId, token),
        api.getProgressStats(wordBankId, token),
      ]);

      setProgress(progressData);
      setProgressStats(statsData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load progress';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const markMastered = async (wordId: number) => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await api.markWordMastered(wordId, token);
      updateWordProgress(wordId, true);

      // Update stats
      if (progressStats) {
        const newMastered = progressStats.mastered_words + 1;
        setProgressStats({
          ...progressStats,
          mastered_words: newMastered,
          progress_percentage: (newMastered / progressStats.total_words) * 100,
        });
      }

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mark as mastered';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const unmarkMastered = async (wordId: number) => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      await api.unmarkWordMastered(wordId, token);
      updateWordProgress(wordId, false);

      // Update stats
      if (progressStats) {
        const newMastered = Math.max(progressStats.mastered_words - 1, 0);
        setProgressStats({
          ...progressStats,
          mastered_words: newMastered,
          progress_percentage: (newMastered / progressStats.total_words) * 100,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unmark';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMastered = async (wordId: number) => {
    const currentProgress = progress.find(p => p.word_id === wordId);
    if (currentProgress?.is_mastered) {
      await unmarkMastered(wordId);
    } else {
      await markMastered(wordId);
    }
  };

  const isWordMastered = (wordId: number): boolean => {
    const p = progress.find(p => p.word_id === wordId);
    return p?.is_mastered ?? false;
  };

  return {
    progress,
    progressStats,
    isLoading,
    error,
    loadProgress,
    markMastered,
    unmarkMastered,
    toggleMastered,
    isWordMastered,
    clearError: () => setError(null),
  };
}
