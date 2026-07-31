/**
 * useForgotPassword Hook - 忘记密码和重置密码业务逻辑
 * REQ-AUTH-007: 忘记密码功能
 */

import { useState } from 'react';
import { apiFetch } from '../adapters';
import { API_BASE } from '../lib/api';

/**
 * 发送密码重置邮件
 */
export async function forgotPassword(email: string): Promise<{ message: string }> {
  const response = await apiFetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '发送重置邮件失败');
  }

  return response.json();
}

/**
 * 使用 token 重置密码
 */
export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  const response = await apiFetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password: newPassword }),
  });

  if (!response.ok) {
    const error = await response.json();
    // Handle both string detail and object detail with errors
    if (typeof error.detail === 'object' && error.detail.errors) {
      throw new Error(error.detail.errors.join('、'));
    }
    throw new Error(error.detail || '密码重置失败');
  }

  return response.json();
}

/**
 * useForgotPassword hook - 发送重置邮件
 */
export function useForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const sendResetEmail = async (email: string) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : '发送重置邮件失败';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    sendResetEmail,
    isLoading,
    error,
    success,
    clearError,
  };
}

/**
 * useResetPassword hook - 重置密码
 */
export function useResetPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const resetPasswordWithToken = async (token: string, newPassword: string) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : '密码重置失败';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    resetPassword: resetPasswordWithToken,
    isLoading,
    error,
    success,
    clearError,
  };
}
