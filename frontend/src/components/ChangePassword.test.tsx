/**
 * ChangePassword.test.tsx - 密码修改组件测试
 * REQ-AUTH-009: 密码修改功能
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChangePassword } from './ChangePassword';
import * as api from '../lib/api';

// Mock the api module
vi.mock('../lib/api', () => ({
  changePassword: vi.fn(),
}));

// Mock the user store
vi.mock('../stores/userStore', () => ({
  useUserStore: vi.fn(() => ({
    token: 'mock-token',
    logout: vi.fn(),
  })),
}));

describe('ChangePassword', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('REQ-AUTH-009: renders change password form', () => {
    render(<ChangePassword onClose={mockOnClose} />);

    expect(screen.getByLabelText('旧密码')).toBeInTheDocument();
    expect(screen.getByLabelText('新密码')).toBeInTheDocument();
    expect(screen.getByLabelText('确认新密码')).toBeInTheDocument();
    expect(screen.getByText('确认修改')).toBeInTheDocument();
    expect(screen.getByText('取消')).toBeInTheDocument();
  });

  it('REQ-AUTH-009: shows password strength indicator for new password', () => {
    render(<ChangePassword onClose={mockOnClose} />);

    const newPasswordInput = screen.getByLabelText('新密码');
    fireEvent.change(newPasswordInput, { target: { value: 'weak' } });

    // Should show strength indicator
    expect(screen.getByText('密码强度：弱')).toBeInTheDocument();
    // Should show requirement items
    expect(screen.getByText('至少8个字符')).toBeInTheDocument();
  });

  it('REQ-AUTH-009: shows success message when password changed', async () => {
    vi.mocked(api.changePassword).mockResolvedValueOnce({ message: '密码修改成功，请重新登录' });

    render(<ChangePassword onClose={mockOnClose} />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText('旧密码'), { target: { value: 'OldPassword123' } });
    fireEvent.change(screen.getByLabelText('新密码'), { target: { value: 'NewPassword456' } });
    fireEvent.change(screen.getByLabelText('确认新密码'), { target: { value: 'NewPassword456' } });

    // Submit
    fireEvent.click(screen.getByText('确认修改'));

    await waitFor(() => {
      expect(api.changePassword).toHaveBeenCalledWith('OldPassword123', 'NewPassword456', 'mock-token');
    });

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText('密码修改成功')).toBeInTheDocument();
    });
  });

  it('REQ-AUTH-009: shows error when passwords do not match', async () => {
    render(<ChangePassword onClose={mockOnClose} />);

    fireEvent.change(screen.getByLabelText('旧密码'), { target: { value: 'OldPassword123' } });
    fireEvent.change(screen.getByLabelText('新密码'), { target: { value: 'NewPassword456' } });
    fireEvent.change(screen.getByLabelText('确认新密码'), { target: { value: 'DifferentPassword' } });

    fireEvent.click(screen.getByText('确认修改'));

    await waitFor(() => {
      expect(screen.getByText('两次密码输入不一致')).toBeInTheDocument();
    });

    // API should not be called
    expect(api.changePassword).not.toHaveBeenCalled();
  });

  it('REQ-AUTH-009: shows error when old password is wrong', async () => {
    vi.mocked(api.changePassword).mockRejectedValueOnce(new Error('旧密码错误'));

    render(<ChangePassword onClose={mockOnClose} />);

    fireEvent.change(screen.getByLabelText('旧密码'), { target: { value: 'WrongPassword' } });
    fireEvent.change(screen.getByLabelText('新密码'), { target: { value: 'NewPassword456' } });
    fireEvent.change(screen.getByLabelText('确认新密码'), { target: { value: 'NewPassword456' } });

    fireEvent.click(screen.getByText('确认修改'));

    await waitFor(() => {
      expect(screen.getByText('旧密码错误')).toBeInTheDocument();
    });
  });

  it('REQ-AUTH-009: disables submit when password is weak', () => {
    render(<ChangePassword onClose={mockOnClose} />);

    fireEvent.change(screen.getByLabelText('旧密码'), { target: { value: 'OldPassword123' } });
    fireEvent.change(screen.getByLabelText('新密码'), { target: { value: 'weak' } });
    fireEvent.change(screen.getByLabelText('确认新密码'), { target: { value: 'weak' } });

    // Submit button should be disabled
    expect(screen.getByText('确认修改')).toBeDisabled();
  });

  it('REQ-AUTH-009: enables submit when all validations pass', () => {
    render(<ChangePassword onClose={mockOnClose} />);

    fireEvent.change(screen.getByLabelText('旧密码'), { target: { value: 'OldPassword123' } });
    fireEvent.change(screen.getByLabelText('新密码'), { target: { value: 'NewPassword456' } });
    fireEvent.change(screen.getByLabelText('确认新密码'), { target: { value: 'NewPassword456' } });

    // Submit button should be enabled
    expect(screen.getByText('确认修改')).not.toBeDisabled();
  });

  it('REQ-AUTH-009: calls onClose when cancel is clicked', () => {
    render(<ChangePassword onClose={mockOnClose} />);

    fireEvent.click(screen.getByText('取消'));

    expect(mockOnClose).toHaveBeenCalled();
  });
});
