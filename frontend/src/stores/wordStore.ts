/**
 * Word Store - 单词状态管理
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { WordBank, Word, Progress, ProgressStats } from '../lib/api';

interface WordState {
  // Word Banks
  wordBanks: WordBank[];
  selectedWordBank: WordBank | null;

  // Words
  words: Word[];
  currentWordIndex: number;
  totalWords: number;

  // Progress
  progress: Progress[];
  progressStats: ProgressStats | null;

  // Loading states
  isLoadingBanks: boolean;
  isLoadingWords: boolean;

  // Actions
  setWordBanks: (banks: WordBank[]) => void;
  selectWordBank: (bank: WordBank | null) => void;
  setWords: (words: Word[], total: number) => void;
  setCurrentWordIndex: (index: number) => void;
  nextWord: () => void;
  prevWord: () => void;
  setProgress: (progress: Progress[]) => void;
  setProgressStats: (stats: ProgressStats | null) => void;
  updateWordProgress: (wordId: number, isMastered: boolean) => void;
  setLoadingBanks: (loading: boolean) => void;
  setLoadingWords: (loading: boolean) => void;
  reset: () => void;
}

export const useWordStore = create<WordState>()(
  persist(
    (set) => ({
      wordBanks: [],
      selectedWordBank: null,
      words: [],
      currentWordIndex: 0,
      totalWords: 0,
      progress: [],
      progressStats: null,
      isLoadingBanks: false,
      isLoadingWords: false,

      setWordBanks: (banks) => set({ wordBanks: banks }),

      selectWordBank: (bank) => set({ selectedWordBank: bank, currentWordIndex: 0 }),

      setWords: (words, total) => set({ words, totalWords: total }),

      setCurrentWordIndex: (index) => set({ currentWordIndex: index }),

      nextWord: () => set((state) => ({
        currentWordIndex: Math.min(state.currentWordIndex + 1, state.words.length - 1)
      })),

      prevWord: () => set((state) => ({
        currentWordIndex: Math.max(state.currentWordIndex - 1, 0)
      })),

      setProgress: (progress) => set({ progress }),

      setProgressStats: (stats) => set({ progressStats: stats }),

      updateWordProgress: (wordId, isMastered) => set((state) => {
        const existingIndex = state.progress.findIndex(p => p.word_id === wordId);
        if (existingIndex >= 0) {
          // Update existing entry
          return {
            progress: state.progress.map(p =>
              p.word_id === wordId ? { ...p, is_mastered: isMastered } : p
            ),
          };
        } else {
          // Add new entry
          return {
            progress: [...state.progress, { word_id: wordId, is_mastered: isMastered, mastered_at: isMastered ? new Date().toISOString() : null }],
          };
        }
      }),

      setLoadingBanks: (loading) => set({ isLoadingBanks: loading }),

      setLoadingWords: (loading) => set({ isLoadingWords: loading }),

      reset: () => set({
        selectedWordBank: null,
        words: [],
        currentWordIndex: 0,
        totalWords: 0,
        progress: [],
        progressStats: null,
      }),
    }),
    {
      name: 'vocabmaster-word-store',
      storage: createJSONStorage(() => localStorage),
      // Persist only navigation state so a page refresh restores the user's
      // place (selected bank + word index). Words/progress are refetched from
      // the backend on load, so they are intentionally excluded.
      partialize: (state) => ({
        selectedWordBank: state.selectedWordBank,
        currentWordIndex: state.currentWordIndex,
      }),
    }
  )
);
