/**
 * LoginPanel - 登录/注册界面
 * REQ-UI-001: 登录/注册表单
 * REQ-AUTH-006: 密码强度验证功能
 */

import { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';

/**
 * REQ-AUTH-006: 密码强度验证
 * 根据密码内容计算强度级别
 */
function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong' | 'very_strong';
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    digit: boolean;
  };
} {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    digit: /\d/.test(password),
  };

  const errors: string[] = [];

  if (!checks.length) {
    errors.push('密码长度至少8个字符');
  }
  if (!checks.uppercase) {
    errors.push('密码需包含至少1个大写字母');
  }
  if (!checks.lowercase) {
    errors.push('密码需包含至少1个小写字母');
  }
  if (!checks.digit) {
    errors.push('密码需包含至少1个数字');
  }

  // Determine strength
  let strength: 'weak' | 'medium' | 'strong' | 'very_strong' = 'weak';
  if (errors.length === 0) {
    if (password.length >= 12 && /[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      strength = 'very_strong';
    } else {
      strength = 'strong';
    }
  } else if (password.length > 0) {
    strength = 'weak';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    checks,
  };
}

/**
 * REQ-AUTH-006: 密码强度指示器组件
 */
function PasswordStrengthIndicator({ password }: { password: string }) {
  const validation = useMemo(() => validatePasswordStrength(password), [password]);

  if (!password) {
    return null;
  }

  const getStrengthColor = () => {
    switch (validation.strength) {
      case 'very_strong':
        return 'bg-green-600';
      case 'strong':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'weak':
      default:
        return 'bg-red-500';
    }
  };

  const getStrengthText = () => {
    switch (validation.strength) {
      case 'very_strong':
        return '密码强度：非常强';
      case 'strong':
        return '密码强度：强';
      case 'medium':
        return '密码强度：中';
      case 'weak':
      default:
        return '密码强度：弱';
    }
  };

  return (
    <div className="mt-2 space-y-2">
      {/* 强度条 */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getStrengthColor()}`}
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
          {getStrengthText()}
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

export function LoginPanel() {
  const { login, register, isLoading, error, clearError } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      if (isLoginMode) {
        await login(username, password);
      } else {
        await register(username, email, password);
        // 注册成功后自动登录
        await login(username, password);
      }
    } catch {
      // Error is handled by useAuth
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">📚 VocabMaster</h1>
          <p className="text-gray-600 mt-2">英语单词学习助手</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
              disabled={isLoading}
            />
          </div>

          {!isLoginMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
                disabled={isLoading}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
              disabled={isLoading}
              minLength={6}
            />
            {/* REQ-AUTH-006: 密码强度指示器 */}
            {!isLoginMode && password && (
              <PasswordStrengthIndicator password={password} />
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? '处理中...' : (isLoginMode ? '登录' : '注册')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              clearError();
            }}
            className="text-indigo-600 hover:text-indigo-700 text-sm"
          >
            {isLoginMode ? '没有账号？点击注册' : '已有账号？点击登录'}
          </button>
        </div>

        {/* 测试账号提示 */}
        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-xs">
            💡 测试账号: test / Password123
          </p>
        </div>
      </div>
    </div>
  );
}
