/**
 * useWords Hook Tests - REQ-WB series
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWords } from './useWords';
import { useWordStore } from '../stores/wordStore';
import * as api from '../lib/api';

// Mock the api module
vi.mock('../lib/api', () => ({
  getWordBanks: vi.fn(),
  getWords: vi.fn(),
  getWord: vi.fn(),
}));

// Mock the adapters module
vi.mock('../adapters', () => ({
  apiFetch: vi.fn(),
}));

describe('useWords Hook', () => {
  beforeEach(() => {
    // Reset store state before each test
    useWordStore.setState({
      wordBanks: [],
      selectedWordBank: null,
      words: [],
      currentWordIndex: 0,
      totalWords: 0,
      isLoadingBanks: false,
      isLoadingWords: false,
      progress: [],
      progressStats: null,
    });
    vi.clearAllMocks();
  });

  describe('REQ-WB-001: Get Word Banks', () => {
    it('REQ-WB-001: should load word banks on mount', async () => {
      const mockBanks = [
        { id: 1, name: '高考英语', description: '高考英语核心词汇', total_words: 3 },
        { id: 2, name: '考研英语', description: '考研英语核心词汇', total_words: 2 },
      ];

      vi.mocked(api.getWordBanks).mockResolvedValueOnce(mockBanks);

      const { result } = renderHook(() => useWords());

      await waitFor(() => {
        expect(result.current.wordBanks).toEqual(mockBanks);
      });

      expect(api.getWordBanks).toHaveBeenCalled();
    });

    it('REQ-WB-001: should handle loading word banks failure', async () => {
      vi.mocked(api.getWordBanks).mockRejectedValueOnce(new Error('Failed to load word banks'));

      const { result } = renderHook(() => useWords());

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to load word banks');
      });
    });
  });

  describe('REQ-WB-002: Get Words', () => {
    it('REQ-WB-002: should load words from a word bank', async () => {
      const mockWords = [
        { id: 1, spelling: 'abandon', phonetic: '/əˈbændən/', meaning: 'v. 放弃', example_sentence: 'He abandoned his family.' },
        { id: 2, spelling: 'ability', phonetic: '/əˈbɪləti/', meaning: 'n. 能力', example_sentence: 'She has ability.' },
      ];

      vi.mocked(api.getWords).mockResolvedValueOnce({ words: mockWords, total: 2 });

      const { result } = renderHook(() => useWords());

      await act(async () => {
        await result.current.loadWords(1);
      });

      expect(api.getWords).toHaveBeenCalledWith(1, 0, 20);
      expect(result.current.words).toEqual(mockWords);
      expect(result.current.totalWords).toBe(2);
    });

    it('REQ-WB-002: should support pagination parameters', async () => {
      const mockWords = [
        { id: 3, spelling: 'absorb', phonetic: '/əbˈsɔːrb/', meaning: 'v. 吸收', example_sentence: 'Plants absorb water.' },
      ];

      vi.mocked(api.getWords).mockResolvedValueOnce({ words: mockWords, total: 5 });

      const { result } = renderHook(() => useWords());

      await act(async () => {
        await result.current.loadWords(1, 2, 1);
      });

      expect(api.getWords).toHaveBeenCalledWith(1, 2, 1);
      expect(result.current.words).toEqual(mockWords);
    });
  });

  describe('Word Navigation', () => {
    it('should navigate to next word', async () => {
      const mockWords = [
        { id: 1, spelling: 'word1', phonetic: '/w1/', meaning: 'm1', example_sentence: 'e1' },
        { id: 2, spelling: 'word2', phonetic: '/w2/', meaning: 'm2', example_sentence: 'e2' },
      ];

      vi.mocked(api.getWords).mockResolvedValueOnce({ words: mockWords, total: 2 });

      const { result } = renderHook(() => useWords());

      await act(async () => {
        await result.current.loadWords(1);
      });

      expect(result.current.currentWordIndex).toBe(0);

      act(() => {
        result.current.nextWord();
      });

      expect(result.current.currentWordIndex).toBe(1);
    });

    it('should navigate to previous word', async () => {
      const mockWords = [
        { id: 1, spelling: 'word1', phonetic: '/w1/', meaning: 'm1', example_sentence: 'e1' },
        { id: 2, spelling: 'word2', phonetic: '/w2/', meaning: 'm2', example_sentence: 'e2' },
      ];

      vi.mocked(api.getWords).mockResolvedValueOnce({ words: mockWords, total: 2 });

      const { result } = renderHook(() => useWords());

      await act(async () => {
        await result.current.loadWords(1);
      });

      // Move to second word
      act(() => {
        result.current.nextWord();
      });
      expect(result.current.currentWordIndex).toBe(1);

      // Go back
      act(() => {
        result.current.prevWord();
      });
      expect(result.current.currentWordIndex).toBe(0);
    });

    it('should not go beyond word list bounds', async () => {
      const mockWords = [
        { id: 1, spelling: 'word1', phonetic: '/w1/', meaning: 'm1', example_sentence: 'e1' },
      ];

      vi.mocked(api.getWords).mockResolvedValueOnce({ words: mockWords, total: 1 });

      const { result } = renderHook(() => useWords());

      await act(async () => {
        await result.current.loadWords(1);
      });

      // Try to go next when at the end
      act(() => {
        result.current.nextWord();
      });
      expect(result.current.currentWordIndex).toBe(0);

      // Try to go prev when at the beginning
      act(() => {
        result.current.prevWord();
      });
      expect(result.current.currentWordIndex).toBe(0);
    });
  });
});
