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

/**
 * Soft "aurora" page background: a light base gradient washed with a few
 * blurred colour blobs and a faint dot grid. Gives the app depth without
 * hurting text contrast (all content sits on an opaque z-10 layer above it).
 */
function AuroraBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-violet-50">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-indigo-300/30 blur-3xl" />
        <div className="absolute top-1/4 -right-28 w-[26rem] h-[26rem] rounded-full bg-fuchsia-300/25 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-[30rem] h-[30rem] rounded-full bg-sky-200/30 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgb(99 102 241 / 0.10) 1px, transparent 0)',
            backgroundSize: '22px 22px',
          }}
        />
      </div>
      <div className="relative z-10 min-h-screen flex flex-col">{children}</div>
    </div>
  );
}

/** Small gradient avatar showing the user's initial. */
function UserAvatar({ name }: { name?: string }) {
  return (
    <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-bold flex items-center justify-center shadow-sm shadow-indigo-300/50 ring-2 ring-white/70">
      {(name?.[0] ?? '?').toUpperCase()}
    </div>
  );
}

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
      // Load the whole bank so every word is reachable and the counters are
      // honest: words.length === totalWords, "1 / 3677" and "已掌握 X / 3677"
      // both reflect the full library, and Next/Prev traverse all of it. The
      // nav-dot strip still caps at 50 as a quick-jump into the opening run.
      const bankSize = selectedWordBank.total_words > 0 ? selectedWordBank.total_words : 1000;
      loadWords(selectedWordBank.id, 0, bankSize);
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
      <AuroraBackground>
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 border-b border-white/50 shadow-sm shadow-indigo-100/40">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-300/40 ring-1 ring-white/50">
                <span className="text-lg">📚</span>
              </div>
              <div className="leading-tight">
                <h1 className="text-[17px] font-bold tracking-tight text-slate-800">VocabMaster</h1>
                <span className="text-[11px] font-medium text-slate-400">{platform === 'tauri' ? '桌面版' : 'Web'} · v1.0</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 py-1 pl-1 pr-3 rounded-full bg-white/60 ring-1 ring-slate-200/70">
                <UserAvatar name={user?.username} />
                <span className="text-sm font-medium text-slate-700">{user?.username}</span>
              </div>
              <button
                onClick={() => setShowChangePassword(true)}
                className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-lg transition-all"
              >
                修改密码
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 rounded-lg transition-all shadow-sm"
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
      </AuroraBackground>
    );
  }

  // Show word learning card
  return (
    <AuroraBackground>
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 border-b border-white/50 shadow-sm shadow-indigo-100/40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => reset()}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 pl-2 pr-3 py-1.5 rounded-lg transition-all text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              返回
            </button>
            <div className="w-px h-6 bg-slate-200" />
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-300/40 ring-1 ring-white/50">
              <span className="text-lg">📚</span>
            </div>
            <div className="leading-tight">
              <h1 className="text-[17px] font-bold tracking-tight text-slate-800">VocabMaster</h1>
              <span className="text-[11px] font-medium text-indigo-500/80">{selectedWordBank.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 py-1 pl-1 pr-3 rounded-full bg-white/60 ring-1 ring-slate-200/70">
              <UserAvatar name={user?.username} />
              <span className="text-sm font-medium text-slate-700">{user?.username}</span>
            </div>
            <button
              onClick={() => setShowChangePassword(true)}
              className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-lg transition-all"
            >
              修改密码
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 rounded-lg transition-all shadow-sm"
            >
              退出
            </button>
          </div>
        </div>
      </header>
      <main className="py-8 flex-1">
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
    </AuroraBackground>
  );
}
