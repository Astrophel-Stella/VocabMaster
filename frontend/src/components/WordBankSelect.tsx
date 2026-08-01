/**
 * WordBankSelect - 词库选择界面
 */

import { useWords } from '../hooks/useWords';

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

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">选择词库</h2>
        <p className="text-gray-500">选择一个词库开始你的学习之旅</p>
      </div>

      {/* Word Bank Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wordBanks.map((bank, index) => (
          <button
            key={bank.id}
            onClick={() => selectWordBank(bank)}
            className="group relative p-6 bg-white border-2 border-gray-100 rounded-2xl hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-100/50 transition-all text-left overflow-hidden"
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
              <p className="text-gray-500 text-sm mb-4 line-clamp-2">{bank.description}</p>

              {/* Stats */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span className="text-sm font-medium">{bank.total_words} 词</span>
                </div>

                <div className="flex items-center gap-1 text-gray-400 text-sm group-hover:text-indigo-400 transition-colors">
                  <span>点击开始</span>
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
