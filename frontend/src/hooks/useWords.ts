/**
 * useWords Hook - 单词加载业务逻辑
 */

import { useState, useEffect } from 'react';
import { useWordStore } from '../stores/wordStore';
import * as api from '../lib/api';

export function useWords() {
  const {
    wordBanks,
    selectedWordBank,
    words,
    currentWordIndex,
    totalWords,
    isLoadingBanks,
    isLoadingWords,
    setWordBanks,
    selectWordBank,
    setWords,
    setCurrentWordIndex,
    nextWord: nextWordStore,
    prevWord: prevWordStore,
    setLoadingBanks,
    setLoadingWords,
    reset,
  } = useWordStore();

  const [error, setError] = useState<string | null>(null);

  // Load word banks on mount
  useEffect(() => {
    loadWordBanks();
  }, []);

  const loadWordBanks = async () => {
    setLoadingBanks(true);
    setError(null);

    try {
      const banks = await api.getWordBanks();
      setWordBanks(banks);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load word banks';
      setError(message);
    } finally {
      setLoadingBanks(false);
    }
  };

  const loadWords = async (wordBankId: number, skip = 0, limit = 20) => {
    setLoadingWords(true);
    setError(null);

    try {
      const { words: wordList, total } = await api.getWords(wordBankId, skip, limit);
      setWords(wordList, total);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load words';
      setError(message);
    } finally {
      setLoadingWords(false);
    }
  };

  const currentWord = words[currentWordIndex] || null;

  const nextWord = () => {
    if (currentWordIndex < words.length - 1) {
      nextWordStore();
    }
  };

  const prevWord = () => {
    if (currentWordIndex > 0) {
      prevWordStore();
    }
  };

  const goToWord = (index: number) => {
    if (index >= 0 && index < words.length) {
      setCurrentWordIndex(index);
    }
  };

  return {
    wordBanks,
    selectedWordBank,
    words,
    currentWord,
    currentWordIndex,
    totalWords,
    isLoadingBanks,
    isLoadingWords,
    error,
    selectWordBank,
    loadWords,
    nextWord,
    prevWord,
    goToWord,
    reset,
    clearError: () => setError(null),
  };
}
