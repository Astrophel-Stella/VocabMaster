/**
 * LoginPanel - 登录/注册界面
 * REQ-UI-001: 登录/注册表单
 * REQ-AUTH-006: 密码强度验证功能
 */

import { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  validatePasswordStrength,
  getStrengthText,
  getStrengthColor,
} from '../lib/passwordStrength';

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
    <div className="min-h-screen flex">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-pink-300/20 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <div className="text-8xl mb-6 animate-bounce">📚</div>
          <h1 className="text-5xl font-bold mb-4 tracking-tight">VocabMaster</h1>
          <p className="text-xl text-white/80 text-center max-w-md leading-relaxed">
            科学记忆，高效学习<br />让每一个单词都刻在脑海
          </p>
          <div className="mt-12 flex items-center gap-8 text-white/70">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              <span className="text-sm">智能复习</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <span className="text-sm">进度追踪</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔊</span>
              <span className="text-sm">发音训练</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 p-4 sm:p-8">
        <div className="w-full max-w-md">
          {/* Mobile header */}
          <div className="lg:hidden text-center mb-8">
            <span className="text-6xl">📚</span>
            <h1 className="text-3xl font-bold text-gray-900 mt-4">VocabMaster</h1>
            <p className="text-gray-500 mt-2">英语单词学习助手</p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-3xl shadow-lg shadow-gray-200/50 p-6 sm:p-8">
            <div className="hidden lg:block mb-8">
              <h2 className="text-2xl font-bold text-gray-900">欢迎回来</h2>
              <p className="text-gray-500 mt-1">登录开始你的学习之旅</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">用户名</label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                  placeholder="请输入用户名"
                  required
                  disabled={isLoading}
                />
              </div>

              {!isLoginMode && (
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                    placeholder="请输入邮箱地址"
                    required
                    disabled={isLoading}
                  />
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">密码</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                  placeholder="请输入密码"
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
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:shadow-indigo-300/50 transform hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    处理中...
                  </span>
                ) : (isLoginMode ? '登录' : '注册')}
              </button>
            </form>

            <div className="mt-6 space-y-3">
              <button
                onClick={() => {
                  setIsLoginMode(!isLoginMode);
                  clearError();
                }}
                className="w-full text-center text-indigo-600 hover:text-indigo-700 text-sm font-medium py-2 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                {isLoginMode ? '没有账号？立即注册' : '已有账号？返回登录'}
              </button>
              {isLoginMode && (
                <button
                  onClick={() => {
                    window.history.pushState({}, '', '/forgot-password');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className="w-full text-center text-gray-400 hover:text-gray-600 text-sm py-2 transition-colors"
                >
                  忘记密码？
                </button>
              )}
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-gray-400 text-xs mt-8">
            © 2026 VocabMaster. Made with ❤️ for learners.
          </p>
        </div>
      </div>
    </div>
  );
}
