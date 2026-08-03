/**
 * WordBankSelect - 词库选择界面
 * REQ-UI-002: 词库列表展示与选择
 * REQ-UI-005: 首页 Hero + 整体学习进度概览 + 词库卡片视觉升级
 */

import { useWords } from '../hooks/useWords';
import { useOverview } from '../hooks/useOverview';

export function WordBankSelect() {
  const { wordBanks, isLoadingBanks, error, selectWordBank } = useWords();
  const { overview } = useOverview();

  if (isLoadingBanks) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">加载词库中...</p>
          <p className="mt-2 text-gray-400 text-sm">正在为您准备最佳学习资源</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-lg mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <div className="text-4xl mb-3">😢</div>
          <p className="text-red-600 font-medium">{error}</p>
          <p className="text-red-400 text-sm mt-2">请稍后重试</p>
        </div>
      </div>
    );
  }

  // 整体概览数据：优先使用后端聚合结果，缺失时回退到词库列表可推导的信息，
  // 保证 Hero 概览始终可渲染、不因单次请求失败而空白。
  const fallbackTotalWords = wordBanks.reduce((sum, b) => sum + (b.total_words || 0), 0);
  const totalWords = overview?.total_words ?? fallbackTotalWords;
  const masteredWords = overview?.mastered_words ?? 0;
  const totalBanks = overview?.total_banks ?? wordBanks.length;
  const percentage = overview
    ? overview.progress_percentage
    : totalWords > 0
      ? (masteredWords / totalWords) * 100
      : 0;
  const roundedPct = Math.round(percentage);

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto">
      {/* ── Hero 区：品牌 + 整体学习进度概览 ── */}
      <section
        aria-label="学习概览"
        className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm mb-10"
      >
        {/* Decorative gradient backdrop */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50" />
        <div className="pointer-events-none absolute -top-24 -right-16 w-72 h-72 rounded-full bg-gradient-to-br from-indigo-200/40 to-purple-200/40 blur-3xl" />

        <div className="relative p-7 sm:p-10 grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          {/* 左：品牌标题 + 副标题 */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100/70 px-3 py-1 text-xs font-semibold text-indigo-700 mb-4">
              <span>✨</span>
              <span>VocabMaster · 每天进步一点点</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
              继续你的单词之旅
            </h2>
            <p className="mt-3 text-gray-500 sm:text-lg leading-relaxed">
              精选高频词库，科学记忆节奏。选择一个词库，开启今天的专注学习。
            </p>

            {/* 关键指标 */}
            <div className="mt-6 grid grid-cols-3 gap-3 max-w-md">
              <StatTile label="已掌握" value={masteredWords.toLocaleString('en-US')} accent />
              <StatTile label="总词汇量" value={totalWords.toLocaleString('en-US')} />
              <StatTile label="词库" value={String(totalBanks)} />
            </div>
          </div>

          {/* 右：整体学习进度概览 */}
          <div className="rounded-2xl border border-gray-100 bg-white/80 backdrop-blur-sm p-6 shadow-sm">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold text-gray-700">整体学习进度</h3>
              <span className="text-2xl font-extrabold text-indigo-600 tabular-nums">
                {roundedPct}%
              </span>
            </div>

            <div
              role="progressbar"
              aria-label="整体学习进度"
              aria-valuenow={roundedPct}
              aria-valuemin={0}
              aria-valuemax={100}
              className="mt-3 h-3 w-full overflow-hidden rounded-full bg-gray-100"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-[width] duration-700 ease-out"
                style={{ width: `${Math.min(roundedPct, 100)}%` }}
              />
            </div>

            <p className="mt-3 text-sm text-gray-500">
              已掌握 <span className="font-semibold text-gray-800 tabular-nums">{masteredWords.toLocaleString('en-US')}</span>
              {' / '}
              <span className="tabular-nums">{totalWords.toLocaleString('en-US')}</span> 个单词
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {roundedPct >= 100
                ? '太棒了，你已掌握全部词汇！🎉'
                : masteredWords > 0
                  ? '保持节奏，坚持就是胜利 💪'
                  : '从第一个单词开始，积少成多 🌱'}
            </p>
          </div>
        </div>
      </section>

      {/* ── 词库卡片网格 ── */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">选择词库</h2>
        <p className="mt-1 text-gray-500">挑选一个词库，开始今天的学习之旅</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wordBanks.map((bank, index) => (
          <button
            key={bank.id}
            onClick={() => selectWordBank(bank)}
            className="group relative p-6 bg-white border border-gray-100 rounded-2xl hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-100/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition-all duration-300 text-left overflow-hidden"
          >
            {/* Decorative gradient */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:from-indigo-100 group-hover:to-purple-100 transition-colors" />

            {/* Card Number Badge */}
            <div className="absolute top-4 right-4 w-8 h-8 bg-gray-100 group-hover:bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-400 group-hover:text-indigo-600 transition-colors">
              {index + 1}
            </div>

            <div className="relative">
              {/* Icon */}
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl shadow-lg shadow-indigo-200/50 mb-4 group-hover:scale-110 transition-transform">
                📚
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-700 transition-colors">{bank.name}</h3>

              {/* Description */}
              <p className="text-gray-500 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">{bank.description}</p>

              {/* Stats + CTA */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span className="text-sm font-medium">{bank.total_words} 词</span>
                </div>

                <div className="flex items-center gap-1 text-sm font-medium text-gray-400 group-hover:text-indigo-600 transition-colors">
                  <span>开始学习</span>
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * StatTile - Hero 区的关键指标小卡片（纯展示，无交互）。
 * 刻意不使用 <button>，保证空态下页面无任何按钮（契合既有单元测试）。
 */
function StatTile({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-xl px-3 py-2.5 text-center ${
        accent ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' : 'bg-white/70 text-gray-900 border border-gray-100'
      }`}
    >
      <div className="text-lg sm:text-xl font-extrabold tabular-nums leading-tight">{value}</div>
      <div className={`text-[11px] font-medium ${accent ? 'text-indigo-100' : 'text-gray-400'}`}>{label}</div>
    </div>
  );
}
