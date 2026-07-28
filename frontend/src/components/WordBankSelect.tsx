/**
 * WordBankSelect - 词库选择界面
 */

import { useWords } from '../hooks/useWords';

export function WordBankSelect() {
  const { wordBanks, isLoadingBanks, error, selectWordBank } = useWords();

  if (isLoadingBanks) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载词库中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">选择词库</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wordBanks.map((bank) => (
          <button
            key={bank.id}
            onClick={() => selectWordBank(bank)}
            className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:shadow-lg transition-all text-left"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{bank.name}</h3>
              <span className="text-2xl">📚</span>
            </div>
            <p className="text-gray-600 text-sm mb-3">{bank.description}</p>
            <div className="flex items-center text-sm text-indigo-600">
              <span>{bank.total_words} 个单词</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
