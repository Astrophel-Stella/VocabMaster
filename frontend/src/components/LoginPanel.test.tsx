/**
 * LoginPanel Component Tests - REQ-UI-001
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginPanel } from './LoginPanel';
import { useAuth } from '../hooks/useAuth';

// Import jest-dom matchers
import '@testing-library/jest-dom/vitest';

// Mock the useAuth hook
vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('LoginPanel Component - REQ-UI-001', () => {
  const mockLogin = vi.fn();
  const mockRegister = vi.fn();
  const mockClearError = vi.fn();
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      login: mockLogin,
      register: mockRegister,
      isLoading: false,
      error: null,
      clearError: mockClearError,
      logout: mockLogout,
      user: null,
      token: null,
      isAuthenticated: false,
    });
  });

  describe('REQ-UI-001: Form Display and Toggle', () => {
    it('REQ-UI-001: should display login form by default', () => {
      render(<LoginPanel />);

      expect(screen.getByRole('heading', { name: /vocabmaster/i })).toBeInTheDocument();
      expect(screen.getByText(/用户名/i)).toBeInTheDocument();
      expect(screen.getByText(/密码/i)).toBeInTheDocument();
      expect(screen.queryByText(/邮箱/i)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /登录/i })).toBeInTheDocument();
    });

    it('REQ-UI-001: should toggle to register form when clicking register link', async () => {
      const user = userEvent.setup();
      render(<LoginPanel />);

      // Click "没有账号？点击注册"
      await user.click(screen.getByText(/没有账号.*注册/i));

      // Now should show email field
      expect(screen.getByText(/邮箱/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /注册/i })).toBeInTheDocument();
      expect(screen.getByText(/已有账号.*登录/i)).toBeInTheDocument();
    });

    it('REQ-UI-001: should toggle back to login form from register', async () => {
      const user = userEvent.setup();
      render(<LoginPanel />);

      // Switch to register
      await user.click(screen.getByText(/没有账号.*注册/i));
      expect(screen.getByText(/邮箱/i)).toBeInTheDocument();

      // Switch back to login
      await user.click(screen.getByText(/已有账号.*登录/i));
      expect(screen.queryByText(/邮箱/i)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /登录/i })).toBeInTheDocument();
    });
  });

  describe('REQ-UI-001: Input Validation', () => {
    it('REQ-UI-001: should have password minLength=6 attribute', () => {
      render(<LoginPanel />);

      // Find password input by type attribute
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
      expect(passwordInput).toBeTruthy();
      expect(passwordInput).toHaveAttribute('minLength', '6');
    });

    it('REQ-UI-001: should have required fields', () => {
      render(<LoginPanel />);

      // Find inputs by their type
      const textInputs = document.querySelectorAll('input[type="text"]');
      const passwordInputs = document.querySelectorAll('input[type="password"]');

      expect(textInputs.length).toBeGreaterThan(0);
      expect(passwordInputs.length).toBeGreaterThan(0);

      textInputs.forEach(input => {
        expect(input).toBeRequired();
      });
      passwordInputs.forEach(input => {
        expect(input).toBeRequired();
      });
    });

    it('REQ-UI-001: should have required email field in register mode', async () => {
      const user = userEvent.setup();
      render(<LoginPanel />);

      await user.click(screen.getByText(/没有账号.*注册/i));

      const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
      expect(emailInput).toBeTruthy();
      expect(emailInput).toBeRequired();
    });
  });

  describe('REQ-UI-001 + REQ-AUTH-003: Login Flow', () => {
    it('REQ-UI-001: should call login with correct credentials on submit', async () => {
      const mockUser = {
        id: 1,
        username: 'test',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      };
      mockLogin.mockResolvedValueOnce(mockUser);

      const user = userEvent.setup();
      render(<LoginPanel />);

      // Find inputs by type
      const usernameInput = document.querySelector('input[type="text"]') as HTMLInputElement;
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;

      await user.type(usernameInput, 'test');
      await user.type(passwordInput, '123456');
      await user.click(screen.getByRole('button', { name: /登录/i }));

      expect(mockLogin).toHaveBeenCalledWith('test', '123456');
      expect(mockClearError).toHaveBeenCalled();
    });

    it('REQ-UI-001 + REQ-AUTH-004: should display "用户名或密码错误" on 401 error', async () => {
      mockLogin.mockRejectedValueOnce(new Error('用户名或密码错误'));

      vi.mocked(useAuth).mockReturnValue({
        login: mockLogin,
        register: mockRegister,
        isLoading: false,
        error: '用户名或密码错误',
        clearError: mockClearError,
        logout: mockLogout,
        user: null,
        token: null,
        isAuthenticated: false,
      });

      const user = userEvent.setup();
      render(<LoginPanel />);

      const usernameInput = document.querySelector('input[type="text"]') as HTMLInputElement;
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;

      await user.type(usernameInput, 'wrong');
      await user.type(passwordInput, 'wrong');
      await user.click(screen.getByRole('button', { name: /登录/i }));

      await waitFor(() => {
        expect(screen.getByText(/用户名或密码错误/i)).toBeInTheDocument();
      });
    });

    it('REQ-UI-001 + REQ-AUTH: should distinguish network failure from auth failure', async () => {
      mockLogin.mockRejectedValueOnce(new Error('无法连接到服务器，请检查后端是否正常运行'));

      vi.mocked(useAuth).mockReturnValue({
        login: mockLogin,
        register: mockRegister,
        isLoading: false,
        error: '无法连接到服务器，请检查后端是否正常运行',
        clearError: mockClearError,
        logout: mockLogout,
        user: null,
        token: null,
        isAuthenticated: false,
      });

      const user = userEvent.setup();
      render(<LoginPanel />);

      const usernameInput = document.querySelector('input[type="text"]') as HTMLInputElement;
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;

      await user.type(usernameInput, 'test');
      await user.type(passwordInput, '123456');
      await user.click(screen.getByRole('button', { name: /登录/i }));

      await waitFor(() => {
        expect(screen.getByText(/无法连接到服务器/i)).toBeInTheDocument();
      });
    });
  });

  describe('REQ-UI-001 + REQ-AUTH-001: Registration Flow', () => {
    it('REQ-UI-001: should call register with correct data on submit', async () => {
      mockRegister.mockResolvedValueOnce({
        id: 2,
        username: 'newuser',
        email: 'new@example.com',
        created_at: '2024-01-01T00:00:00Z',
      });
      mockLogin.mockResolvedValueOnce({
        id: 2,
        username: 'newuser',
        email: 'new@example.com',
        created_at: '2024-01-01T00:00:00Z',
      });

      const user = userEvent.setup();
      render(<LoginPanel />);

      // Switch to register mode
      await user.click(screen.getByText(/没有账号.*注册/i));

      const usernameInput = document.querySelector('input[type="text"]') as HTMLInputElement;
      const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;

      await user.type(usernameInput, 'newuser');
      await user.type(emailInput, 'new@example.com');
      await user.type(passwordInput, '123456');
      await user.click(screen.getByRole('button', { name: /注册/i }));

      expect(mockRegister).toHaveBeenCalledWith('newuser', 'new@example.com', '123456');
    });

    it('REQ-UI-001 + REQ-AUTH-002: should display duplicate username error (400)', async () => {
      mockRegister.mockRejectedValueOnce(new Error('Username already registered'));

      vi.mocked(useAuth).mockReturnValue({
        login: mockLogin,
        register: mockRegister,
        isLoading: false,
        error: 'Username already registered',
        clearError: mockClearError,
        logout: mockLogout,
        user: null,
        token: null,
        isAuthenticated: false,
      });

      const user = userEvent.setup();
      render(<LoginPanel />);

      await user.click(screen.getByText(/没有账号.*注册/i));

      const usernameInput = document.querySelector('input[type="text"]') as HTMLInputElement;
      const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;

      await user.type(usernameInput, 'test');
      await user.type(emailInput, 'test2@example.com');
      await user.type(passwordInput, '123456');
      await user.click(screen.getByRole('button', { name: /注册/i }));

      await waitFor(() => {
        expect(screen.getByText(/username already registered/i)).toBeInTheDocument();
      });
    });

    it('REQ-UI-001: should display duplicate email error (400)', async () => {
      mockRegister.mockRejectedValueOnce(new Error('Email already registered'));

      vi.mocked(useAuth).mockReturnValue({
        login: mockLogin,
        register: mockRegister,
        isLoading: false,
        error: 'Email already registered',
        clearError: mockClearError,
        logout: mockLogout,
        user: null,
        token: null,
        isAuthenticated: false,
      });

      const user = userEvent.setup();
      render(<LoginPanel />);

      await user.click(screen.getByText(/没有账号.*注册/i));

      const usernameInput = document.querySelector('input[type="text"]') as HTMLInputElement;
      const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;

      await user.type(usernameInput, 'newuser');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, '123456');
      await user.click(screen.getByRole('button', { name: /注册/i }));

      await waitFor(() => {
        expect(screen.getByText(/email already registered/i)).toBeInTheDocument();
      });
    });
  });

  describe('REQ-UI-001: Loading State', () => {
    it('REQ-UI-001: should disable form when loading', () => {
      vi.mocked(useAuth).mockReturnValue({
        login: mockLogin,
        register: mockRegister,
        isLoading: true,
        error: null,
        clearError: mockClearError,
        logout: mockLogout,
        user: null,
        token: null,
        isAuthenticated: false,
      });

      render(<LoginPanel />);

      const usernameInput = document.querySelector('input[type="text"]') as HTMLInputElement;
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;

      expect(usernameInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(screen.getByRole('button', { name: /处理中/i })).toBeDisabled();
    });

    it('REQ-UI-001: should show "处理中..." when loading', () => {
      vi.mocked(useAuth).mockReturnValue({
        login: mockLogin,
        register: mockRegister,
        isLoading: true,
        error: null,
        clearError: mockClearError,
        logout: mockLogout,
        user: null,
        token: null,
        isAuthenticated: false,
      });

      render(<LoginPanel />);

      expect(screen.getByRole('button', { name: /处理中/i })).toBeInTheDocument();
    });
  });

  describe('REQ-UI-001: Test Account Hint', () => {
    it('REQ-UI-001: should display test account hint', () => {
      render(<LoginPanel />);

      expect(screen.getByText(/测试账号/i)).toBeInTheDocument();
      expect(screen.getByText(/test.*123456/i)).toBeInTheDocument();
    });
  });
});
