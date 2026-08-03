/**
 * WordBankSelect - 词库选择首页 (REQ-UI-002 + REQ-WB-001)
 *
 * 首页展示：Hero 标题 + 学习资源概览统计 + 词库卡片网格。
 * 设计目标：美观、响应式、可访问（每张卡片是带 aria-label 的 <button>，内含 <h3> 库名）。
 */

import { useWords } from '../hooks/useWords';

// 每个词库一套配色/图标，按顺序循环，视觉上区分不同词库。
const CARD_THEMES = [
  { emoji: '🎓', icon: 'from-indigo-500 to-purple-600', glow: 'shadow-indigo-200/50', ring: 'hover:border-indigo-300 hover:shadow-indigo-100/50', badge: 'text-indigo-600 bg-indigo-50', badgeHover: 'group-hover:text-indigo-700', arrow: 'group-hover:text-indigo-500' },
  { emoji: '📖', icon: 'from-sky-500 to-cyan-600', glow: 'shadow-sky-200/50', ring: 'hover:border-sky-300 hover:shadow-sky-100/50', badge: 'text-sky-600 bg-sky-50', badgeHover: 'group-hover:text-sky-700', arrow: 'group-hover:text-sky-500' },
  { emoji: '🏆', icon: 'from-amber-500 to-orange-600', glow: 'shadow-amber-200/50', ring: 'hover:border-amber-300 hover:shadow-amber-100/50', badge: 'text-amber-600 bg-amber-50', badgeHover: 'group-hover:text-amber-700', arrow: 'group-hover:text-amber-500' },
  { emoji: '🚀', icon: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-200/50', ring: 'hover:border-emerald-300 hover:shadow-emerald-100/50', badge: 'text-emerald-600 bg-emerald-50', badgeHover: 'group-hover:text-emerald-700', arrow: 'group-hover:text-emerald-500' },
];

export function WordBankSelect() {
  const { wordBanks, isLoadingBanks, error, selectWordBank } = useWords();

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

  const totalWords = wordBanks.reduce((sum, b) => sum + (b.total_words || 0), 0);

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto">
      {/* Hero */}
      <section className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-medium mb-4">
          <span>✨</span> 精选开源词库 · 数据来源 ECDICT
        </span>
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">选择词库</h2>
        <p className="text-gray-500 max-w-xl mx-auto">按考试大纲精选高频词汇，从最常用的单词开始你的学习之旅。</p>
      </section>

      {/* 学习资源概览 */}
      {wordBanks.length > 0 && (
        <section
          aria-label="词库概览"
          className="grid grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto mb-10"
        >
          <div className="rounded-2xl bg-white/70 border border-gray-100 px-3 py-4 text-center backdrop-blur-sm">
            <div className="text-2xl sm:text-3xl font-bold text-indigo-600">{wordBanks.length}</div>
            <div className="text-xs sm:text-sm text-gray-500 mt-1">个词库</div>
          </div>
          <div className="rounded-2xl bg-white/70 border border-gray-100 px-3 py-4 text-center backdrop-blur-sm">
            <div className="text-2xl sm:text-3xl font-bold text-indigo-600">{totalWords.toLocaleString()}</div>
            <div className="text-xs sm:text-sm text-gray-500 mt-1">收录单词</div>
          </div>
          <div className="rounded-2xl bg-white/70 border border-gray-100 px-3 py-4 text-center backdrop-blur-sm">
            <div className="text-2xl sm:text-3xl font-bold text-indigo-600">MIT</div>
            <div className="text-xs sm:text-sm text-gray-500 mt-1">开源许可</div>
          </div>
        </section>
      )}

      {/* 词库卡片网格 */}
      {wordBanks.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-gray-500 font-medium">暂无可用词库</p>
          <p className="text-gray-400 text-sm mt-1">请稍后再来看看</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wordBanks.map((bank, index) => {
            const theme = CARD_THEMES[index % CARD_THEMES.length];
            return (
              <button
                key={bank.id}
                onClick={() => selectWordBank(bank)}
                aria-label={`${bank.name}，${bank.description}，共 ${bank.total_words} 词，点击开始学习`}
                className={`group relative p-6 bg-white border-2 border-gray-100 rounded-2xl ${theme.ring} hover:shadow-xl transition-all text-left overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2`}
              >
                {/* Decorative gradient */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-60 group-hover:opacity-100 transition-opacity" />

                {/* Card Number Badge */}
                <div className="absolute top-4 right-4 w-8 h-8 bg-gray-100 group-hover:bg-white/80 rounded-full flex items-center justify-center text-xs font-bold text-gray-400 transition-colors">
                  {index + 1}
                </div>

                <div className="relative">
                  {/* Icon */}
                  <div className={`w-14 h-14 bg-gradient-to-br ${theme.icon} rounded-xl flex items-center justify-center text-2xl shadow-lg ${theme.glow} mb-4 group-hover:scale-110 transition-transform`}>
                    {theme.emoji}
                  </div>

                  {/* Title */}
                  <h3 className={`text-xl font-bold text-gray-900 mb-2 ${theme.badgeHover} transition-colors`}>{bank.name}</h3>

                  {/* Description */}
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">{bank.description}</p>

                  {/* Stats */}
                  <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-1.5 ${theme.badge} px-3 py-1.5 rounded-full`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span className="text-sm font-medium">{bank.total_words} 词</span>
                    </div>

                    <div className={`flex items-center gap-1 text-gray-400 text-sm ${theme.arrow} transition-colors`}>
                      <span>开始学习</span>
                      <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
