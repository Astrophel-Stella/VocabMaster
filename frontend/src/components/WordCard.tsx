/**
 * WordCard - 单词学习卡片
 * REQ-UI-003 + REQ-WORD-001 + REQ-WORD-003
 */

import { useWords } from '../hooks/useWords';
import { useProgress } from '../hooks/useProgress';
import { usePronunciation } from '../hooks/usePronunciation';
import { useUserStore } from '../stores/userStore';

export function WordCard() {
  const { currentWord, currentWordIndex, totalWords, words, nextWord, prevWord, goToWord, isLoadingWords } = useWords();
  const { toggleMastered, isWordMastered, progressStats, isLoading: isProgressLoading } = useProgress();
  const { status: pronunciationStatus, error: pronunciationError, play: playPronunciation, stop: stopPronunciation, currentWordId: playingWordId } = usePronunciation();
  const { isAuthenticated } = useUserStore();

  if (isLoadingWords) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">加载单词中...</p>
        </div>
      </div>
    );
  }

  if (!currentWord) {
    return (
      <div className="p-12 text-center">
        <div className="text-6xl mb-4">📭</div>
        <p className="text-gray-500 text-lg">暂无单词</p>
      </div>
    );
  }

  const isMastered = isWordMastered(currentWord.id);

  // Pronunciation state
  const isPronunciationLoading = pronunciationStatus === 'loading' && playingWordId === currentWord.id;
  const isPronunciationPlaying = pronunciationStatus === 'playing' && playingWordId === currentWord.id;
  const hasPronunciationError = pronunciationError && playingWordId === currentWord.id;

  const handleToggleMastered = async () => {
    if (!isAuthenticated) return;
    try {
      await toggleMastered(currentWord.id);
    } catch {
      // Error handled by hook
    }
  };

  const handlePronunciation = async () => {
    if (!isAuthenticated) {
      return;
    }

    // Stop if already playing this word
    if (isPronunciationPlaying) {
      stopPronunciation();
      return;
    }

    // Play pronunciation
    await playPronunciation(currentWord.id, currentWord.spelling, 'us');
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      {/* Progress Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center gap-2 text-sm text-gray-600 mb-3">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <span className="text-indigo-600 font-bold">{currentWordIndex + 1}</span>
            </div>
            <span className="text-gray-400">/</span>
            <span>{totalWords}</span>
          </div>
          {progressStats && (
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-50 rounded-full min-w-0">
              <div className="w-2 h-2 shrink-0 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-700 font-medium truncate">已掌握 {progressStats.mastered_words} / {progressStats.total_words}</span>
            </div>
          )}
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${((currentWordIndex + 1) / totalWords) * 100}%` }}
          />
        </div>
      </div>

      {/* Word Card */}
      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-5 sm:p-8 md:p-12 border border-gray-100">
        {/* Spelling with Pronunciation Button */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center flex-wrap gap-3 sm:gap-4 mb-3">
            <h1 data-testid="word-spelling" className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 tracking-tight break-words max-w-full">{currentWord.spelling}</h1>
            {isAuthenticated && (
              <button
                data-testid="pronunciation-button"
                aria-label={isPronunciationPlaying ? '停止发音' : '播放发音'}
                onClick={handlePronunciation}
                disabled={isPronunciationLoading}
                className={`p-3 rounded-xl transition-all ${
                  isPronunciationPlaying
                    ? 'bg-indigo-100 text-indigo-600 animate-pulse'
                    : isPronunciationLoading
                    ? 'bg-gray-100 text-gray-400'
                    : hasPronunciationError
                    ? 'bg-red-50 text-red-500'
                    : 'bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-600 hover:scale-105'
                }`}
                title={hasPronunciationError ? pronunciationError : isPronunciationPlaying ? '播放中，点击停止' : '播放发音'}
              >
                {isPronunciationLoading ? (
                  <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : isPronunciationPlaying ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                  </svg>
                )}
              </button>
            )}
          </div>
          {currentWord.phonetic && (
            <p className="text-xl text-gray-400 font-mono">{currentWord.phonetic}</p>
          )}
          {/* Pronunciation error message */}
          {hasPronunciationError && (
            <p className="text-sm text-red-500 mt-2">{pronunciationError}</p>
          )}
        </div>

        {/* Meaning */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl p-6 mb-8 border border-gray-100">
          <p data-testid="word-meaning" className="text-lg md:text-xl text-gray-800 leading-relaxed">{currentWord.meaning}</p>
        </div>

        {/* Example Sentence */}
        {currentWord.example_sentence && (
          <div className="mb-8 bg-indigo-50/50 rounded-xl p-5 border border-indigo-100">
            <div className="flex items-start gap-2">
              <span className="text-indigo-400 mt-1">💬</span>
              <div>
                <p className="text-xs text-gray-500 mb-1">例句</p>
                <p className="text-gray-700 italic leading-relaxed">"{currentWord.example_sentence}"</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <button
            onClick={prevWord}
            disabled={currentWordIndex === 0}
            aria-label="上一个"
            className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">上一个</span>
          </button>

          {isAuthenticated && (
            <button
              onClick={handleToggleMastered}
              disabled={isProgressLoading}
              aria-pressed={isMastered}
              className={`shrink-0 px-4 sm:px-6 py-3.5 rounded-xl font-medium transition-all flex items-center gap-2 ${
                isMastered
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-200/50'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isMastered ? (
                <>
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  已掌握
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="whitespace-nowrap">标记已掌握</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={nextWord}
            disabled={currentWordIndex >= words.length - 1}
            aria-label="下一个"
            className="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium shadow-lg shadow-indigo-200/50 flex items-center justify-center gap-2"
          >
            <span className="hidden sm:inline">下一个</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Word Navigation Dots */}
      <div className="flex justify-center gap-1.5 mt-8 flex-wrap">
        {Array.from({ length: Math.min(words.length, 50) }, (_, i) => (
          <button
            key={i}
            onClick={() => goToWord(i)}
            data-testid="nav-dot"
            aria-label={`跳转到第 ${i + 1} 个单词`}
            aria-current={i === currentWordIndex ? 'true' : undefined}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              i === currentWordIndex
                ? 'bg-indigo-600 scale-125'
                : isWordMastered(currentWord.id)
                  ? 'bg-green-400 hover:bg-green-500'
                  : 'bg-gray-300 hover:bg-gray-400'
            }`}
          />
        ))}
        {totalWords > 50 && (
          <span className="text-xs text-gray-400 ml-2 self-center">+{totalWords - 50} 更多</span>
        )}
      </div>
    </div>
  );
}
