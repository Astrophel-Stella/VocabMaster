/**
 * WordCard Progress Section Tests - REQ-UI-004 + REQ-PROG-001~004
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WordCard } from './WordCard';
import { useWords } from '../hooks/useWords';
import { useProgress } from '../hooks/useProgress';
import { useUserStore } from '../stores/userStore';

// Import jest-dom matchers
import '@testing-library/jest-dom/vitest';

// Mock the hooks
vi.mock('../hooks/useWords', () => ({
  useWords: vi.fn(),
}));

vi.mock('../hooks/useProgress', () => ({
  useProgress: vi.fn(),
}));

vi.mock('../stores/userStore', () => ({
  useUserStore: vi.fn(),
}));

describe('WordCard Progress Section - REQ-UI-004', () => {
  const mockToggleMastered = vi.fn();
  const mockNextWord = vi.fn();
  const mockPrevWord = vi.fn();
  const mockGoToWord = vi.fn();

  const mockWord = {
    id: 1,
    spelling: 'abandon',
    phonetic: '/əˈbændən/',
    pronunciation_url: null,
    meaning: 'v. 放弃',
    example_sentence: 'He abandoned his family.',
  };

  const baseUseWordsReturn = {
    currentWord: mockWord,
    currentWordIndex: 0,
    totalWords: 10,
    nextWord: mockNextWord,
    prevWord: mockPrevWord,
    goToWord: mockGoToWord,
    isLoadingWords: false,
    wordBanks: [],
    selectedWordBank: null,
    words: [mockWord],
    isLoadingBanks: false,
    error: null,
    selectWordBank: vi.fn(),
    loadWords: vi.fn(),
    reset: vi.fn(),
    clearError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useWords).mockReturnValue(baseUseWordsReturn);
  });

  describe('REQ-UI-004: Progress Bar Display', () => {
    it('REQ-UI-004: should display current progress (进度 N/总数)', () => {
      vi.mocked(useUserStore).mockReturnValue({
        isAuthenticated: true,
        user: { id: 1, username: 'test', email: 'test@example.com', created_at: '2024-01-01' },
        token: 'test-token',
        setUser: vi.fn(),
        setToken: vi.fn(),
        logout: vi.fn(),
      });

      vi.mocked(useProgress).mockReturnValue({
        progress: [],
        progressStats: { total_words: 10, mastered_words: 3, progress_percentage: 30 },
        isLoading: false,
        error: null,
        loadProgress: vi.fn(),
        markMastered: vi.fn(),
        unmarkMastered: vi.fn(),
        toggleMastered: mockToggleMastered,
        isWordMastered: vi.fn(() => false),
        clearError: vi.fn(),
      });

      render(<WordCard />);

      expect(screen.getByText(/进度.*1.*10/i)).toBeInTheDocument();
    });

    it('REQ-UI-004: should display mastered count (已掌握 M/总数)', () => {
      vi.mocked(useUserStore).mockReturnValue({
        isAuthenticated: true,
        user: { id: 1, username: 'test', email: 'test@example.com', created_at: '2024-01-01' },
        token: 'test-token',
        setUser: vi.fn(),
        setToken: vi.fn(),
        logout: vi.fn(),
      });

      vi.mocked(useProgress).mockReturnValue({
        progress: [{ word_id: 1, is_mastered: true, mastered_at: '2024-01-01' }],
        progressStats: { total_words: 10, mastered_words: 3, progress_percentage: 30 },
        isLoading: false,
        error: null,
        loadProgress: vi.fn(),
        markMastered: vi.fn(),
        unmarkMastered: vi.fn(),
        toggleMastered: mockToggleMastered,
        isWordMastered: vi.fn(() => true),
        clearError: vi.fn(),
      });

      render(<WordCard />);

      expect(screen.getByText(/已掌握.*3.*10/i)).toBeInTheDocument();
    });
  });

  describe('REQ-UI-004 + REQ-PROG-001: Mark as Mastered', () => {
    beforeEach(() => {
      vi.mocked(useUserStore).mockReturnValue({
        isAuthenticated: true,
        user: { id: 1, username: 'test', email: 'test@example.com', created_at: '2024-01-01' },
        token: 'test-token',
        setUser: vi.fn(),
        setToken: vi.fn(),
        logout: vi.fn(),
      });
    });

    it('REQ-UI-004 + REQ-PROG-001: should show "○ 标记已掌握" button for unmastered word', () => {
      vi.mocked(useProgress).mockReturnValue({
        progress: [],
        progressStats: { total_words: 10, mastered_words: 0, progress_percentage: 0 },
        isLoading: false,
        error: null,
        loadProgress: vi.fn(),
        markMastered: vi.fn(),
        unmarkMastered: vi.fn(),
        toggleMastered: mockToggleMastered,
        isWordMastered: vi.fn(() => false),
        clearError: vi.fn(),
      });

      render(<WordCard />);

      expect(screen.getByRole('button', { name: /标记已掌握/i })).toBeInTheDocument();
    });

    it('REQ-UI-004 + REQ-PROG-001: should call toggleMastered when clicking mark button', async () => {
      vi.mocked(useProgress).mockReturnValue({
        progress: [],
        progressStats: { total_words: 10, mastered_words: 0, progress_percentage: 0 },
        isLoading: false,
        error: null,
        loadProgress: vi.fn(),
        markMastered: vi.fn(),
        unmarkMastered: vi.fn(),
        toggleMastered: mockToggleMastered,
        isWordMastered: vi.fn(() => false),
        clearError: vi.fn(),
      });

      const user = userEvent.setup();
      render(<WordCard />);

      await user.click(screen.getByRole('button', { name: /标记已掌握/i }));

      expect(mockToggleMastered).toHaveBeenCalledWith(1);
    });
  });

  describe('REQ-UI-004 + REQ-PROG-002: Unmark Mastered', () => {
    beforeEach(() => {
      vi.mocked(useUserStore).mockReturnValue({
        isAuthenticated: true,
        user: { id: 1, username: 'test', email: 'test@example.com', created_at: '2024-01-01' },
        token: 'test-token',
        setUser: vi.fn(),
        setToken: vi.fn(),
        logout: vi.fn(),
      });
    });

    it('REQ-UI-004 + REQ-PROG-002: should show "✓ 已掌握" for mastered word', () => {
      vi.mocked(useProgress).mockReturnValue({
        progress: [{ word_id: 1, is_mastered: true, mastered_at: '2024-01-01' }],
        progressStats: { total_words: 10, mastered_words: 1, progress_percentage: 10 },
        isLoading: false,
        error: null,
        loadProgress: vi.fn(),
        markMastered: vi.fn(),
        unmarkMastered: vi.fn(),
        toggleMastered: mockToggleMastered,
        isWordMastered: vi.fn(() => true),
        clearError: vi.fn(),
      });

      render(<WordCard />);

      expect(screen.getByRole('button', { name: /已掌握/i })).toBeInTheDocument();
    });

    it('REQ-UI-004 + REQ-PROG-002: should call toggleMastered to unmark', async () => {
      vi.mocked(useProgress).mockReturnValue({
        progress: [{ word_id: 1, is_mastered: true, mastered_at: '2024-01-01' }],
        progressStats: { total_words: 10, mastered_words: 1, progress_percentage: 10 },
        isLoading: false,
        error: null,
        loadProgress: vi.fn(),
        markMastered: vi.fn(),
        unmarkMastered: vi.fn(),
        toggleMastered: mockToggleMastered,
        isWordMastered: vi.fn(() => true),
        clearError: vi.fn(),
      });

      const user = userEvent.setup();
      render(<WordCard />);

      await user.click(screen.getByRole('button', { name: /已掌握/i }));

      expect(mockToggleMastered).toHaveBeenCalledWith(1);
    });
  });

  describe('REQ-UI-004: State Toggle', () => {
    beforeEach(() => {
      vi.mocked(useUserStore).mockReturnValue({
        isAuthenticated: true,
        user: { id: 1, username: 'test', email: 'test@example.com', created_at: '2024-01-01' },
        token: 'test-token',
        setUser: vi.fn(),
        setToken: vi.fn(),
        logout: vi.fn(),
      });
    });

    it('REQ-UI-004: should toggle button text from "标记已掌握" to "已掌握"', () => {
      // Initially unmastered
      vi.mocked(useProgress).mockReturnValue({
        progress: [],
        progressStats: { total_words: 10, mastered_words: 0, progress_percentage: 0 },
        isLoading: false,
        error: null,
        loadProgress: vi.fn(),
        markMastered: vi.fn(),
        unmarkMastered: vi.fn(),
        toggleMastered: mockToggleMastered,
        isWordMastered: vi.fn(() => false),
        clearError: vi.fn(),
      });

      const { rerender } = render(<WordCard />);
      expect(screen.getByRole('button', { name: /标记已掌握/i })).toBeInTheDocument();

      // After mastered
      vi.mocked(useProgress).mockReturnValue({
        progress: [{ word_id: 1, is_mastered: true, mastered_at: '2024-01-01' }],
        progressStats: { total_words: 10, mastered_words: 1, progress_percentage: 10 },
        isLoading: false,
        error: null,
        loadProgress: vi.fn(),
        markMastered: vi.fn(),
        unmarkMastered: vi.fn(),
        toggleMastered: mockToggleMastered,
        isWordMastered: vi.fn(() => true),
        clearError: vi.fn(),
      });

      rerender(<WordCard />);
      // The button text changes from "○ 标记已掌握" to "✓ 已掌握"
      expect(screen.getByRole('button', { name: /已掌握/i })).toBeInTheDocument();
    });
  });

  describe('REQ-UI-004 + REQ-PROG-004: Stats Update', () => {
    beforeEach(() => {
      vi.mocked(useUserStore).mockReturnValue({
        isAuthenticated: true,
        user: { id: 1, username: 'test', email: 'test@example.com', created_at: '2024-01-01' },
        token: 'test-token',
        setUser: vi.fn(),
        setToken: vi.fn(),
        logout: vi.fn(),
      });
    });

    it('REQ-UI-004 + REQ-PROG-004: should update stats after marking as mastered', async () => {
      vi.mocked(useProgress).mockReturnValue({
        progress: [{ word_id: 1, is_mastered: true, mastered_at: '2024-01-01' }],
        progressStats: { total_words: 10, mastered_words: 1, progress_percentage: 10 },
        isLoading: false,
        error: null,
        loadProgress: vi.fn(),
        markMastered: vi.fn(),
        unmarkMastered: vi.fn(),
        toggleMastered: mockToggleMastered,
        isWordMastered: vi.fn(() => true),
        clearError: vi.fn(),
      });

      render(<WordCard />);

      // Stats should reflect the updated count
      expect(screen.getByText(/已掌握.*1.*10/i)).toBeInTheDocument();
    });
  });

  describe('REQ-UI-004: Authenticated Only', () => {
    it('REQ-UI-004: should NOT show mastered button when not authenticated', () => {
      vi.mocked(useUserStore).mockReturnValue({
        isAuthenticated: false,
        user: null,
        token: null,
        setUser: vi.fn(),
        setToken: vi.fn(),
        logout: vi.fn(),
      });

      vi.mocked(useProgress).mockReturnValue({
        progress: [],
        progressStats: null,
        isLoading: false,
        error: null,
        loadProgress: vi.fn(),
        markMastered: vi.fn(),
        unmarkMastered: vi.fn(),
        toggleMastered: mockToggleMastered,
        isWordMastered: vi.fn(() => false),
        clearError: vi.fn(),
      });

      render(<WordCard />);

      expect(screen.queryByRole('button', { name: /标记已掌握/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /已掌握/i })).not.toBeInTheDocument();
    });

    it('REQ-UI-004: should show mastered button when authenticated', () => {
      vi.mocked(useUserStore).mockReturnValue({
        isAuthenticated: true,
        user: { id: 1, username: 'test', email: 'test@example.com', created_at: '2024-01-01' },
        token: 'test-token',
        setUser: vi.fn(),
        setToken: vi.fn(),
        logout: vi.fn(),
      });

      vi.mocked(useProgress).mockReturnValue({
        progress: [],
        progressStats: { total_words: 10, mastered_words: 0, progress_percentage: 0 },
        isLoading: false,
        error: null,
        loadProgress: vi.fn(),
        markMastered: vi.fn(),
        unmarkMastered: vi.fn(),
        toggleMastered: mockToggleMastered,
        isWordMastered: vi.fn(() => false),
        clearError: vi.fn(),
      });

      render(<WordCard />);

      expect(screen.getByRole('button', { name: /标记已掌握/i })).toBeInTheDocument();
    });
  });

  describe('REQ-UI-004: Loading State During Toggle', () => {
    beforeEach(() => {
      vi.mocked(useUserStore).mockReturnValue({
        isAuthenticated: true,
        user: { id: 1, username: 'test', email: 'test@example.com', created_at: '2024-01-01' },
        token: 'test-token',
        setUser: vi.fn(),
        setToken: vi.fn(),
        logout: vi.fn(),
      });
    });

    it('REQ-UI-004: should disable button during loading', () => {
      vi.mocked(useProgress).mockReturnValue({
        progress: [],
        progressStats: { total_words: 10, mastered_words: 0, progress_percentage: 0 },
        isLoading: true,
        error: null,
        loadProgress: vi.fn(),
        markMastered: vi.fn(),
        unmarkMastered: vi.fn(),
        toggleMastered: mockToggleMastered,
        isWordMastered: vi.fn(() => false),
        clearError: vi.fn(),
      });

      render(<WordCard />);

      const markButton = screen.getByRole('button', { name: /标记已掌握/i });
      expect(markButton).toBeDisabled();
    });
  });
});
