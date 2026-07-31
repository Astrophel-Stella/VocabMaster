/**
 * useForgotPassword / useResetPassword Hook Tests - REQ-AUTH-007
 * 覆盖忘记密码与重置密码的核心业务路径（成功 / 失败 / 错误消息处理）。
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  forgotPassword,
  resetPassword,
  useForgotPassword,
  useResetPassword,
} from './useForgotPassword';
import { apiFetch } from '../adapters';

// Mock 平台适配器，统一拦截网络请求
vi.mock('../adapters', () => ({
  apiFetch: vi.fn(),
}));

const mockApiFetch = vi.mocked(apiFetch);

/** 构造一个最小的 Response 替身 */
function makeResponse(ok: boolean, body: unknown) {
  return {
    ok,
    json: async () => body,
  } as unknown as Response;
}

describe('REQ-AUTH-007: 忘记密码 / 重置密码', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('forgotPassword()', () => {
    it('REQ-AUTH-007: 成功时返回后端消息', async () => {
      mockApiFetch.mockResolvedValueOnce(makeResponse(true, { message: '重置邮件已发送' }));

      const result = await forgotPassword('user@example.com');

      expect(result).toEqual({ message: '重置邮件已发送' });
      expect(mockApiFetch).toHaveBeenCalledTimes(1);
      const [, options] = mockApiFetch.mock.calls[0];
      expect(options?.method).toBe('POST');
      expect(options?.body).toBe(JSON.stringify({ email: 'user@example.com' }));
    });

    it('REQ-AUTH-007: 失败时抛出后端 detail 错误', async () => {
      mockApiFetch.mockResolvedValueOnce(makeResponse(false, { detail: '邮箱不存在' }));

      await expect(forgotPassword('none@example.com')).rejects.toThrow('邮箱不存在');
    });

    it('REQ-AUTH-007: 失败且无 detail 时使用兜底文案', async () => {
      mockApiFetch.mockResolvedValueOnce(makeResponse(false, {}));

      await expect(forgotPassword('x@example.com')).rejects.toThrow('发送重置邮件失败');
    });
  });

  describe('resetPassword()', () => {
    it('REQ-AUTH-007: 成功时返回后端消息', async () => {
      mockApiFetch.mockResolvedValueOnce(makeResponse(true, { message: '密码已重置' }));

      const result = await resetPassword('tok-123', 'NewPass123');

      expect(result).toEqual({ message: '密码已重置' });
      const [, options] = mockApiFetch.mock.calls[0];
      expect(options?.body).toBe(
        JSON.stringify({ token: 'tok-123', new_password: 'NewPass123' })
      );
    });

    it('REQ-AUTH-007: detail 为对象含 errors 时拼接错误项', async () => {
      mockApiFetch.mockResolvedValueOnce(
        makeResponse(false, { detail: { errors: ['密码太短', '缺少数字'] } })
      );

      await expect(resetPassword('tok', 'weak')).rejects.toThrow('密码太短、缺少数字');
    });

    it('REQ-AUTH-007: detail 为字符串时直接抛出', async () => {
      mockApiFetch.mockResolvedValueOnce(makeResponse(false, { detail: 'token 已过期' }));

      await expect(resetPassword('tok', 'NewPass123')).rejects.toThrow('token 已过期');
    });
  });

  describe('useForgotPassword hook', () => {
    it('REQ-AUTH-007: 成功后 success=true，loading 归位', async () => {
      mockApiFetch.mockResolvedValueOnce(makeResponse(true, { message: 'ok' }));

      const { result } = renderHook(() => useForgotPassword());

      await act(async () => {
        await result.current.sendResetEmail('user@example.com');
      });

      expect(result.current.success).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('REQ-AUTH-007: 失败后设置 error 并向上抛出', async () => {
      mockApiFetch.mockResolvedValueOnce(makeResponse(false, { detail: '邮箱不存在' }));

      const { result } = renderHook(() => useForgotPassword());

      await act(async () => {
        await expect(result.current.sendResetEmail('none@example.com')).rejects.toThrow(
          '邮箱不存在'
        );
      });

      expect(result.current.success).toBe(false);
      expect(result.current.error).toBe('邮箱不存在');
      expect(result.current.isLoading).toBe(false);
    });

    it('REQ-AUTH-007: clearError 清空错误', async () => {
      mockApiFetch.mockResolvedValueOnce(makeResponse(false, { detail: 'boom' }));

      const { result } = renderHook(() => useForgotPassword());

      await act(async () => {
        await expect(result.current.sendResetEmail('a@b.com')).rejects.toThrow();
      });
      expect(result.current.error).toBe('boom');

      act(() => {
        result.current.clearError();
      });
      expect(result.current.error).toBeNull();
    });
  });

  describe('useResetPassword hook', () => {
    it('REQ-AUTH-007: 成功后 success=true', async () => {
      mockApiFetch.mockResolvedValueOnce(makeResponse(true, { message: 'ok' }));

      const { result } = renderHook(() => useResetPassword());

      await act(async () => {
        await result.current.resetPassword('tok-123', 'NewPass123');
      });

      expect(result.current.success).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('REQ-AUTH-007: 失败后设置 error 并抛出', async () => {
      mockApiFetch.mockResolvedValueOnce(makeResponse(false, { detail: 'token 已过期' }));

      const { result } = renderHook(() => useResetPassword());

      await act(async () => {
        await expect(
          result.current.resetPassword('bad-tok', 'NewPass123')
        ).rejects.toThrow('token 已过期');
      });

      expect(result.current.success).toBe(false);
      expect(result.current.error).toBe('token 已过期');
    });
  });
});
