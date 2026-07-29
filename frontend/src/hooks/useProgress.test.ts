/**
 * useProgress Hook Tests - REQ-PROG series
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProgress } from './useProgress';
import { useWordStore } from '../stores/wordStore';
import { useUserStore } from '../stores/userStore';
import * as api from '../lib/api';

// Mock the api module
vi.mock('../lib/api', () => ({
  getProgress: vi.fn(),
  getProgressStats: vi.fn(),
  markWordMastered: vi.fn(),
  unmarkWordMastered: vi.fn(),
}));

// Mock the adapters module
vi.mock('../adapters', () => ({
  apiFetch: vi.fn(),
}));

describe('useProgress Hook', () => {
  beforeEach(() => {
    // Reset store state before each test
    useWordStore.setState({
      progress: [],
      progressStats: null,
    });
    useUserStore.setState({
      user: { id: 1, username: 'testuser', email: 'test@example.com', created_at: '2024-01-01T00:00:00Z' },
      token: 'test-token',
      isAuthenticated: true,
    });
    vi.clearAllMocks();
  });

  describe('REQ-PROG-001: Mark Word as Mastered', () => {
    it('REQ-PROG-001: should mark a word as mastered', async () => {
      const mockResult = {
        word_id: 1,
        is_mastered: true,
        mastered_at: '2024-01-01T12:00:00Z',
      };

      vi.mocked(api.markWordMastered).mockResolvedValueOnce(mockResult);

      const { result } = renderHook(() => useProgress());

      await act(async () => {
        const res = await result.current.markMastered(1);
        expect(res).toEqual(mockResult);
      });

      expect(api.markWordMastered).toHaveBeenCalledWith(1, 'test-token');
      expect(result.current.isWordMastered(1)).toBe(true);
    });

    it('REQ-PROG-001: should create new progress record when marking as mastered', async () => {
      const mockResult = {
        word_id: 1,
        is_mastered: true,
        mastered_at: '2024-01-01T12:00:00Z',
      };

      vi.mocked(api.markWordMastered).mockResolvedValueOnce(mockResult);

      const { result } = renderHook(() => useProgress());

      // Initially not mastered
      expect(result.current.isWordMastered(1)).toBe(false);

      await act(async () => {
        await result.current.markMastered(1);
      });

      // Now mastered
      expect(result.current.isWordMastered(1)).toBe(true);
    });
  });

  describe('REQ-PROG-002: Unmark Word as Mastered', () => {
    it('REQ-PROG-002: should unmark a word as mastered', async () => {
      // Setup initial mastered state
      useWordStore.setState({
        progress: [{ word_id: 1, is_mastered: true, mastered_at: '2024-01-01T12:00:00Z' }],
      });

      vi.mocked(api.unmarkWordMastered).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useProgress());

      await act(async () => {
        await result.current.unmarkMastered(1);
      });

      expect(api.unmarkWordMastered).toHaveBeenCalledWith(1, 'test-token');
      expect(result.current.isWordMastered(1)).toBe(false);
    });

    it('REQ-PROG-002: should handle unmark failure', async () => {
      vi.mocked(api.unmarkWordMastered).mockRejectedValueOnce(new Error('Progress record not found'));

      const { result } = renderHook(() => useProgress());

      await act(async () => {
        try {
          await result.current.unmarkMastered(1);
        } catch (error) {
          expect((error as Error).message).toBe('Progress record not found');
        }
      });

      expect(result.current.error).toBe('Progress record not found');
    });
  });

  describe('REQ-PROG-003: Get Learning Progress', () => {
    it('REQ-PROG-003: should load progress for a word bank', async () => {
      const mockProgress = [
        { word_id: 1, is_mastered: true, mastered_at: '2024-01-01T12:00:00Z' },
        { word_id: 2, is_mastered: false, mastered_at: null },
      ];

      const mockStats = {
        total_words: 10,
        mastered_words: 5,
        progress_percentage: 50.0,
      };

      vi.mocked(api.getProgress).mockResolvedValueOnce(mockProgress);
      vi.mocked(api.getProgressStats).mockResolvedValueOnce(mockStats);

      const { result } = renderHook(() => useProgress());

      await act(async () => {
        await result.current.loadProgress(1);
      });

      expect(api.getProgress).toHaveBeenCalledWith(1, 'test-token');
      expect(api.getProgressStats).toHaveBeenCalledWith(1, 'test-token');
      expect(result.current.progress).toEqual(mockProgress);
      expect(result.current.progressStats).toEqual(mockStats);
    });

    it('REQ-PROG-003: should return correct mastery status for each word', async () => {
      useWordStore.setState({
        progress: [
          { word_id: 1, is_mastered: true, mastered_at: '2024-01-01T12:00:00Z' },
          { word_id: 2, is_mastered: false, mastered_at: null },
        ],
      });

      const { result } = renderHook(() => useProgress());

      expect(result.current.isWordMastered(1)).toBe(true);
      expect(result.current.isWordMastered(2)).toBe(false);
      expect(result.current.isWordMastered(3)).toBe(false); // Word not in progress
    });
  });

  describe('REQ-PROG-004: Get Progress Statistics', () => {
    it('REQ-PROG-004: should update stats after marking a word', async () => {
      useWordStore.setState({
        progressStats: {
          total_words: 10,
          mastered_words: 5,
          progress_percentage: 50.0,
        },
      });

      const mockResult = {
        word_id: 6,
        is_mastered: true,
        mastered_at: '2024-01-01T12:00:00Z',
      };

      vi.mocked(api.markWordMastered).mockResolvedValueOnce(mockResult);

      const { result } = renderHook(() => useProgress());

      await act(async () => {
        await result.current.markMastered(6);
      });

      expect(result.current.progressStats?.mastered_words).toBe(6);
      expect(result.current.progressStats?.progress_percentage).toBe(60);
    });

    it('REQ-PROG-004: should update stats after unmarking a word', async () => {
      useWordStore.setState({
        progress: [{ word_id: 1, is_mastered: true, mastered_at: '2024-01-01T12:00:00Z' }],
        progressStats: {
          total_words: 10,
          mastered_words: 6,
          progress_percentage: 60.0,
        },
      });

      vi.mocked(api.unmarkWordMastered).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useProgress());

      await act(async () => {
        await result.current.unmarkMastered(1);
      });

      expect(result.current.progressStats?.mastered_words).toBe(5);
      expect(result.current.progressStats?.progress_percentage).toBe(50);
    });

    it('REQ-PROG-004: should handle stats with zero total words', async () => {
      useWordStore.setState({
        progressStats: {
          total_words: 0,
          mastered_words: 0,
          progress_percentage: 0,
        },
      });

      const { result } = renderHook(() => useProgress());

      expect(result.current.progressStats?.total_words).toBe(0);
      expect(result.current.progressStats?.mastered_words).toBe(0);
      expect(result.current.progressStats?.progress_percentage).toBe(0);
    });
  });

  describe('Toggle Mastered', () => {
    it('should toggle from unmastered to mastered', async () => {
      const mockResult = {
        word_id: 1,
        is_mastered: true,
        mastered_at: '2024-01-01T12:00:00Z',
      };

      vi.mocked(api.markWordMastered).mockResolvedValueOnce(mockResult);

      const { result } = renderHook(() => useProgress());

      expect(result.current.isWordMastered(1)).toBe(false);

      await act(async () => {
        await result.current.toggleMastered(1);
      });

      expect(result.current.isWordMastered(1)).toBe(true);
    });

    it('should toggle from mastered to unmastered', async () => {
      useWordStore.setState({
        progress: [{ word_id: 1, is_mastered: true, mastered_at: '2024-01-01T12:00:00Z' }],
      });

      vi.mocked(api.unmarkWordMastered).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useProgress());

      expect(result.current.isWordMastered(1)).toBe(true);

      await act(async () => {
        await result.current.toggleMastered(1);
      });

      expect(result.current.isWordMastered(1)).toBe(false);
    });
  });
});
