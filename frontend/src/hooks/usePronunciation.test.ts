/**
 * usePronunciation Hook Tests - REQ-WORD-003
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePronunciation } from './usePronunciation';
import { useUserStore } from '../stores/userStore';
import * as api from '../lib/api';

// Mock dependencies
vi.mock('../stores/userStore', () => ({
  useUserStore: vi.fn(),
}));

vi.mock('../lib/api', () => ({
  getPronunciation: vi.fn(),
}));

describe('usePronunciation Hook - REQ-WORD-003', () => {
  const mockToken = 'test-token';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useUserStore).mockReturnValue({
      token: mockToken,
      isAuthenticated: true,
      user: { id: 1, username: 'test', email: 'test@example.com', created_at: '2024-01-01' },
      setUser: vi.fn(),
      setToken: vi.fn(),
      logout: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('REQ-WORD-003: Initial State', () => {
    it('REQ-WORD-003: should start with idle status', () => {
      const { result } = renderHook(() => usePronunciation());

      expect(result.current.status).toBe('idle');
      expect(result.current.error).toBeNull();
      expect(result.current.currentWordId).toBeNull();
    });
  });

  describe('REQ-WORD-003: Play Pronunciation', () => {
    it('REQ-WORD-003: should set loading status when starting to play', async () => {
      vi.mocked(api.getPronunciation).mockResolvedValue({
        url: 'blob:test-url',
        available: true,
        accent: 'us',
      });

      const { result } = renderHook(() => usePronunciation());

      act(() => {
        result.current.play(1, 'hello', 'us');
      });

      expect(result.current.status).toBe('loading');
      expect(result.current.currentWordId).toBe(1);
    });

    it('REQ-WORD-003: should show error when not authenticated', async () => {
      vi.mocked(useUserStore).mockReturnValue({
        token: null,
        isAuthenticated: false,
        user: null,
        setUser: vi.fn(),
        setToken: vi.fn(),
        logout: vi.fn(),
      });

      const { result } = renderHook(() => usePronunciation());

      await act(async () => {
        await result.current.play(1, 'hello', 'us');
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error).toBe('请先登录');
    });

    it('REQ-WORD-003: should show error when pronunciation not available and no speech fallback', async () => {
      // Ensure Web Speech API is unavailable so the error surfaces
      const original = (window as unknown as { speechSynthesis?: unknown }).speechSynthesis;
      delete (window as unknown as { speechSynthesis?: unknown }).speechSynthesis;

      vi.mocked(api.getPronunciation).mockRejectedValue(new Error('发音不可用'));

      const { result } = renderHook(() => usePronunciation());

      await act(async () => {
        await result.current.play(1, 'hello', 'us');
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error).toBe('发音不可用');

      if (original !== undefined) {
        (window as unknown as { speechSynthesis?: unknown }).speechSynthesis = original;
      }
    });

    it('REQ-WORD-003: should fall back to speech synthesis when audio API fails', async () => {
      // Web Speech API available -> pronunciation should still work
      const speak = vi.fn((utterance: { onstart?: () => void; onend?: () => void }) => {
        utterance.onstart?.();
        utterance.onend?.();
      });
      const cancel = vi.fn();
      (window as unknown as { speechSynthesis: unknown }).speechSynthesis = { speak, cancel };
      (globalThis as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance =
        class {
          text: string;
          lang = '';
          onstart?: () => void;
          onend?: () => void;
          onerror?: () => void;
          constructor(text: string) {
            this.text = text;
          }
        };

      vi.mocked(api.getPronunciation).mockRejectedValue(new Error('network error'));

      const { result } = renderHook(() => usePronunciation());

      await act(async () => {
        await result.current.play(1, 'hello', 'us');
      });

      expect(speak).toHaveBeenCalled();
      // Fallback speech ran to completion -> back to idle, no error surfaced
      expect(result.current.status).toBe('idle');
      expect(result.current.error).toBeNull();

      delete (window as unknown as { speechSynthesis?: unknown }).speechSynthesis;
    });
  });

  describe('REQ-WORD-003: Stop Pronunciation', () => {
    it('REQ-WORD-003: should stop playing and reset to idle', async () => {
      const { result } = renderHook(() => usePronunciation());

      // Start playing (mock)
      act(() => {
        result.current.play(1, 'hello', 'us');
      });

      expect(result.current.status).toBe('loading');

      // Stop
      act(() => {
        result.current.stop();
      });

      expect(result.current.status).toBe('idle');
      expect(result.current.currentWordId).toBeNull();
    });
  });

  describe('REQ-WORD-003: Accent Support', () => {
    it('REQ-WORD-003: should call API with correct accent', async () => {
      vi.mocked(api.getPronunciation).mockResolvedValue({
        url: 'blob:test-url',
        available: true,
        accent: 'uk',
      });

      const { result } = renderHook(() => usePronunciation());

      await act(async () => {
        await result.current.play(1, 'hello', 'uk');
      });

      expect(api.getPronunciation).toHaveBeenCalledWith(1, 'uk', mockToken);
    });
  });
});
