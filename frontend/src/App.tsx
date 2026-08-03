import { useEffect, useState } from 'react';
import { useUserStore } from './stores/userStore';
import { useWordStore } from './stores/wordStore';
import { useWords } from './hooks/useWords';
import { useProgress } from './hooks/useProgress';
import { LoginPanel } from './components/LoginPanel';
import { WordBankSelect } from './components/WordBankSelect';
import { WordCard } from './components/WordCard';
import { ForgotPassword } from './components/ForgotPassword';
import { ResetPassword } from './components/ResetPassword';
import { ChangePassword } from './components/ChangePassword';
import { getAdapter } from './adapters';

export default function App() {
  const { isAuthenticated, user, logout } = useUserStore();
  const { selectedWordBank, reset } = useWordStore();
  const { loadWords } = useWords();
  const { loadProgress } = useProgress();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const platform = getAdapter().name;

  // Handle browser navigation (back/forward)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Load words when word bank is selected
  // Note: loadWords/loadProgress are intentionally omitted from deps as they are
  // unstable function references that would cause infinite re-renders.
  // We use selectedWordBank?.id (primitive value) instead of the object.
  useEffect(() => {
    if (selectedWordBank) {
      // Load the whole bank so the in-memory word list matches total_words:
      // prev/next boundaries, the "index / total" progress bar and the nav dots
      // all stay consistent (otherwise "下一个" never disables on large banks).
      loadWords(selectedWordBank.id, 0, selectedWordBank.total_words);
      if (isAuthenticated) {
        loadProgress(selectedWordBank.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWordBank?.id, isAuthenticated]);

  // Handle logout
  const handleLogout = () => {
    logout();
    reset();
  };

  // REQ-AUTH-007: Forgot password route
  if (currentPath === '/forgot-password') {
    return <ForgotPassword />;
  }

  // REQ-AUTH-007: Reset password route
  if (currentPath.startsWith('/reset-password')) {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      return <ResetPassword token={token} />;
    }
    // No token - redirect to login
    window.history.pushState({}, '', '/');
    setCurrentPath('/');
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <LoginPanel />;
  }

  // Show word bank selection if no bank selected
  if (!selectedWordBank) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200/50">
                <span className="text-xl">📚</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">VocabMaster</h1>
                <span className="text-xs text-gray-400">{platform === 'tauri' ? '桌面版' : 'Web'} · v1.0</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right mr-2">
                <span className="text-sm font-medium text-gray-700">{user?.username}</span>
                <p className="text-xs text-gray-400">欢迎回来</p>
              </div>
              <button
                onClick={() => setShowChangePassword(true)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
              >
                修改密码
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-all shadow-sm"
              >
                退出
              </button>
            </div>
          </div>
        </header>
        <WordBankSelect />
        {/* Change Password Modal */}
        {showChangePassword && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                <h2 className="text-lg font-bold text-gray-900">修改密码</h2>
                <button
                  onClick={() => setShowChangePassword(false)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  ✕
                </button>
              </div>
              <ChangePassword onClose={() => setShowChangePassword(false)} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show word learning card
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => reset()}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-all text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              返回
            </button>
            <div className="w-px h-6 bg-gray-200" />
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200/50">
              <span className="text-xl">📚</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">VocabMaster</h1>
              <span className="text-xs text-gray-400">{selectedWordBank.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right mr-2">
              <span className="text-sm font-medium text-gray-700">{user?.username}</span>
              <p className="text-xs text-gray-400">学习中...</p>
            </div>
            <button
              onClick={() => setShowChangePassword(true)}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
            >
              修改密码
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-all shadow-sm"
            >
              退出
            </button>
          </div>
        </div>
      </header>
      <main className="py-8">
        <WordCard />
      </main>
      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
              <h2 className="text-lg font-bold text-gray-900">修改密码</h2>
              <button
                onClick={() => setShowChangePassword(false)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>
            <ChangePassword onClose={() => setShowChangePassword(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
