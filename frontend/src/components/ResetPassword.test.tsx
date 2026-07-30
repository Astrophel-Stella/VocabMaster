/**
 * ResetPassword.test.tsx - 重置密码页面测试
 * REQ-AUTH-007: 忘记密码功能
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResetPassword } from './ResetPassword';

// Import jest-dom matchers
import '@testing-library/jest-dom/vitest';

// Mock the hook
vi.mock('../hooks/useForgotPassword', () => ({
  useResetPassword: vi.fn(() => ({
    resetPassword: vi.fn(),
    isLoading: false,
    error: null,
    success: false,
    clearError: vi.fn(),
  })),
}));

import { useResetPassword } from '../hooks/useForgotPassword';

const mockResetPassword = vi.fn();
const mockClearError = vi.fn();

describe('ResetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useResetPassword).mockReturnValue({
      resetPassword: mockResetPassword,
      isLoading: false,
      error: null,
      success: false,
      clearError: mockClearError,
    });
  });

  it('REQ-AUTH-007: 应渲染重置密码表单', () => {
    render(<ResetPassword token="test-token" />);

    expect(screen.getByText('🔐 重置密码')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入新密码')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请再次输入新密码')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /重置密码/ })).toBeInTheDocument();
  });

  it('REQ-AUTH-007: 输入密码后应显示强度指示器', () => {
    render(<ResetPassword token="test-token" />);

    const passwordInput = screen.getByPlaceholderText('请输入新密码');
    fireEvent.change(passwordInput, { target: { value: 'Weak' } });

    expect(screen.getByText(/密码强度/)).toBeInTheDocument();
  });

  it('REQ-AUTH-007: 密码不匹配应显示错误', async () => {
    render(<ResetPassword token="test-token" />);

    const passwordInput = screen.getByPlaceholderText('请输入新密码');
    const confirmInput = screen.getByPlaceholderText('请再次输入新密码');
    const submitButton = screen.getByRole('button', { name: /重置密码/ });

    fireEvent.change(passwordInput, { target: { value: 'StrongPassword123' } });
    fireEvent.change(confirmInput, { target: { value: 'DifferentPassword123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('两次密码输入不一致')).toBeInTheDocument();
    });
  });

  it('REQ-AUTH-007: 弱密码应显示错误', async () => {
    render(<ResetPassword token="test-token" />);

    const passwordInput = screen.getByPlaceholderText('请输入新密码');
    const confirmInput = screen.getByPlaceholderText('请再次输入新密码');
    const submitButton = screen.getByRole('button', { name: /重置密码/ });

    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    fireEvent.change(confirmInput, { target: { value: 'weak' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/密码长度至少8个字符/)).toBeInTheDocument();
    });
  });

  it('REQ-AUTH-007: 有效密码应调用resetPassword', async () => {
    mockResetPassword.mockResolvedValueOnce(undefined);
    render(<ResetPassword token="test-token" />);

    const passwordInput = screen.getByPlaceholderText('请输入新密码');
    const confirmInput = screen.getByPlaceholderText('请再次输入新密码');
    const submitButton = screen.getByRole('button', { name: /重置密码/ });

    fireEvent.change(passwordInput, { target: { value: 'StrongPassword123' } });
    fireEvent.change(confirmInput, { target: { value: 'StrongPassword123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('test-token', 'StrongPassword123');
    });
  });

  it('REQ-AUTH-007: 成功后应显示成功消息', () => {
    vi.mocked(useResetPassword).mockReturnValue({
      resetPassword: mockResetPassword,
      isLoading: false,
      error: null,
      success: true,
      clearError: mockClearError,
    });

    render(<ResetPassword token="test-token" />);

    expect(screen.getByText('密码重置成功')).toBeInTheDocument();
    expect(screen.getByText(/请使用新密码登录/)).toBeInTheDocument();
  });

  it('REQ-AUTH-007: 错误时应显示错误信息', () => {
    vi.mocked(useResetPassword).mockReturnValue({
      resetPassword: mockResetPassword,
      isLoading: false,
      error: '链接已失效',
      success: false,
      clearError: mockClearError,
    });

    render(<ResetPassword token="test-token" />);

    expect(screen.getByText('链接已失效')).toBeInTheDocument();
  });

  it('REQ-AUTH-007: 加载中应禁用按钮', () => {
    vi.mocked(useResetPassword).mockReturnValue({
      resetPassword: mockResetPassword,
      isLoading: true,
      error: null,
      success: false,
      clearError: mockClearError,
    });

    render(<ResetPassword token="test-token" />);

    expect(screen.getByRole('button', { name: /处理中/ })).toBeDisabled();
  });
});
