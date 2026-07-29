/**
 * useAuth Hook Tests - REQ-AUTH series
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';
import { useUserStore } from '../stores/userStore';
import * as api from '../lib/api';

// Mock the api module
vi.mock('../lib/api', () => ({
  register: vi.fn(),
  login: vi.fn(),
  getCurrentUser: vi.fn(),
}));

// Mock the adapters module
vi.mock('../adapters', () => ({
  apiFetch: vi.fn(),
}));

describe('useAuth Hook', () => {
  beforeEach(() => {
    // Reset store state before each test
    useUserStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
    vi.clearAllMocks();
  });

  describe('REQ-AUTH-001: User Registration', () => {
    it('REQ-AUTH-001: should register a new user successfully', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(api.register).mockResolvedValueOnce(mockUser);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const user = await result.current.register('testuser', 'test@example.com', 'password123');
        expect(user).toEqual(mockUser);
      });

      expect(api.register).toHaveBeenCalledWith('testuser', 'test@example.com', 'password123');
    });

    it('REQ-AUTH-001: should handle registration failure', async () => {
      vi.mocked(api.register).mockRejectedValueOnce(new Error('Username already registered'));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.register('testuser', 'test@example.com', 'password123');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe('Username already registered');
        }
      });

      expect(result.current.error).toBe('Username already registered');
    });
  });

  describe('REQ-AUTH-003: User Login', () => {
    it('REQ-AUTH-003: should login successfully and store token', async () => {
      const mockToken = { access_token: 'test-token', token_type: 'bearer' };
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(api.login).mockResolvedValueOnce(mockToken);
      vi.mocked(api.getCurrentUser).mockResolvedValueOnce(mockUser);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const user = await result.current.login('testuser', 'password123');
        expect(user).toEqual(mockUser);
      });

      expect(api.login).toHaveBeenCalledWith('testuser', 'password123');
      expect(api.getCurrentUser).toHaveBeenCalledWith('test-token');
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.token).toBe('test-token');
    });

    it('REQ-AUTH-003: should handle login failure', async () => {
      vi.mocked(api.login).mockRejectedValueOnce(new Error('Incorrect username or password'));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.login('testuser', 'wrongpass');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });

      expect(result.current.error).toBe('Incorrect username or password');
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('REQ-AUTH-005: Get Current User', () => {
    it('REQ-AUTH-005: should have user info after login', async () => {
      const mockToken = { access_token: 'test-token', token_type: 'bearer' };
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(api.login).mockResolvedValueOnce(mockToken);
      vi.mocked(api.getCurrentUser).mockResolvedValueOnce(mockUser);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login('testuser', 'password123');
      });

      expect(result.current.user).toEqual(mockUser);
    });
  });

  describe('Logout', () => {
    it('should clear user state on logout', async () => {
      const mockToken = { access_token: 'test-token', token_type: 'bearer' };
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(api.login).mockResolvedValueOnce(mockToken);
      vi.mocked(api.getCurrentUser).mockResolvedValueOnce(mockUser);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login('testuser', 'password123');
      });

      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    });
  });
});
