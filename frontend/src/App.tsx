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
      loadWords(selectedWordBank.id, 0, 100);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📚</span>
              <h1 className="text-xl font-bold text-gray-900">VocabMaster</h1>
              <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-600">
                {platform === 'tauri' ? '桌面版' : 'Web'} · v1.0
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">你好, {user?.username}</span>
              <button
                onClick={() => setShowChangePassword(true)}
                className="text-sm px-4 py-2 rounded-lg text-indigo-600 hover:bg-indigo-50 border border-indigo-200"
              >
                修改密码
              </button>
              <button
                onClick={handleLogout}
                className="text-sm px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 border border-gray-200"
              >
                退出
              </button>
            </div>
          </div>
        </header>
        <WordBankSelect />
        {/* Change Password Modal */}
        {showChangePassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">修改密码</h2>
                <button
                  onClick={() => setShowChangePassword(false)}
                  className="text-gray-400 hover:text-gray-600"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => reset()}
              className="text-gray-400 hover:text-gray-600 mr-2"
            >
              ← 返回
            </button>
            <span className="text-2xl">📚</span>
            <h1 className="text-xl font-bold text-gray-900">VocabMaster</h1>
            <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-600">
              {selectedWordBank.name}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">你好, {user?.username}</span>
            <button
              onClick={() => setShowChangePassword(true)}
              className="text-sm px-4 py-2 rounded-lg text-indigo-600 hover:bg-indigo-50 border border-indigo-200"
            >
              修改密码
            </button>
            <button
              onClick={handleLogout}
              className="text-sm px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 border border-gray-200"
            >
              退出
            </button>
          </div>
        </div>
      </header>
      <main className="py-6">
        <WordCard />
      </main>
      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">修改密码</h2>
              <button
                onClick={() => setShowChangePassword(false)}
                className="text-gray-400 hover:text-gray-600"
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
