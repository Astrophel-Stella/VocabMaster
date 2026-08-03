/**
 * WordBankSelect Component Tests - REQ-UI-002 + REQ-WB-001
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WordBankSelect } from './WordBankSelect';
import { useWords } from '../hooks/useWords';

// Import jest-dom matchers
import '@testing-library/jest-dom/vitest';

// Mock the useWords hook
vi.mock('../hooks/useWords', () => ({
  useWords: vi.fn(),
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
  });

  describe('REQ-UI-002: Word Bank List Rendering', () => {
    it('REQ-UI-002 + REQ-WB-001: should render word bank list (高考/四级/考研)', () => {
      const mockBanks = [
        { id: 1, name: '高考英语', description: '高考英语核心词汇', total_words: 3500 },
        { id: 2, name: '大学英语四级', description: 'CET-4 核心词汇', total_words: 3800 },
        { id: 3, name: '考研英语', description: '考研英语核心词汇', total_words: 5500 },
      ];

      vi.mocked(useWords).mockReturnValue({
        ...mockUseWordsReturn,
        wordBanks: mockBanks,
      });

      render(<WordBankSelect />);

      expect(screen.getByRole('heading', { name: /选择词库/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /高考英语/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /大学英语四级/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /考研英语/i })).toBeInTheDocument();
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
});
