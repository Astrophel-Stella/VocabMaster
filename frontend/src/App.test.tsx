/**
 * App Integration Tests - REQ-WB-002 学习卡片展示 + REQ-UI-001~004 全链路测试
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
  getProgressOverview: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  getCurrentUser: vi.fn(),
  markWordMastered: vi.fn(),
  unmarkWordMastered: vi.fn(),
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

describe('App Integration - Full User Flow', () => {
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

  describe('REQ-UI-001: Login Flow', () => {
    it('REQ-UI-001: should show login panel when not authenticated', () => {
      render(<App />);

      // Use getAllByRole since there are multiple headings with VocabMaster
      const headings = screen.getAllByRole('heading', { name: /vocabmaster/i });
      expect(headings.length).toBeGreaterThan(0);
      expect(screen.getByRole('button', { name: /登录/i })).toBeInTheDocument();
    });

    it('REQ-UI-001 + REQ-AUTH-003: should login and show word bank selection', async () => {
      const mockToken = { access_token: 'test-token', token_type: 'bearer' };
      const mockUser = { id: 1, username: 'test', email: 'test@example.com', created_at: '2024-01-01' };
      const mockBanks = [{ id: 1, name: '高考英语', description: '高考英语核心词汇', total_words: 3 }];

      vi.mocked(api.login).mockResolvedValueOnce(mockToken);
      vi.mocked(api.getCurrentUser).mockResolvedValueOnce(mockUser);
      vi.mocked(api.getWordBanks).mockResolvedValueOnce(mockBanks);

      const user = userEvent.setup();
      render(<App />);

      const usernameInput = document.querySelector('input[type="text"]') as HTMLInputElement;
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;

      await user.type(usernameInput, 'test');
      await user.type(passwordInput, '123456');
      await user.click(screen.getByRole('button', { name: /登录/i }));

      // Should show word bank selection after successful login
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /选择词库/i })).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('REQ-UI-002: Word Bank Selection Flow', () => {
    it('REQ-UI-002: should show word bank list after login', async () => {
      // Setup authenticated user
      useUserStore.setState({
        token: 'test-token',
        user: { id: 1, username: 'test', email: 'test@example.com', created_at: '2024-01-01' },
        isAuthenticated: true,
      });

      const mockBanks = [
        { id: 1, name: '高考英语', description: '高考英语核心词汇', total_words: 3500 },
      ];

      vi.mocked(api.getWordBanks).mockResolvedValueOnce(mockBanks);

      render(<App />);

      // Wait for the word bank selection screen
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /选择词库/i })).toBeInTheDocument();
      }, { timeout: 5000 });

      // Should show at least one word bank
      expect(screen.getByText('高考英语')).toBeInTheDocument();
    });
  });

  describe('REQ-UI-003: Word Learning Flow', () => {
    it('REQ-UI-003: should show word card after selecting word bank', async () => {
      useUserStore.setState({
        token: 'test-token',
        user: { id: 1, username: 'test', email: 'test@example.com', created_at: '2024-01-01' },
        isAuthenticated: true,
      });

      const mockBanks = [{ id: 1, name: '高考英语', description: '高考英语核心词汇', total_words: 1 }];
      const mockWords = [{ id: 1, spelling: 'abandon', phonetic: '/əˈbændən/', pronunciation_url: null, meaning: 'v. 放弃', example_sentence: 'Test.' }];

      vi.mocked(api.getWordBanks).mockResolvedValueOnce(mockBanks);
      vi.mocked(api.getWords).mockResolvedValueOnce({ words: mockWords, total: 1 });
      vi.mocked(api.getProgress).mockResolvedValueOnce([]);
      vi.mocked(api.getProgressStats).mockResolvedValueOnce({ total_words: 1, mastered_words: 0, progress_percentage: 0 });

      const user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /选择词库/i })).toBeInTheDocument();
      });

      await user.click(screen.getByText('高考英语'));

      await waitFor(() => {
        expect(screen.getByText('abandon')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('REQ-UI-001: Logout Flow', () => {
    it('REQ-UI-001: should return to login page after logout', async () => {
      useUserStore.setState({
        token: 'test-token',
        user: { id: 1, username: 'test', email: 'test@example.com', created_at: '2024-01-01' },
        isAuthenticated: true,
      });

      const mockBanks = [{ id: 1, name: '高考英语', description: '高考英语核心词汇', total_words: 1 }];
      vi.mocked(api.getWordBanks).mockResolvedValueOnce(mockBanks);

      const user = userEvent.setup();
      render(<App />);

      // Wait for the username to appear (the new UI shows username + "欢迎回来")
      await waitFor(() => {
        expect(screen.getByText('test')).toBeInTheDocument();
      });

      // Click logout button
      await user.click(screen.getByRole('button', { name: /退出/i }));

      // Should show login panel again - use getAllByRole since there are multiple headings
      await waitFor(() => {
        const headings = screen.getAllByRole('heading', { name: /vocabmaster/i });
        expect(headings.length).toBeGreaterThan(0);
      });
    });
  });

  describe('REQ-AUTH-005: Session Persistence', () => {
    it('REQ-AUTH-005: should maintain login state after refresh (Zustand persist)', async () => {
      // Simulate user already logged in with persisted state
      useUserStore.setState({
        token: 'persisted-token',
        user: { id: 1, username: 'test', email: 'test@example.com', created_at: '2024-01-01' },
        isAuthenticated: true,
      });

      const mockBanks = [{ id: 1, name: '高考英语', description: '高考英语核心词汇', total_words: 1 }];
      vi.mocked(api.getWordBanks).mockResolvedValueOnce(mockBanks);

      render(<App />);

      // Should NOT show login panel (already authenticated)
      // The new UI shows the username + "欢迎回来"
      await waitFor(() => {
        expect(screen.getByText('test')).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /登录/i })).not.toBeInTheDocument();
    });
  });
});
