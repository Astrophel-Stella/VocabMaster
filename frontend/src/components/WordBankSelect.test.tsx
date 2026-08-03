/**
 * WordBankSelect Component Tests - REQ-UI-002 + REQ-WB-001
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WordBankSelect } from './WordBankSelect';
import { useWords } from '../hooks/useWords';
import { useOverview } from '../hooks/useOverview';

// Import jest-dom matchers
import '@testing-library/jest-dom/vitest';

// Mock the useWords hook
vi.mock('../hooks/useWords', () => ({
  useWords: vi.fn(),
}));

// Mock the useOverview hook (REQ-UI-005 Hero overview)
vi.mock('../hooks/useOverview', () => ({
  useOverview: vi.fn(),
}));

describe('WordBankSelect Component - REQ-UI-002', () => {
  const mockSelectWordBank = vi.fn();

  const mockUseWordsReturn = {
    wordBanks: [],
    isLoadingBanks: false,
    error: null,
    selectWordBank: mockSelectWordBank,
    selectedWordBank: null,
    words: [],
    currentWord: null as any,
    currentWordIndex: 0,
    totalWords: 0,
    isLoadingWords: false,
    loadWords: vi.fn(),
    nextWord: vi.fn(),
    prevWord: vi.fn(),
    goToWord: vi.fn(),
    reset: vi.fn(),
    clearError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no aggregate overview loaded (component falls back to bank-derived stats)
    vi.mocked(useOverview).mockReturnValue({
      overview: null,
      isLoading: false,
      error: null,
      loadOverview: vi.fn(),
    });
  });

  describe('REQ-UI-002: Word Bank List Rendering', () => {
    it('REQ-UI-002 + REQ-WB-001: should render word bank list (高考/考研/生活英语)', () => {
      const mockBanks = [
        { id: 1, name: '高考英语', description: '高考英语核心词汇', total_words: 3500 },
        { id: 2, name: '考研英语', description: '考研英语核心词汇', total_words: 5500 },
        { id: 3, name: '生活英语', description: '日常生活英语词汇', total_words: 1000 },
      ];

      vi.mocked(useWords).mockReturnValue({
        ...mockUseWordsReturn,
        wordBanks: mockBanks,
      });

      render(<WordBankSelect />);

      expect(screen.getByRole('heading', { name: /选择词库/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /高考英语/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /考研英语/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /生活英语/i })).toBeInTheDocument();
    });

    it('REQ-UI-002 + REQ-WB-001: should display word bank details', () => {
      const mockBanks = [
        { id: 1, name: '高考英语', description: '高考英语核心词汇', total_words: 3500 },
      ];

      vi.mocked(useWords).mockReturnValue({
        ...mockUseWordsReturn,
        wordBanks: mockBanks,
      });

      render(<WordBankSelect />);

      expect(screen.getByText('高考英语核心词汇')).toBeInTheDocument();
      expect(screen.getByText(/3500.*词/i)).toBeInTheDocument();
    });
  });

  describe('REQ-UI-002: Word Bank Selection', () => {
    it('REQ-UI-002: should call selectWordBank when clicking a word bank', async () => {
      const mockBanks = [
        { id: 1, name: '高考英语', description: '高考英语核心词汇', total_words: 3500 },
      ];

      vi.mocked(useWords).mockReturnValue({
        ...mockUseWordsReturn,
        wordBanks: mockBanks,
      });

      const user = userEvent.setup();
      render(<WordBankSelect />);

      await user.click(screen.getByRole('button', { name: /高考英语/i }));

      expect(mockSelectWordBank).toHaveBeenCalledWith(mockBanks[0]);
    });
  });

  describe('REQ-UI-002: Loading State', () => {
    it('REQ-UI-002: should display loading spinner when loading', () => {
      vi.mocked(useWords).mockReturnValue({
        ...mockUseWordsReturn,
        isLoadingBanks: true,
      });

      render(<WordBankSelect />);

      // Check for loading spinner
      expect(document.querySelector('.animate-spin')).toBeTruthy();
      expect(screen.getByText(/加载词库中/i)).toBeInTheDocument();
    });
  });

  describe('REQ-UI-002: Error State', () => {
    it('REQ-UI-002: should display error message when loading fails', () => {
      vi.mocked(useWords).mockReturnValue({
        ...mockUseWordsReturn,
        error: 'Failed to load word banks',
      });

      render(<WordBankSelect />);

      expect(screen.getByText(/Failed to load word banks/i)).toBeInTheDocument();
    });
  });

  describe('REQ-UI-002: Empty State', () => {
    it('REQ-UI-002: should handle empty word bank list', () => {
      vi.mocked(useWords).mockReturnValue(mockUseWordsReturn);

      render(<WordBankSelect />);

      // No buttons rendered
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('REQ-UI-005: Hero + Overall Progress Overview', () => {
    const mockBanks = [
      { id: 1, name: '高考英语', description: '高考英语核心词汇', total_words: 3500 },
      { id: 2, name: '考研英语', description: '考研英语核心词汇', total_words: 5500 },
    ];

    it('REQ-UI-005: renders the Hero brand section and progress overview panel', () => {
      vi.mocked(useWords).mockReturnValue({ ...mockUseWordsReturn, wordBanks: mockBanks });

      render(<WordBankSelect />);

      expect(screen.getByRole('heading', { name: /继续你的单词之旅/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /整体学习进度/i })).toBeInTheDocument();
      // Grid section heading is still present (contract with existing tests)
      expect(screen.getByRole('heading', { name: /选择词库/i })).toBeInTheDocument();
    });

    it('REQ-UI-005: reflects aggregate overview stats in the progress bar', () => {
      vi.mocked(useWords).mockReturnValue({ ...mockUseWordsReturn, wordBanks: mockBanks });
      vi.mocked(useOverview).mockReturnValue({
        overview: { total_words: 9000, mastered_words: 2250, progress_percentage: 25, total_banks: 2 },
        isLoading: false,
        error: null,
        loadOverview: vi.fn(),
      });

      render(<WordBankSelect />);

      const progressbar = screen.getByRole('progressbar', { name: /整体学习进度/i });
      expect(progressbar).toHaveAttribute('aria-valuenow', '25');
      expect(progressbar).toHaveAttribute('aria-valuemax', '100');
      expect(screen.getByText('25%')).toBeInTheDocument();
      // "已掌握 2,250 / 9,000 个单词"
      expect(screen.getByText(/个单词$/)).toBeInTheDocument();
    });

    it('REQ-UI-005: falls back to bank-derived totals when no overview is loaded', () => {
      vi.mocked(useWords).mockReturnValue({ ...mockUseWordsReturn, wordBanks: mockBanks });
      // useOverview default (null) is set in beforeEach

      render(<WordBankSelect />);

      // With no overview, mastery is 0% but total words are summed from the banks (3500 + 5500)
      const progressbar = screen.getByRole('progressbar', { name: /整体学习进度/i });
      expect(progressbar).toHaveAttribute('aria-valuenow', '0');
    });

    it('REQ-UI-005: word bank cards expose an accessible "开始学习" call to action', () => {
      vi.mocked(useWords).mockReturnValue({ ...mockUseWordsReturn, wordBanks: mockBanks });

      render(<WordBankSelect />);

      // CTA text present on each card
      expect(screen.getAllByText('开始学习')).toHaveLength(mockBanks.length);
      // Cards are native buttons (keyboard reachable) and named by bank
      expect(screen.getByRole('button', { name: /高考英语/i })).toBeInTheDocument();
    });
  });
});
