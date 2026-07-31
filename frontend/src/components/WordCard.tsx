/**
 * WordCard - 单词学习卡片
 * REQ-UI-003 + REQ-WORD-001 + REQ-WORD-003
 */

import { useWords } from '../hooks/useWords';
import { useProgress } from '../hooks/useProgress';
import { usePronunciation } from '../hooks/usePronunciation';
import { useUserStore } from '../stores/userStore';

export function WordCard() {
  const { currentWord, currentWordIndex, totalWords, nextWord, prevWord, goToWord, isLoadingWords } = useWords();
  const { toggleMastered, isWordMastered, progressStats, isLoading: isProgressLoading } = useProgress();
  const { status: pronunciationStatus, error: pronunciationError, play: playPronunciation, stop: stopPronunciation, currentWordId: playingWordId } = usePronunciation();
  const { isAuthenticated } = useUserStore();

  if (isLoadingWords) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!currentWord) {
    return (
      <div className="p-8 text-center text-gray-500">
        暂无单词
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
    await playPronunciation(currentWord.id, 'us');
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>进度: {currentWordIndex + 1} / {totalWords}</span>
          {progressStats && (
            <span>已掌握: {progressStats.mastered_words} / {progressStats.total_words}</span>
          )}
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${((currentWordIndex + 1) / totalWords) * 100}%` }}
          />
        </div>
      </div>

      {/* Word Card */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        {/* Spelling with Pronunciation Button - REQ-WORD-003 */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <h1 data-testid="word-spelling" className="text-5xl font-bold text-gray-900">{currentWord.spelling}</h1>
            {isAuthenticated && (
              <button
                data-testid="pronunciation-button"
                aria-label={isPronunciationPlaying ? '停止发音' : '播放发音'}
                onClick={handlePronunciation}
                disabled={isPronunciationLoading}
                className={`p-2 rounded-full transition-all ${
                  isPronunciationPlaying
                    ? 'bg-indigo-100 text-indigo-600 animate-pulse'
                    : isPronunciationLoading
                    ? 'bg-gray-100 text-gray-400'
                    : hasPronunciationError
                    ? 'bg-red-50 text-red-500'
                    : 'bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-600'
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
            <p className="text-xl text-gray-500">{currentWord.phonetic}</p>
          )}
          {/* Pronunciation error message */}
          {hasPronunciationError && (
            <p className="text-sm text-red-500 mt-1">{pronunciationError}</p>
          )}
        </div>

        {/* Meaning */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-lg text-gray-800">{currentWord.meaning}</p>
        </div>

        {/* Example Sentence */}
        {currentWord.example_sentence && (
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-1">例句:</p>
            <p className="text-gray-700 italic">"{currentWord.example_sentence}"</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevWord}
            disabled={currentWordIndex === 0}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← 上一个
          </button>

          {isAuthenticated && (
            <button
              onClick={handleToggleMastered}
              disabled={isProgressLoading}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isMastered
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isMastered ? '✓ 已掌握' : '○ 标记已掌握'}
            </button>
          )}

          <button
            onClick={nextWord}
            disabled={currentWordIndex === totalWords - 1}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            下一个 →
          </button>
        </div>
      </div>

      {/* Word Navigation Dots */}
      <div className="flex justify-center gap-1 mt-6 flex-wrap">
        {Array.from({ length: Math.min(totalWords, 50) }, (_, i) => (
          <button
            key={i}
            onClick={() => goToWord(i)}
            data-testid="nav-dot"
            aria-label={`跳转到第 ${i + 1} 个单词`}
            aria-current={i === currentWordIndex ? 'true' : undefined}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === currentWordIndex ? 'bg-indigo-600' : 'bg-gray-300 hover:bg-gray-400'
            }`}
          />
        ))}
        {totalWords > 50 && (
          <span className="text-xs text-gray-400 ml-2">...</span>
        )}
      </div>
    </div>
  );
}
