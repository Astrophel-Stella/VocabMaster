/**
 * ResetPassword - 重置密码页面
 * REQ-AUTH-007: 忘记密码功能
 */

import { useState, useMemo } from 'react';
import { useResetPassword } from '../hooks/useForgotPassword';
import {
  validatePasswordStrength,
  getStrengthText,
  getStrengthColor,
} from '../lib/passwordStrength';

/**
 * REQ-AUTH-007: 密码强度指示器组件
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

interface ResetPasswordProps {
  token: string;
}

export function ResetPassword({ token }: ResetPasswordProps) {
  const { resetPassword, isLoading, error, success, clearError } = useResetPassword();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setValidationError('两次密码输入不一致');
      return;
    }

    // Validate password strength
    const validation = validatePasswordStrength(password);
    if (!validation.isValid) {
      setValidationError(validation.errors.join('、'));
      return;
    }

    await resetPassword(token, password);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <div className="text-center">
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">密码重置成功</h1>
            <p className="text-gray-600 mb-6">
              您的密码已成功重置，请使用新密码登录。
            </p>
            <button
              onClick={() => {
                window.history.pushState({}, '', '/');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              返回登录
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🔐 重置密码</h1>
          <p className="text-gray-600 mt-2">请输入新密码</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
              disabled={isLoading}
              placeholder="请输入新密码"
            />
            {password && <PasswordStrengthIndicator password={password} />}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">确认密码</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
              disabled={isLoading}
              placeholder="请再次输入新密码"
            />
          </div>

          {(error || validationError) && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error || validationError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? '处理中...' : '重置密码'}
          </button>
        </form>
      </div>
    </div>
  );
}
