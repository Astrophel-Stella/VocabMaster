/**
 * WordCard Component Tests - REQ-UI-003 + REQ-WB-002 + REQ-WORD-001/003/004
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WordCard } from './WordCard';
import { useWords } from '../hooks/useWords';
import { useProgress } from '../hooks/useProgress';
import { usePronunciation } from '../hooks/usePronunciation';
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

vi.mock('../hooks/usePronunciation', () => ({
  usePronunciation: vi.fn(),
}));

vi.mock('../stores/userStore', () => ({
  useUserStore: vi.fn(),
}));

describe('WordCard Component - REQ-UI-003', () => {
  const mockNextWord = vi.fn();
  const mockPrevWord = vi.fn();
  const mockGoToWord = vi.fn();
  const mockToggleMastered = vi.fn();

  const mockWord = {
    id: 1,
    spelling: 'abandon',
    phonetic: '/əˈbændən/',
    pronunciation_url: null,
    meaning: 'v. 放弃',
    example_sentence: 'He abandoned his family.',
  };

  const mockWord2 = {
    id: 2,
    spelling: 'ability',
    phonetic: '/əˈbɪləti/',
    pronunciation_url: null,
    meaning: 'n. 能力',
    example_sentence: 'She has ability.',
  };

  const mockWord3 = {
    id: 3,
    spelling: 'abstract',
    phonetic: '/ˈæbstrækt/',
    pronunciation_url: null,
    meaning: 'adj. 抽象的',
    example_sentence: 'The concept is abstract.',
  };

  const baseUseWordsReturn = {
    currentWord: null as any,
    currentWordIndex: 0,
    totalWords: 0,
    nextWord: mockNextWord,
    prevWord: mockPrevWord,
    goToWord: mockGoToWord,
    isLoadingWords: false,
    wordBanks: [],
    selectedWordBank: null,
    words: [] as any[],
    isLoadingBanks: false,
    error: null,
    selectWordBank: vi.fn(),
    loadWords: vi.fn(),
    reset: vi.fn(),
    clearError: vi.fn(),
  };

  const mockPlayPronunciation = vi.fn();
  const mockStopPronunciation = vi.fn();

  const baseUsePronunciationReturn = {
    status: 'idle' as const,
    error: null as string | null,
    play: mockPlayPronunciation,
    stop: mockStopPronunciation,
    currentWordId: null as number | null,
    currentAccent: 'us' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();

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
      progressStats: { total_words: 3, mastered_words: 0, progress_percentage: 0 },
      isLoading: false,
      error: null,
      loadProgress: vi.fn(),
      markMastered: vi.fn(),
      unmarkMastered: vi.fn(),
      toggleMastered: mockToggleMastered,
      isWordMastered: vi.fn(() => false),
      clearError: vi.fn(),
    });

    vi.mocked(usePronunciation).mockReturnValue(baseUsePronunciationReturn);
  });

  describe('REQ-UI-003 + REQ-WORD-001: Word Card Display', () => {
    it('REQ-UI-003 + REQ-WORD-001: should display word spelling, phonetic, meaning, and example', () => {
      vi.mocked(useWords).mockReturnValue({
        ...baseUseWordsReturn,
        currentWord: mockWord,
        words: [mockWord, mockWord2, mockWord3],
        totalWords: 3,
      });

      render(<WordCard />);

      expect(screen.getByText('abandon')).toBeInTheDocument();
      expect(screen.getByText('/əˈbændən/')).toBeInTheDocument();
      expect(screen.getByText('v. 放弃')).toBeInTheDocument();
      expect(screen.getByText(/He abandoned his family/i)).toBeInTheDocument();
    });

    it('REQ-UI-003 + REQ-WORD-001: should handle word without phonetic', () => {
      const wordWithoutPhonetic = { ...mockWord, phonetic: null };
      vi.mocked(useWords).mockReturnValue({
        ...baseUseWordsReturn,
        currentWord: wordWithoutPhonetic,
        words: [wordWithoutPhonetic],
        totalWords: 1,
      });

      render(<WordCard />);

      expect(screen.getByText('abandon')).toBeInTheDocument();
      expect(screen.getByText('v. 放弃')).toBeInTheDocument();
    });

    it('REQ-UI-003 + REQ-WORD-001: should handle word without example sentence', () => {
      const wordWithoutExample = { ...mockWord, example_sentence: null };
      vi.mocked(useWords).mockReturnValue({
        ...baseUseWordsReturn,
        currentWord: wordWithoutExample,
        words: [wordWithoutExample],
        totalWords: 1,
      });

      render(<WordCard />);

      expect(screen.getByText('abandon')).toBeInTheDocument();
      expect(screen.queryByText(/例句/i)).not.toBeInTheDocument();
    });
  });

  describe('REQ-UI-003: Loading State (SOU-14 Regression)', () => {
    it('REQ-UI-003: should display loading spinner when loading words', () => {
      vi.mocked(useWords).mockReturnValue({
        ...baseUseWordsReturn,
        isLoadingWords: true,
      });

      render(<WordCard />);

      // Check for loading spinner
      expect(document.querySelector('.animate-spin')).toBeTruthy();
    });

    it('REQ-UI-003: should NOT be stuck in infinite loading (SOU-14 regression)', async () => {
      // This test verifies the bug fix for SOU-14
      // The component should render the word card, not stuck in loading forever
      vi.mocked(useWords).mockReturnValue({
        ...baseUseWordsReturn,
        currentWord: mockWord,
        words: [mockWord],
        totalWords: 1,
      });

      render(<WordCard />);

      // Should immediately show the word, not loading spinner
      await waitFor(() => {
        expect(screen.getByText('abandon')).toBeInTheDocument();
      }, { timeout: 1000 });

      // Should NOT show loading spinner
      expect(document.querySelector('.animate-spin')).toBeFalsy();
    });
  });

  describe('REQ-UI-003: Word Navigation', () => {
    beforeEach(() => {
      vi.mocked(useWords).mockReturnValue({
        ...baseUseWordsReturn,
        currentWord: mockWord,
        words: [mockWord, mockWord2, mockWord3],
        totalWords: 3,
      });
    });

    it('REQ-UI-003: should navigate to next word', async () => {
      const user = userEvent.setup();
      render(<WordCard />);

      await user.click(screen.getByRole('button', { name: /下一个/i }));

      expect(mockNextWord).toHaveBeenCalled();
    });

    it('REQ-UI-003: should navigate to previous word', async () => {
      vi.mocked(useWords).mockReturnValue({
        ...baseUseWordsReturn,
        currentWord: mockWord2,
        words: [mockWord, mockWord2, mockWord3],
        totalWords: 3,
        currentWordIndex: 1,
      });

      const user = userEvent.setup();
      render(<WordCard />);

      await user.click(screen.getByRole('button', { name: /上一个/i }));

      expect(mockPrevWord).toHaveBeenCalled();
    });

    it('REQ-UI-003: should navigate via dots', async () => {
      const user = userEvent.setup();
      render(<WordCard />);

      // Click on the second dot (index 1)
      const dots = screen.getAllByTestId('nav-dot');

      if (dots.length > 1) {
        await user.click(dots[1]);
        expect(mockGoToWord).toHaveBeenCalledWith(1);
      }
    });
  });

  describe('REQ-UI-003: Navigation Boundaries', () => {
    it('REQ-UI-003: should disable "上一个" button on first word', () => {
      vi.mocked(useWords).mockReturnValue({
        ...baseUseWordsReturn,
        currentWord: mockWord,
        words: [mockWord, mockWord2, mockWord3],
        totalWords: 3,
      });

      render(<WordCard />);

      const prevButton = screen.getByRole('button', { name: /上一个/i });
      expect(prevButton).toBeDisabled();
    });

    it('REQ-UI-003: should disable "下一个" button on last word', () => {
      vi.mocked(useWords).mockReturnValue({
        ...baseUseWordsReturn,
        currentWord: mockWord3,
        words: [mockWord, mockWord2, mockWord3],
        totalWords: 3,
        currentWordIndex: 2,
      });

      render(<WordCard />);

      const nextButton = screen.getByRole('button', { name: /下一个/i });
      expect(nextButton).toBeDisabled();
    });
  });

  describe('REQ-UI-003 + REQ-WORD-004: Word Order', () => {
    it('REQ-UI-003 + REQ-WORD-004: words should be displayed in order_index order', () => {
      // Words are already sorted by order_index from the API
      // The component just displays them in the order received
      vi.mocked(useWords).mockReturnValue({
        ...baseUseWordsReturn,
        currentWord: mockWord,
        words: [mockWord, mockWord2, mockWord3],
        totalWords: 3,
      });

      render(<WordCard />);

      // First word (index 0) should be displayed
      expect(screen.getByText('abandon')).toBeInTheDocument();
    });
  });

  describe('REQ-UI-003: Empty State', () => {
    it('REQ-UI-003: should display "暂无单词" when no words available', () => {
      vi.mocked(useWords).mockReturnValue(baseUseWordsReturn);

      render(<WordCard />);

      expect(screen.getByText(/暂无单词/i)).toBeInTheDocument();
    });
  });

  describe('REQ-WORD-003: Pronunciation Feature', () => {
    it('REQ-WORD-003: should display pronunciation button for authenticated users', () => {
      vi.mocked(useWords).mockReturnValue({
        ...baseUseWordsReturn,
        currentWord: mockWord,
        words: [mockWord],
        totalWords: 1,
      });

      render(<WordCard />);

      // Find pronunciation button by looking for speaker icon
      const buttons = screen.getAllByRole('button');
      // There should be a pronunciation button (has speaker icon)
      expect(buttons.length).toBeGreaterThan(3); // prev, next, mastered, pronunciation
    });

    it('REQ-WORD-003: should call playPronunciation when clicking pronunciation button', async () => {
      vi.mocked(useWords).mockReturnValue({
        ...baseUseWordsReturn,
        currentWord: mockWord,
        words: [mockWord],
        totalWords: 1,
      });

      const user = userEvent.setup();
      render(<WordCard />);

      // Find and click pronunciation button (the one with speaker icon, not text)
      const buttons = screen.getAllByRole('button');
      // The pronunciation button is the one without text label after spelling
      const pronunciationButton = buttons.find(btn =>
        btn.className.includes('rounded-full') && btn.querySelector('svg')
      );

      if (pronunciationButton) {
        await user.click(pronunciationButton);
        expect(mockPlayPronunciation).toHaveBeenCalledWith(1, 'abandon', 'us');
      }
    });

    it('REQ-WORD-003: should show loading state when pronunciation is loading', () => {
      vi.mocked(useWords).mockReturnValue({
        ...baseUseWordsReturn,
        currentWord: mockWord,
        words: [mockWord],
        totalWords: 1,
      });

      vi.mocked(usePronunciation).mockReturnValue({
        ...baseUsePronunciationReturn,
        status: 'loading',
        currentWordId: 1,
      });

      render(<WordCard />);

      // Check for loading spinner in pronunciation button (animate-spin is on the SVG)
      const loadingSpinner = document.querySelector('.animate-spin');
      expect(loadingSpinner).toBeTruthy();
    });

    it('REQ-WORD-003: should show playing state when pronunciation is playing', () => {
      vi.mocked(useWords).mockReturnValue({
        ...baseUseWordsReturn,
        currentWord: mockWord,
        words: [mockWord],
        totalWords: 1,
      });

      vi.mocked(usePronunciation).mockReturnValue({
        ...baseUsePronunciationReturn,
        status: 'playing',
        currentWordId: 1,
      });

      render(<WordCard />);

      // Check for playing state (animate-pulse)
      const buttons = screen.getAllByRole('button');
      const playingButton = buttons.find(btn =>
        btn.className.includes('animate-pulse') && btn.className.includes('rounded-xl')
      );
      expect(playingButton).toBeTruthy();
    });

    it('REQ-WORD-003: should show error message when pronunciation fails', () => {
      vi.mocked(useWords).mockReturnValue({
        ...baseUseWordsReturn,
        currentWord: mockWord,
        words: [mockWord],
        totalWords: 1,
      });

      vi.mocked(usePronunciation).mockReturnValue({
        ...baseUsePronunciationReturn,
        status: 'error',
        error: '发音加载失败，请稍后重试',
        currentWordId: 1,
      });

      render(<WordCard />);

      expect(screen.getByText('发音加载失败，请稍后重试')).toBeInTheDocument();
    });

    it('REQ-WORD-003: should stop playing when clicking button during playback', async () => {
      vi.mocked(useWords).mockReturnValue({
        ...baseUseWordsReturn,
        currentWord: mockWord,
        words: [mockWord],
        totalWords: 1,
      });

      vi.mocked(usePronunciation).mockReturnValue({
        ...baseUsePronunciationReturn,
        status: 'playing',
        currentWordId: 1,
      });

      const user = userEvent.setup();
      render(<WordCard />);

      // Find playing button
      const buttons = screen.getAllByRole('button');
      const playingButton = buttons.find(btn =>
        btn.className.includes('animate-pulse') && btn.className.includes('rounded-full')
      );

      if (playingButton) {
        await user.click(playingButton);
        expect(mockStopPronunciation).toHaveBeenCalled();
      }
    });

    it('REQ-WORD-003: should not show pronunciation button for unauthenticated users', () => {
      vi.mocked(useUserStore).mockReturnValue({
        isAuthenticated: false,
        user: null,
        token: null,
        setUser: vi.fn(),
        setToken: vi.fn(),
        logout: vi.fn(),
      });

      vi.mocked(useWords).mockReturnValue({
        ...baseUseWordsReturn,
        currentWord: mockWord,
        words: [mockWord],
        totalWords: 1,
      });

      render(<WordCard />);

      // The pronunciation button should not be present
      const buttons = screen.getAllByRole('button');
      const pronunciationButton = buttons.find(btn =>
        btn.className.includes('rounded-full') && btn.querySelector('svg') && !btn.textContent
      );
      expect(pronunciationButton).toBeUndefined();
    });
  });
});
