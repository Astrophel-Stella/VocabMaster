/**
 * ChangePassword - 密码修改组件
 * REQ-AUTH-009: 密码修改功能
 */

import { useState, useMemo } from 'react';
import { changePassword as changePasswordApi } from '../lib/api';
import { useUserStore } from '../stores/userStore';
import {
  validatePasswordStrength,
  getStrengthText,
  getStrengthColor,
} from '../lib/passwordStrength';

interface ChangePasswordProps {
  onClose: () => void;
}

/**
 * REQ-AUTH-006: 密码强度指示器组件
 */
function PasswordStrengthIndicator({ password }: { password: string }) {
  const validation = useMemo(() => validatePasswordStrength(password), [password]);

  if (!password) {
    return null;
  }

  return (
    <div className="mt-2 space-y-2">
      {/* 强度条 */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getStrengthColor(validation.strength)}`}
            style={{
              width: validation.strength === 'weak' ? '25%' :
                     validation.strength === 'medium' ? '50%' :
                     validation.strength === 'strong' ? '75%' : '100%'
            }}
          />
        </div>
        <span className={`text-xs font-medium ${
          validation.strength === 'weak' ? 'text-red-600' :
          validation.strength === 'strong' || validation.strength === 'very_strong' ? 'text-green-600' :
          'text-yellow-600'
        }`}>
          {getStrengthText(validation.strength)}
        </span>
      </div>

      {/* 要求清单 */}
      <div className="text-xs space-y-1">
        <div className="flex items-center gap-1">
          {validation.checks.length ? (
            <span className="text-green-600">✓</span>
          ) : (
            <span className="text-gray-400">○</span>
          )}
          <span className={validation.checks.length ? 'text-green-600' : 'text-gray-500'}>
            至少8个字符
          </span>
        </div>
        <div className="flex items-center gap-1">
          {validation.checks.uppercase ? (
            <span className="text-green-600">✓</span>
          ) : (
            <span className="text-gray-400">○</span>
          )}
          <span className={validation.checks.uppercase ? 'text-green-600' : 'text-gray-500'}>
            至少1个大写字母
          </span>
        </div>
        <div className="flex items-center gap-1">
          {validation.checks.lowercase ? (
            <span className="text-green-600">✓</span>
          ) : (
            <span className="text-gray-400">○</span>
          )}
          <span className={validation.checks.lowercase ? 'text-green-600' : 'text-gray-500'}>
            至少1个小写字母
          </span>
        </div>
        <div className="flex items-center gap-1">
          {validation.checks.digit ? (
            <span className="text-green-600">✓</span>
          ) : (
            <span className="text-gray-400">○</span>
          )}
          <span className={validation.checks.digit ? 'text-green-600' : 'text-gray-500'}>
            至少1个数字
          </span>
        </div>
      </div>
    </div>
  );
}

export function ChangePassword({ onClose }: ChangePasswordProps) {
  const { token, logout } = useUserStore();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const newValidation = useMemo(() => validatePasswordStrength(newPassword), [newPassword]);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 验证两次密码一致
    if (newPassword !== confirmPassword) {
      setError('两次密码输入不一致');
      return;
    }

    // 验证新密码强度
    if (!newValidation.isValid) {
      setError('新密码不符合强度要求');
      return;
    }

    if (!token) {
      setError('未登录，请先登录');
      return;
    }

    setIsLoading(true);
    try {
      await changePasswordApi(oldPassword, newPassword, token);
      setSuccess(true);
      // 3秒后自动退出登录
      setTimeout(() => {
        logout();
        onClose();
      }, 3000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('密码修改失败，请稍后重试');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-6 text-center">
        <div className="mb-4">
          <span className="text-4xl">✅</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">密码修改成功</h3>
        <p className="text-gray-600 mb-4">请使用新密码重新登录</p>
        <p className="text-sm text-gray-500">正在退出登录...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div>
        <label htmlFor="old-password" className="block text-sm font-medium text-gray-700 mb-1">旧密码</label>
        <input
          id="old-password"
          type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
        <input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          required
          disabled={isLoading}
        />
        {newPassword && <PasswordStrengthIndicator password={newPassword} />}
      </div>

      <div>
        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">确认新密码</label>
        <input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
            confirmPassword && !passwordsMatch ? 'border-red-300' : 'border-gray-300'
          }`}
          required
          disabled={isLoading}
        />
        {confirmPassword && !passwordsMatch && (
          <p className="mt-1 text-xs text-red-600">两次密码输入不一致</p>
        )}
        {confirmPassword && passwordsMatch && (
          <p className="mt-1 text-xs text-green-600">✓ 两次密码一致</p>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={isLoading || !newValidation.isValid || !passwordsMatch}
          className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isLoading ? '处理中...' : '确认修改'}
        </button>
      </div>
    </form>
  );
}
