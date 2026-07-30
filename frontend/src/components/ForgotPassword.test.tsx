/**
 * ForgotPassword.test.tsx - 忘记密码页面测试
 * REQ-AUTH-007: 忘记密码功能
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ForgotPassword } from './ForgotPassword';

// Import jest-dom matchers
import '@testing-library/jest-dom/vitest';

// Mock the hook
vi.mock('../hooks/useForgotPassword', () => ({
  useForgotPassword: vi.fn(() => ({
    sendResetEmail: vi.fn(),
    isLoading: false,
    error: null,
    success: false,
    clearError: vi.fn(),
  })),
}));

import { useForgotPassword } from '../hooks/useForgotPassword';

const mockSendResetEmail = vi.fn();
const mockClearError = vi.fn();

describe('ForgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useForgotPassword).mockReturnValue({
      sendResetEmail: mockSendResetEmail,
      isLoading: false,
      error: null,
      success: false,
      clearError: mockClearError,
    });
  });

  it('REQ-AUTH-007: 应渲染忘记密码表单', () => {
    render(<ForgotPassword />);

    expect(screen.getByText('🔑 忘记密码')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入注册邮箱')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /发送重置邮件/ })).toBeInTheDocument();
  });

  it('REQ-AUTH-007: 输入邮箱并提交应调用sendResetEmail', async () => {
    mockSendResetEmail.mockResolvedValueOnce(undefined);
    render(<ForgotPassword />);

    const emailInput = screen.getByPlaceholderText('请输入注册邮箱');
    const submitButton = screen.getByRole('button', { name: /发送重置邮件/ });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSendResetEmail).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('REQ-AUTH-007: 成功后应显示成功消息', () => {
    vi.mocked(useForgotPassword).mockReturnValue({
      sendResetEmail: mockSendResetEmail,
      isLoading: false,
      error: null,
      success: true,
      clearError: mockClearError,
    });

    render(<ForgotPassword />);

    expect(screen.getByText('邮件已发送')).toBeInTheDocument();
    expect(screen.getByText(/重置邮件已发送/)).toBeInTheDocument();
    expect(screen.getByText(/链接有效期为 24 小时/)).toBeInTheDocument();
  });

  it('REQ-AUTH-007: 错误时应显示错误信息', () => {
    vi.mocked(useForgotPassword).mockReturnValue({
      sendResetEmail: mockSendResetEmail,
      isLoading: false,
      error: '该邮箱未注册',
      success: false,
      clearError: mockClearError,
    });

    render(<ForgotPassword />);

    expect(screen.getByText('该邮箱未注册')).toBeInTheDocument();
  });

  it('REQ-AUTH-007: 加载中应禁用按钮', () => {
    vi.mocked(useForgotPassword).mockReturnValue({
      sendResetEmail: mockSendResetEmail,
      isLoading: true,
      error: null,
      success: false,
      clearError: mockClearError,
    });

    render(<ForgotPassword />);

    expect(screen.getByRole('button', { name: /发送中/ })).toBeDisabled();
  });
});
