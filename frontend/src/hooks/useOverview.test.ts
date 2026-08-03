/**
 * useOverview Hook Tests - REQ-UI-005 首页整体学习进度概览
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOverview } from './useOverview';
import { useUserStore } from '../stores/userStore';
import * as api from '../lib/api';

// Mock the api module
vi.mock('../lib/api', () => ({
  getProgressOverview: vi.fn(),
}));

// Mock the adapters module (imported transitively by api)
vi.mock('../adapters', () => ({
  apiFetch: vi.fn(),
}));

const mockOverview = {
  total_words: 10000,
  mastered_words: 2500,
  progress_percentage: 25,
  total_banks: 3,
};

describe('useOverview Hook - REQ-UI-005', () => {
  beforeEach(() => {
    useUserStore.setState({
      user: { id: 1, username: 'test', email: 'test@example.com', created_at: '2024-01-01T00:00:00Z' },
      token: 'test-token',
      isAuthenticated: true,
    });
    vi.clearAllMocks();
  });

  it('REQ-UI-005: loads the aggregate overview when a token is present', async () => {
    vi.mocked(api.getProgressOverview).mockResolvedValueOnce(mockOverview);

    const { result } = renderHook(() => useOverview());

    await waitFor(() => {
      expect(result.current.overview).toEqual(mockOverview);
    });

    expect(api.getProgressOverview).toHaveBeenCalledWith('test-token');
    expect(result.current.error).toBeNull();
  });

  it('REQ-UI-005: does not call the API and keeps overview null when unauthenticated', async () => {
    useUserStore.setState({ user: null, token: null, isAuthenticated: false });

    const { result } = renderHook(() => useOverview());

    // Give the effect a chance to run
    await act(async () => {
      await Promise.resolve();
    });

    expect(api.getProgressOverview).not.toHaveBeenCalled();
    expect(result.current.overview).toBeNull();
  });

  it('REQ-UI-005: surfaces an error without throwing when the request fails', async () => {
    vi.mocked(api.getProgressOverview).mockRejectedValueOnce(new Error('boom'));

    const { result } = renderHook(() => useOverview());

    await waitFor(() => {
      expect(result.current.error).toBe('boom');
    });

    expect(result.current.overview).toBeNull();
  });

  it('REQ-UI-005: loadOverview can refresh the overview on demand', async () => {
    vi.mocked(api.getProgressOverview)
      .mockResolvedValueOnce(mockOverview)
      .mockResolvedValueOnce({ ...mockOverview, mastered_words: 3000, progress_percentage: 30 });

    const { result } = renderHook(() => useOverview());

    await waitFor(() => {
      expect(result.current.overview?.mastered_words).toBe(2500);
    });

    await act(async () => {
      await result.current.loadOverview();
    });

    expect(result.current.overview?.mastered_words).toBe(3000);
    expect(result.current.overview?.progress_percentage).toBe(30);
  });
});
