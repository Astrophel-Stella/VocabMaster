/**
 * App Integration Tests - REQ-WB-002 学习卡片展示
 *
 * Tests the full flow: login -> select word bank -> word card appears (not infinite spinner)
 * This test is specifically designed to catch the useEffect infinite loop bug.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { useUserStore } from './stores/userStore';
import { useWordStore } from './stores/wordStore';
import * as api from './lib/api';

// Import jest-dom matchers
import '@testing-library/jest-dom/vitest';

// Mock the api module
vi.mock('./lib/api', () => ({
  getWordBanks: vi.fn(),
  getWords: vi.fn(),
  getProgress: vi.fn(),
  getProgressStats: vi.fn(),
}));

// Mock the adapters module
vi.mock('./adapters', () => ({
  apiFetch: vi.fn(),
  getAdapter: vi.fn(() => ({ name: 'web' })),
}));

describe('App Integration - REQ-WB-002: Word Card Display', () => {
  beforeEach(() => {
    // Reset stores before each test
    useUserStore.setState({
      token: null,
      user: null,
      isAuthenticated: false,
    });

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

  afterEach(() => {
    vi.useRealTimers();
  });

  it('REQ-WB-002: should display word card after selecting a word bank (no infinite loading)', async () => {
    // Setup: mock user is authenticated
    useUserStore.setState({
      token: 'test-token',
      user: { id: 1, username: 'test', email: 'test@test.com', created_at: '2024-01-01' },
      isAuthenticated: true,
    });

    // Mock word banks
    const mockBanks = [
      { id: 1, name: '高考英语', description: '高考英语核心词汇', total_words: 3 },
    ];
    vi.mocked(api.getWordBanks).mockResolvedValue(mockBanks);

    // Mock words - this is called multiple times if there's an infinite loop
    const mockWords = [
      {
        id: 1,
        spelling: 'abandon',
        phonetic: '/əˈbændən/',
        pronunciation_url: null,
        meaning: 'v. 放弃',
        example_sentence: 'He abandoned his family.',
      },
    ];
    vi.mocked(api.getWords).mockResolvedValue({ words: mockWords, total: 1 });

    // Mock progress (empty)
    vi.mocked(api.getProgress).mockResolvedValue([]);
    vi.mocked(api.getProgressStats).mockResolvedValue({
      total_words: 1,
      mastered_words: 0,
      progress_percentage: 0,
    });

    const user = userEvent.setup();

    render(<App />);

    // Wait for word banks to load
    await waitFor(() => {
      expect(screen.getByText('高考英语')).toBeInTheDocument();
    }, { timeout: 10000 });

    // Click on the word bank
    const bankButton = screen.getByRole('button', { name: /高考英语/i });
    await user.click(bankButton);

    // CRITICAL: The word should appear in DOM, not stuck in infinite loading
    // This test will FAIL if there's a useEffect infinite loop bug
    await waitFor(
      () => {
        // The word spelling should be visible
        expect(screen.getByText('abandon')).toBeInTheDocument();
      },
      { timeout: 10000 } // Give it 10 seconds - if infinite loop, this will timeout
    );

    // Should also see the meaning
    expect(screen.getByText(/放弃/i)).toBeInTheDocument();

    // Verify getWords was called exactly once (not multiple times due to infinite loop)
    // With infinite loop bug, getWords would be called many times
    // After fix, it should be called once
    expect(api.getWords).toHaveBeenCalledTimes(1);
  });
});
