import { useEffect } from 'react';
import { useUserStore } from './stores/userStore';
import { useWordStore } from './stores/wordStore';
import { useProgress } from './hooks/useProgress';
import { LoginPanel } from './components/LoginPanel';
import { WordBankSelect } from './components/WordBankSelect';
import { WordCard } from './components/WordCard';
import { getAdapter } from './adapters';

export default function App() {
  const { isAuthenticated, user, logout } = useUserStore();
  const { selectedWordBank, loadWords, reset } = useWordStore();
  const { loadProgress } = useProgress();

  const platform = getAdapter().name;

  // Load words when word bank is selected
  useEffect(() => {
    if (selectedWordBank) {
      loadWords(selectedWordBank.id, 0, 100);
      if (isAuthenticated) {
        loadProgress(selectedWordBank.id);
      }
    }
  }, [selectedWordBank, loadWords, loadProgress, isAuthenticated]);

  // Handle logout
  const handleLogout = () => {
    logout();
    reset();
  };

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
                onClick={handleLogout}
                className="text-sm px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 border border-gray-200"
              >
                退出
              </button>
            </div>
          </div>
        </header>
        <WordBankSelect />
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
    </div>
  );
}
